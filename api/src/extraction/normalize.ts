import {
  isLanguage,
  isNoticeCategory,
  type Language,
  type NoticeCategory,
} from './extraction.types.js';

const MAX_TEXT = 120;

/** Trimmed single-line text; drops control characters that would break the app's JSON. */
export function cleanText(value: unknown, maxLength = MAX_TEXT): string | null {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

/** "₹1,850.00" -> 1850. Rejects zero, negatives and implausible amounts. */
export function normalizeAmount(value: unknown): number | null {
  if (typeof value === 'number') return isPlausibleAmount(value) ? round(value) : null;
  if (typeof value !== 'string') return null;

  // Currency labels leave a leading dot ("రూ. 4,999"): drop anything before the first digit.
  const digits = value
    .replace(/[^\d.,-]/g, '')
    .replace(/,/g, '')
    .replace(/^[^\d]+/, '');
  if (!digits) return null;
  const parsed = Number.parseFloat(digits);
  return isPlausibleAmount(parsed) ? round(parsed) : null;
}

function isPlausibleAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value < 100_000_000;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Notice dates are day-first (30/11/2026). Accepts ISO too, rejects impossible days
 * instead of guessing, because a wrong due date is worse than no date.
 */
export function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (iso) {
    return buildIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const dayFirst = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/.exec(text);
  if (dayFirst) {
    const year = Number(dayFirst[3]);
    const fullYear = year < 100 ? 2000 + year : year;
    return buildIso(fullYear, Number(dayFirst[2]), Number(dayFirst[1]));
  }

  return null;
}

function buildIso(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function normalizeReference(value: unknown): string | null {
  const text = cleanText(value, 60);
  if (!text) return null;
  const trimmed = text.replace(/^[:\-–\s]+/, '').replace(/[.,;]+$/, '');
  return trimmed ? trimmed : null;
}

export function normalizeCategory(value: unknown): NoticeCategory | null {
  return isNoticeCategory(value) ? value : null;
}

export function normalizeLanguage(value: unknown): Language | null {
  return isLanguage(value) ? value : null;
}

/** Only http(s) links; drops fragments and trailing punctuation the OCR tends to pick up. */
export function normalizeUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const url = entry.trim().replace(/[.,;:)"'\]>]+$/, '');
    if (!/^https?:\/\/[^\s]+$/i.test(url)) continue;
    seen.add(url);
  }
  return [...seen].slice(0, 10);
}

export function normalizeDocuments(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const seen = new Set<string>();
  for (const entry of list) {
    const text = cleanText(entry, 80);
    if (text) seen.add(text);
  }
  return [...seen].slice(0, 12);
}

export function clampConfidence(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}
