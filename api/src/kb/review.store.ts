import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { Language } from '../extraction/extraction.types.js';

export const REVIEW_REASONS = [
  'scam_unsure',
  'no_kb_answer',
  'low_ocr_confidence',
  'user_request',
  'wrong_translation',
] as const;
export type ReviewReason = (typeof REVIEW_REASONS)[number];

export interface ReviewEntry {
  id: string;
  reason: ReviewReason;
  summary: string;
  language: Language;
  consent: true;
  status: 'open';
  created_at: string;
}

export interface ReviewInput {
  reason: ReviewReason;
  language: Language;
  department: string | null;
  category: string | null;
  notice_type: string | null;
}

const MAX_ENTRIES = 500;

/**
 * Development queue: a JSON file next to the API package, gitignored. There is no admin table
 * wired yet (M6), and the queue must survive an API restart so a request is not silently lost.
 */
function queuePath(): string {
  return path.join(process.cwd(), '.data', 'review-queue.json');
}

function readQueue(): ReviewEntry[] {
  const file = queuePath();
  if (!existsSync(file)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    return Array.isArray(parsed) ? (parsed.filter(isEntry) as ReviewEntry[]) : [];
  } catch {
    return [];
  }
}

function isEntry(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<ReviewEntry>;
  return typeof record.id === 'string' && typeof record.reason === 'string' && record.consent === true;
}

/**
 * The summary is built from codes and department names only. There is deliberately no free-text
 * field, so a notice's contents and the user's details cannot reach the queue from here.
 */
export function enqueueReview(input: ReviewInput): ReviewEntry {
  const entry: ReviewEntry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    reason: input.reason,
    summary: [input.department, input.category, input.notice_type].filter(Boolean).join(' / ') || 'none',
    language: input.language,
    consent: true,
    status: 'open',
    created_at: new Date().toISOString(),
  };

  const queue = [...readQueue(), entry].slice(-MAX_ENTRIES);
  const directory = path.dirname(queuePath());
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
  writeFileSync(queuePath(), JSON.stringify(queue, null, 2), 'utf8');
  return entry;
}

export function reviewCount(): number {
  return readQueue().length;
}
