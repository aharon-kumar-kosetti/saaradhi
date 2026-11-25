import {
  EMPTY_FIELDS,
  type ExtractionFields,
  type ExtractionResult,
  type FieldConfidence,
  type Language,
  type NoticeCategory,
} from './extraction.types.js';
import {
  normalizeAmount,
  normalizeDate,
  normalizeDocuments,
  normalizeReference,
} from './normalize.js';

interface DepartmentRule {
  pattern: RegExp;
  department: string;
}

/** Order matters: the first rule that matches wins. Names mirror the registry. */
const DEPARTMENT_RULES: DepartmentRule[] = [
  { pattern: /apspdcl|ఆంధ్రప్రదేశ్\s+దక్షిణ\s+విద్యుత్|andhra pradesh southern power/i, department: 'APSPDCL' },
  { pattern: /tgspdcl|తెలంగాణ\s+విద్యుత్|telangana southern power/i, department: 'TGSPDCL' },
  { pattern: /ayushman|ఆయుష్మాన్|आयुष्मान/i, department: 'Ayushman Bharat' },
  { pattern: /municipal|ghmc|నగరపాలక|नगर\s*निगम/i, department: 'Greater Hyderabad Municipal Corporation' },
  { pattern: /health\s+department|स्वास्थ्य|ఆరోగ్య\s*శాఖ/i, department: 'Health department' },
];

const CURRENCY_AMOUNT = /(?:₹|రూ\.?|रु\.?|rs\.?|inr)\s*([\d][\d,]*(?:\.\d{1,2})?)/i;

const DATE_LABEL =
  /(?:due\s*date|last\s*date|pay\s*by|चुकाने की तिथि|अंतिम तिथि|देय तिथि|చివరి తేదీ|చెల్లించాల్సిన తేదీ)\s*[:\-–]?\s*(\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4})/i;

const ANY_DATE = /(\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4})/;

const REFERENCE_LABEL =
  /(?:reference\s*(?:number|no)|ref(?:erence)?\s*no|service\s*(?:number|no)|consumer\s*(?:number|no)|ptin|సర్వీస్\s*నంబర్|రెఫరెన్స్\s*నంబర్|संदर्भ\s*संख्या|सर्विस\s*नंबर|उपभोक्ता\s*संख्या)\s*[):.\-–]*\s*([A-Za-z0-9][A-Za-z0-9/\-]{2,})/i;

const DOCUMENTS_LABEL =
  /(?:documents?\s*(?:required|to\s*bring|needed)|required\s*documents|కావలసిన\s*పత్రాలు|జత\s*చేయవలసిన\s*పత్రాలు|आवश्यक\s*दस्तावेज़|आवश्यक\s*दस्तावेज)\s*[:\-–]\s*([^\n]+)/i;

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/gi;
const BARE_DOMAIN =
  /\b(?:[a-z0-9][a-z0-9-]*\.)+(?:com|in|net|org|gov|xyz|top|click|icu|buzz|rest|info|co|io)\b/gi;

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'rb.gy', 'is.gd'];
const SUSPICIOUS_TLDS = ['.xyz', '.top', '.click', '.icu', '.buzz', '.rest'];

const URGENCY =
  /(ఈరోజే|ఇప్పుడే|వెంటనే|కట్\s*అవుతుంది|तुरंत|आज ही|वरना|कट\s*जाएगा|बंद\s*हो\s*जाएगा|immediately|today only|within\s*\d+\s*(?:hours|hrs)|last chance|will be (?:cut|blocked|suspended))/i;

interface NoticeTypeRule {
  pattern: RegExp;
  noticeType: string;
}

const NOTICE_TYPE_RULES: NoticeTypeRule[] = [
  { pattern: /(?:बीमा|బీమా|insurance)[^\n]{0,40}(?:रद्द|రద్దు|cancel|suspend|बंद|closed)/i, noticeType: 'insurance_suspended' },
  { pattern: /renew|నవీనీకరణ|नवीनीकरण/i, noticeType: 'insurance_renewal' },
  { pattern: /property\s*tax|ఆస్తి\s*పన్ను|संपत्ति\s*कर/i, noticeType: 'property_tax_demand' },
  { pattern: /disconnect|కట్|कट|తొలగింపు|will be cut/i, noticeType: 'bill_overdue_disconnection' },
  { pattern: /bill|బిల్లు|बिल/i, noticeType: 'bill_due' },
];

/**
 * Deterministic offline reader for the plain-text test notices in /data/notices.
 * It never guesses: anything it cannot see stays null. Gemini handles real photos.
 */
