import Constants from 'expo-constants';
import { readAsStringAsync } from 'expo-file-system/legacy';

import type { ExtractionResult, ExtractorStatus } from '@/types/extraction';

export type ApiErrorCode =
  | 'not_configured'
  | 'unreadable'
  | 'too_large'
  | 'unsupported_type'
  | 'upstream_unavailable'
  | 'invalid_response'
  | 'offline'
  | 'server_error';

export class ApiError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
    this.name = 'ApiError';
  }
}

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

const DEFAULT_BASE_URL = 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 60_000;

function baseUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiUrl;
  const value = typeof configured === 'string' ? configured.trim() : '';
  return (value.length > 0 ? value : DEFAULT_BASE_URL).replace(/\/+$/, '');
}

/** The API only accepts these; anything else is refused before upload. */
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
  txt: 'text/plain',
};

export function mimeTypeFor(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXTENSION[extension] ?? '';
}

const KNOWN_CODES: ApiErrorCode[] = [
  'not_configured',
  'unreadable',
  'too_large',
  'unsupported_type',
  'upstream_unavailable',
  'invalid_response',
];

function toApiError(status: number, payload: unknown): ApiError {
  const code = typeof payload === 'object' && payload !== null ? (payload as { code?: unknown }).code : null;
  if (typeof code === 'string' && (KNOWN_CODES as string[]).includes(code)) {
    return new ApiError(code as ApiErrorCode);
  }
  // Status codes are the fallback so an unexpected body still means something to the user.
  if (status === 503) return new ApiError('not_configured');
  if (status === 413) return new ApiError('too_large');
  if (status === 415) return new ApiError('unsupported_type');
  if (status === 422) return new ApiError('unreadable');
  if (status === 502) return new ApiError('upstream_unavailable');
  return new ApiError('server_error');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl()}${path}`, { ...init, signal: controller.signal });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw toApiError(response.status, payload);
    if (payload === null) throw new ApiError('invalid_response');
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Aborts, DNS failures and offline all look the same to a user: the service was unreachable.
    throw new ApiError('offline');
  } finally {
    clearTimeout(timer);
  }
}

export function fetchExtractorStatus(): Promise<ExtractorStatus> {
  return request<ExtractorStatus>('/extract/status');
}

export function extractDemo(id: string): Promise<ExtractionResult> {
  return request<ExtractionResult>(`/extract/demo/${encodeURIComponent(id)}`, { method: 'POST' });
}

export async function extractFile(file: PickedFile): Promise<ExtractionResult> {
  const dataBase64 = await readAsStringAsync(file.uri, { encoding: 'base64' });
  return request<ExtractionResult>('/extract', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, mimeType: file.mimeType, dataBase64 }),
  });
}
