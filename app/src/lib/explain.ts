import { apiRequest } from '@/lib/api';
import type { ExtractionFields } from '@/types/extraction';
import { isExplanation, type Explanation } from '@/types/explain';
import type { Language } from '@/types/notice';

/** Null means the explanation could not be fetched; the screen says so instead of guessing. */
export async function fetchExplanation(
  fields: ExtractionFields,
  language: Language,
): Promise<Explanation | null> {
  try {
    const result = await apiRequest<unknown>('/explain', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fields, language }),
    });
    return isExplanation(result) ? result : null;
  } catch {
    return null;
  }
}

export interface ReviewRequest {
  reason: 'no_kb_answer';
  language: Language;
  department: string | null;
  category: string | null;
  notice_type: string | null;
}

/**
 * Sends codes and a department name only. `consent: true` is required by the API, and the screen
 * asks the user before calling this.
 */
export async function requestReview(request: ReviewRequest): Promise<boolean> {
  try {
    await apiRequest<unknown>('/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...request, consent: true }),
    });
    return true;
  } catch {
    return false;
  }
}