export class TextNoticeExtractor {
  extract(text: string): ExtractionResult {
    const source = text.slice(0, 20_000);
    // Links carry words like "ayushman" that are not the issuing department; match on the body.
    const body = source.replace(URL_PATTERN, ' ');
    const urls = extractUrls(source);
    const amount = normalizeAmount(firstMatch(source, CURRENCY_AMOUNT, 1));
    const dueDate =
      normalizeDate(firstMatch(source, DATE_LABEL, 1)) ??
      normalizeDate(firstMatch(source, ANY_DATE, 1));
    const reference = normalizeReference(firstMatch(source, REFERENCE_LABEL, 1));
    const department = firstDepartment(body);
    const documents = normalizeDocuments(firstMatch(source, DOCUMENTS_LABEL, 1) ?? null);
    const language = detectLanguage(source);
    const suspicious = hasSuspiciousLink(urls) || URGENCY.test(body);

    const fields: ExtractionFields = {
      ...EMPTY_FIELDS,
      department,
      category: detectCategory({ department, suspicious }),
      notice_type: detectNoticeType(body),
      language,
      amount,
      due_date: dueDate,
      reference_number: reference,
      urls,
      required_documents: documents,
    };

    const confidence: FieldConfidence = {
      department: department ? 0.7 : 0,
      category: fields.category ? 0.6 : 0,
      notice_type: fields.notice_type ? 0.6 : 0,
      language: language ? 0.95 : 0,
      amount: amount ? 0.9 : 0,
      due_date: dueDate ? 0.9 : 0,
      reference_number: reference ? 0.85 : 0,
      urls: urls.length > 0 ? 0.95 : 0,
      required_documents: documents.length > 0 ? 0.8 : 0,
    };

    const warnings: string[] = [];
    if (hasSuspiciousLink(urls)) warnings.push('suspicious_link');
    if (URGENCY.test(body)) warnings.push('urgent_language');
    if (!department && !amount && !dueDate && !reference && urls.length === 0) {
      warnings.push('nothing_found');
    }

    return {
      source: 'text',
      model: null,
      fields,
      confidence,
      missing: missingList(fields),
      warnings,
    };
  }
}

function firstMatch(text: string, pattern: RegExp, group: number): string | null {
  const match = pattern.exec(text);
  return match?.[group] ?? null;
}

function firstDepartment(text: string): string | null {
  for (const rule of DEPARTMENT_RULES) {
    if (rule.pattern.test(text)) return rule.department;
  }
  return null;
}

function detectCategory(input: {
  department: string | null;
  suspicious: boolean;
}): NoticeCategory | null {
  if (input.suspicious) return 'scam_fraud';
  if (!input.department) return null;
  if (input.department === 'APSPDCL' || input.department === 'TGSPDCL') return 'financial_utility';
  if (input.department === 'Greater Hyderabad Municipal Corporation') return 'financial_utility';
  if (input.department === 'Ayushman Bharat' || input.department === 'Health department') {
    return 'health_insurance';
  }
  return 'other';
}

function detectNoticeType(text: string): string | null {
  for (const rule of NOTICE_TYPE_RULES) {
    if (rule.pattern.test(text)) return rule.noticeType;
  }
  return null;
}

function extractUrls(text: string): string[] {
  const full = [...text.matchAll(URL_PATTERN)].map((match) => match[0].replace(/[.,;:)"'\]>]+$/, ''));
  const bare = [...text.matchAll(BARE_DOMAIN)].map((match) => match[0].toLowerCase());
  const seen = new Set<string>(full);
  for (const domain of bare) {
    // A bare match that is part of a full URL adds nothing.
    if (full.some((url) => url.toLowerCase().includes(domain))) continue;
    seen.add(domain);
  }
  return [...seen].slice(0, 10);
}

function hasSuspiciousLink(urls: string[]): boolean {
  return urls.some((url) => {
    const host = url.replace(/^https?:\/\//i, '').split('/')[0]?.toLowerCase() ?? '';
    return (
      SHORTENERS.some((shortener) => host === shortener || host.endsWith(`.${shortener}`)) ||
      SUSPICIOUS_TLDS.some((tld) => host.endsWith(tld))
    );
  });
}

function detectLanguage(text: string): Language | null {
  const telugu = (text.match(/[\u0C00-\u0C7F]/g) ?? []).length;
  const hindi = (text.match(/[\u0900-\u097F]/g) ?? []).length;
  if (telugu === 0 && hindi === 0) return text.trim() ? 'en' : null;
  return telugu >= hindi ? 'te' : 'hi';
}

function missingList(fields: ExtractionFields): ExtractionResult['missing'] {
  const missing: ExtractionResult['missing'] = [];
  for (const [name, value] of Object.entries(fields) as [keyof ExtractionFields, unknown][]) {
    if (value === null || (Array.isArray(value) && value.length === 0)) missing.push(name);
  }
  return missing;
}

