import type { ExtractionResult } from '@/types/extraction';

export interface PendingExtraction {
  fileName: string;
  result: ExtractionResult;
}

/**
 * Holds one extraction between the reading and confirm screens. Kept in memory only:
 * nothing unconfirmed is written to disk, and a restart simply asks for the notice again.
 */
let pending: PendingExtraction | null = null;

export function setPendingExtraction(value: PendingExtraction): void {
  pending = value;
}

export function peekPendingExtraction(): PendingExtraction | null {
  return pending;
}

export function takePendingExtraction(): PendingExtraction | null {
  const value = pending;
  pending = null;
  return value;
}
