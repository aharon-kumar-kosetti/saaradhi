import type { Language, NoticeCategory } from '@/types/notice';

/** Mirrors /api/src/extraction/extraction.types.ts. Change both together. */
export const EXTRACTION_FIELDS = [
  'department',
  'category',
  'notice_type',
  'language',
  'amount',
  'due_date',
  'reference_number',
  'urls',
  'required_documents',
] as const;

export type ExtractionFieldName = (typeof EXTRACTION_FIELDS)[number];

/** What was read off a notice. Nothing here is trusted: accuracy is the user's to confirm. */
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

export type ExtractionSource = 'gemini' | 'text' | 'demo';

export interface ExtractionResult {
  source: ExtractionSource;
  model: string | null;
  fields: ExtractionFields;
  confidence: FieldConfidence;
  missing: ExtractionFieldName[];
  /** Machine codes only; the app translates them. Never notice text. */
  warnings: string[];
}

export interface ExtractorStatus {
  configured: boolean;
  model: string | null;
  demoIds: string[];
}
