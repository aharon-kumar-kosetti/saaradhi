import type { ScamLabel } from '@/types/notice';

/** Mirrors /api/src/scam/scam.types.ts. Change both together. */
export const SCAM_REASONS = [
  'shortened_link',
  'lookalike_domain',
  'suspicious_domain_ending',
  'ip_address_link',
  'insecure_link',
  'unverified_domain',
  'urgent_language',
  'qr_payment_request',
  'reference_format_mismatch',
  'registry_entry_unverified',
  'no_link_to_check',
  'no_warning_signs',
] as const;

export type ScamReasonCode = (typeof SCAM_REASONS)[number];

export interface ScamResult {
  label: ScamLabel;
  score: number;
  reasons: ScamReasonCode[];
  registry: { entry_found: boolean; department: string | null; verified: boolean };
  expansion_failed: boolean;
}

const LABELS: readonly string[] = ['safe', 'suspicious', 'dangerous', 'unsure'];

export function isScamResult(value: unknown): value is ScamResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ScamResult>;
  if (typeof candidate.label !== 'string' || !LABELS.includes(candidate.label)) return false;
  if (!Array.isArray(candidate.reasons)) return false;
  return true;
}

export function isScamReason(value: string): value is ScamReasonCode {
  return (SCAM_REASONS as readonly string[]).includes(value);
}
