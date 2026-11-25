import type { Language } from '@/types/notice';

/** Mirrors /api/src/kb/kb.types.ts. Change both together. */
export const ADVICE_CODES = [
  'pay_at_listed_office',
  'pay_only_official_portal',
  'bring_last_receipt',
  'bring_id_proof',
  'keep_reference_number',
  'check_deadline',
  'visit_nearest_office',
  'ask_for_receipt',
  'never_share_otp',
  'verify_with_office',
] as const;

export type AdviceCode = (typeof ADVICE_CODES)[number];

export interface KbCitation {
  chunk_id: string;
  source_id: string;
  source_title: string;
  last_verified: string | null;
  verified: boolean;
}

export interface Explanation {
  language: Language;
  no_answer: boolean;
  advice: string[];
  citations: KbCitation[];
  helpline: string | null;
  placeholders_only: boolean;
  top_score: number;
  review_reason: 'no_kb_answer' | null;
}

export function isAdviceCode(value: string): value is AdviceCode {
  return (ADVICE_CODES as readonly string[]).includes(value);
}

export function isExplanation(value: unknown): value is Explanation {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Explanation>;
  return (
    typeof candidate.no_answer === 'boolean' &&
    Array.isArray(candidate.advice) &&
    Array.isArray(candidate.citations)
  );
}
