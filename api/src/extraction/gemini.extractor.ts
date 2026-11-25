import {
  EMPTY_CONFIDENCE,
  EMPTY_FIELDS,
  ExtractionError,
  type ExtractionFields,
  type ExtractionResult,
  type FieldConfidence,
} from './extraction.types.js';
import {
  clampConfidence,
  cleanText,
  normalizeAmount,
  normalizeCategory,
  normalizeDate,
  normalizeDocuments,
  normalizeLanguage,
  normalizeReference,
  normalizeUrls,
} from './normalize.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 45_000;

const PROMPT = `You read Indian government and utility notices for elderly Telugu/Hindi readers.
Return only facts printed on the document. Never guess, never complete a partial number, and use null
when a value is not clearly visible. Copy amounts and dates exactly; do not convert currencies.
- department: the issuing body as printed (null if none).
- category: one of health_insurance, financial_utility, community_service, scam_fraud, other.
- notice_type: a short snake_case description of what the notice asks for.
- language: te, hi or en — the language most of the text is printed in.
- amount: total payable in rupees as a number, else null.
- due_date: YYYY-MM-DD, else null.
- reference_number: service/consumer/reference number exactly as printed, else null.
- urls: every link or domain printed on the notice.
- required_documents: documents the notice asks the reader to bring.
- confidence: 0 to 1 per field, based on how legible it was. Use 0 when null.
Do not decide whether the notice is genuine or a scam. Do not add advice or explanations.`;

/** The subset of the Gemini response we use; anything else is ignored. */
interface GeminiPayload {
  fields: ExtractionFields;
  confidence: FieldConfidence;
  warnings: string[];
}

export class GeminiExtractor {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  get modelName(): string {
    return this.model;
  }

  async extract(data: Buffer, mimeType: string): Promise<ExtractionResult> {
    const response = await fetch(`${ENDPOINT}/${encodeURIComponent(this.model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { inline_data: { mime_type: mimeType, data: data.toString('base64') } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: responseSchema(),
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => {
      throw new ExtractionError('upstream_unavailable');
    });

    if (!response.ok) {
      // Status only: the body can echo document text.
      throw new ExtractionError(
        response.status === 429 || response.status >= 500 ? 'upstream_unavailable' : 'invalid_response',
      );
    }

    const body = (await response.json().catch(() => null)) as GeminiResponse | null;
    const text = body?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();
    if (!text) throw new ExtractionError('invalid_response');

    return this.parse(text);
  }

  private parse(text: string): ExtractionResult {
    const json = stripCodeFence(text);
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch {
      throw new ExtractionError('invalid_response');
    }
    if (!raw || typeof raw !== 'object') throw new ExtractionError('invalid_response');

    const record = raw as Record<string, unknown>;
    const fields: ExtractionFields = {
      ...EMPTY_FIELDS,
      department: cleanText(record.department, 80),
      category: normalizeCategory(record.category),
      notice_type: cleanText(record.notice_type, 60),
      language: normalizeLanguage(record.language),
      amount: normalizeAmount(record.amount),
      due_date: normalizeDate(record.due_date),
      reference_number: normalizeReference(record.reference_number),
      urls: normalizeUrls(record.urls),
      required_documents: normalizeDocuments(record.required_documents),
    };

    const confidence = { ...EMPTY_CONFIDENCE };
    const rawConfidence =
      record.confidence && typeof record.confidence === 'object'
        ? (record.confidence as Record<string, unknown>)
        : {};
    for (const name of Object.keys(confidence) as (keyof FieldConfidence)[]) {
      const value = fields[name];
      const hasValue = value !== null && !(Array.isArray(value) && value.length === 0);
      confidence[name] = hasValue ? clampConfidence(rawConfidence[name], 0.7) : 0;
    }

    const payload: GeminiPayload = { fields, confidence, warnings: [] };
    return {
      source: 'gemini',
      model: this.model,
      fields: payload.fields,
      confidence: payload.confidence,
      missing: missingNames(fields),
      warnings: lowConfidenceWarnings(payload.confidence),
    };
  }
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
  }[];
}

function stripCodeFence(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  return (fenced?.[1] ?? text).trim();
}

function missingNames(fields: ExtractionFields): ExtractionResult['missing'] {
  return (Object.keys(fields) as (keyof ExtractionFields)[]).filter((name) => {
    const value = fields[name];
    return value === null || (Array.isArray(value) && value.length === 0);
  });
}

function lowConfidenceWarnings(confidence: FieldConfidence): string[] {
  const low = Object.entries(confidence)
    .filter(([, value]) => value > 0 && value < 0.6)
    .map(([name]) => name);
  return low.length > 0 ? ['low_confidence'] : [];
}

function responseSchema(): Record<string, unknown> {
  const nullableString = { type: 'STRING', nullable: true };
  return {
    type: 'OBJECT',
    properties: {
      department: nullableString,
      category: {
        type: 'STRING',
        enum: ['health_insurance', 'financial_utility', 'community_service', 'scam_fraud', 'other'],
        nullable: true,
      },
      notice_type: nullableString,
      language: { type: 'STRING', enum: ['te', 'hi', 'en'], nullable: true },
      amount: { type: 'NUMBER', nullable: true },
      due_date: nullableString,
      reference_number: nullableString,
      urls: { type: 'ARRAY', items: { type: 'STRING' } },
      required_documents: { type: 'ARRAY', items: { type: 'STRING' } },
      confidence: {
        type: 'OBJECT',
        properties: {
          department: { type: 'NUMBER' },
          category: { type: 'NUMBER' },
          notice_type: { type: 'NUMBER' },
          language: { type: 'NUMBER' },
          amount: { type: 'NUMBER' },
          due_date: { type: 'NUMBER' },
          reference_number: { type: 'NUMBER' },
          urls: { type: 'NUMBER' },
          required_documents: { type: 'NUMBER' },
        },
      },
    },
    required: [
      'department',
      'category',
      'notice_type',
      'language',
      'amount',
      'due_date',
      'reference_number',
      'urls',
      'required_documents',
    ],
  };
}
