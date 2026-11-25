export const NOTICE_CATEGORIES = [
  'health_insurance',
  'financial_utility',
  'community_service',
  'scam_fraud',
  'other',
] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

export const LANGUAGES = ['te', 'hi', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export type ExtractionFieldName =
  | 'department'
  | 'category'
  | 'notice_type'
  | 'language'
  | 'amount'
  | 'due_date'
  | 'reference_number'
  | 'urls'
  | 'required_documents';

export const EXTRACTION_FIELDS: ExtractionFieldName[] = [
  'department',
  'category',
  'notice_type',
  'language',
  'amount',
  'due_date',
  'reference_number',
  'urls',
  'required_documents',
];

/** What we read off a notice. Nothing here is trusted: scam/official checks come later. */
export interface ExtractionFields {
  department: string | null;
  category: NoticeCategory | null;
  notice_type: string | null;
  language: Language | null;
  amount: number | null;
  due_date: string | null;
  reference_number: string | null;
  urls: string[];
  required_documents: string[];
}

export type FieldConfidence = Record<ExtractionFieldName, number>;

export interface ExtractionResult {
  source: 'gemini' | 'text' | 'demo';
  model: string | null;
  fields: ExtractionFields;
  confidence: FieldConfidence;
  missing: ExtractionFieldName[];
  /** Machine codes, translated by the app. Never put notice text in here. */
  warnings: string[];
}

export const EMPTY_FIELDS: ExtractionFields = {
  department: null,
  category: null,
  notice_type: null,
  language: null,
  amount: null,
  due_date: null,
  reference_number: null,
  urls: [],
  required_documents: [],
};

export const EMPTY_CONFIDENCE: FieldConfidence = {
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

export function isNoticeCategory(value: unknown): value is NoticeCategory {
  return typeof value === 'string' && (NOTICE_CATEGORIES as readonly string[]).includes(value);
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

export function missingFields(fields: ExtractionFields): ExtractionFieldName[] {
  return EXTRACTION_FIELDS.filter((name) => {
    const value = fields[name];
    return value === null || (Array.isArray(value) && value.length === 0);
  });
}

export type ExtractionErrorCode =
  | 'not_configured'
  | 'unreadable'
  | 'too_large'
  | 'unsupported_type'
  | 'upstream_unavailable'
  | 'invalid_response';

export class ExtractionError extends Error {
  constructor(readonly code: ExtractionErrorCode) {
    super(code);
    this.name = 'ExtractionError';
  }
}
