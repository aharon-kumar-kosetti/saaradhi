import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ExtractionFields, ExtractionSource, FieldConfidence } from '@/types/extraction';

/** Guest promise: nothing is kept longer than this. */
export const NOTICE_RETENTION_DAYS = 90;

const NOTICES_KEY = 'saaradhi.notices.v1';

export interface LocalNotice {
  id: string;
  createdAt: string;
  fileName: string;
  source: ExtractionSource;
  /** The values the user confirmed, not the raw model output. */
  fields: ExtractionFields;
  confidence: FieldConfidence;
  warnings: string[];
}

function isLocalNotice(value: unknown): value is LocalNotice {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<LocalNotice>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.fileName === 'string' &&
    typeof candidate.source === 'string' &&
    typeof candidate.fields === 'object' &&
    candidate.fields !== null
  );
}

function isFresh(notice: LocalNotice, now: number): boolean {
  const created = Date.parse(notice.createdAt);
  if (Number.isNaN(created)) return false;
  return now - created < NOTICE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

async function write(notices: LocalNotice[]): Promise<void> {
  await AsyncStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
}

export async function loadLocalNotices(): Promise<LocalNotice[]> {
  const raw = await AsyncStorage.getItem(NOTICES_KEY);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const now = Date.now();
  const all = parsed.filter(isLocalNotice);
  const fresh = all.filter((notice) => isFresh(notice, now));
  // Drop expired entries now so the 90-day promise holds even if nobody opens the app for months.
  if (fresh.length !== all.length) await write(fresh);
  return fresh;
}

export async function saveLocalNotice(notice: LocalNotice): Promise<LocalNotice[]> {
  const existing = await loadLocalNotices();
  const withoutDuplicate = existing.filter((item) => item.id !== notice.id);
  const next = [notice, ...withoutDuplicate];
  await write(next);
  return next;
}

export async function findLocalNotice(id: string): Promise<LocalNotice | undefined> {
  const notices = await loadLocalNotices();
  return notices.find((notice) => notice.id === id);
}

export async function deleteLocalNotice(id: string): Promise<LocalNotice[]> {
  const remaining = (await loadLocalNotices()).filter((notice) => notice.id !== id);
  await write(remaining);
  return remaining;
}

export function newNoticeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
