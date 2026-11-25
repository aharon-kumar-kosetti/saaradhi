import {
  EMPTY_FIELDS,
  type ExtractionFields,
  type ExtractionResult,
  type FieldConfidence,
} from './extraction.types.js';
import { normalizeDate } from './normalize.js';

/**
 * Canned notices so the app can be demoed end-to-end before a Gemini key exists.
 * They are labelled `demo` and never pretend to have read the user's document.
 */
interface DemoNotice {
  id: string;
  fields: ExtractionFields;
  confidence: Partial<FieldConfidence>;
}

function dateIn(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return normalizeDate(date.toISOString().slice(0, 10)) ?? '';
}

const DEMO_NOTICES: DemoNotice[] = [
  {
    id: 'bill',
    fields: {
      ...EMPTY_FIELDS,
      department: 'APSPDCL',
      category: 'financial_utility',
      notice_type: 'bill_due',
      language: 'te',
      amount: 1850,
      due_date: dateIn(6),
      reference_number: 'APSD/2026/0041827',
      urls: [],
      required_documents: ['last paid receipt'],
    },
    confidence: { department: 0.8, amount: 0.95, due_date: 0.9, reference_number: 0.9 },
  },
  {
    id: 'health',
    fields: {
      ...EMPTY_FIELDS,
      department: 'Ayushman Bharat',
      category: 'health_insurance',
      notice_type: 'insurance_renewal',
      language: 'hi',
      amount: 1200,
      due_date: dateIn(21),
      reference_number: 'HLT/2026/88/4132',
      urls: ['https://health.ap.gov.in'],
      required_documents: ['ration card', 'Aadhaar copy'],
    },
    confidence: { department: 0.75, amount: 0.9, due_date: 0.85, reference_number: 0.85 },
  },
  {
    id: 'scam',
    fields: {
      ...EMPTY_FIELDS,
      department: null,
      category: 'scam_fraud',
      notice_type: 'bill_overdue_disconnection',
      language: 'te',
      amount: 4999,
      due_date: null,
      reference_number: null,
      urls: ['https://apspdcl-bill.xyz/pay'],
      required_documents: [],
    },
    confidence: { amount: 0.8, urls: 0.95 },
  },
];

export function demoNoticeIds(): string[] {
  return DEMO_NOTICES.map((notice) => notice.id);
}

export function buildDemoResult(id: string): ExtractionResult | null {
  const notice = DEMO_NOTICES.find((candidate) => candidate.id === id);
  if (!notice) return null;

  const confidence = { ...emptyConfidence(), ...notice.confidence };
  const fields = notice.fields;
  const missing = (Object.keys(fields) as (keyof ExtractionFields)[]).filter((name) => {
    const value = fields[name];
    return value === null || (Array.isArray(value) && value.length === 0);
  });

  return {
    source: 'demo',
    model: null,
    fields,
    confidence,
    missing,
    warnings: ['demo'],
  };
}

function emptyConfidence(): FieldConfidence {
  return {
    department: 0,
    category: 0,
    notice_type: 0,
    language: 0,
    amount: 0,
    due_date: 0,
    reference_number: 0,
    urls: 0,
    required_documents: 0,
  };
}
