import { apiRequest } from '@/lib/api';
import type { ExtractionFields } from '@/types/extraction';
import { isScamResult, type ScamResult } from '@/types/scam';
import type { ScamLabel } from '@/types/notice';

export interface ScamCheckInput {
  fields: ExtractionFields;
  warnings: string[];
}

/**
 * Returns null when the check could not be made. A missing verdict is shown as "not checked";
 * it must never be turned into "safe" to fill the gap.
 */
export async function checkScam(input: ScamCheckInput): Promise<ScamResult | null> {
  try {
    const result = await apiRequest<unknown>('/scam/check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fields: input.fields, warnings: input.warnings }),
    });
    return isScamResult(result) ? result : null;
  } catch {
    return null;
  }
}

export interface StoredScam {
  label: ScamLabel;
  reasons: string[];
  checkedAt: string;
}

/** Trims the server result down to what the notice screen needs, so no link data lingers. */
export function toStoredScam(result: ScamResult): StoredScam {
  return { label: result.label, reasons: result.reasons, checkedAt: new Date().toISOString() };
}
