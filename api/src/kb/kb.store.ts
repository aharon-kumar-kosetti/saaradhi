import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { isLanguage } from '../extraction/extraction.types.js';
import type { KbChunk, KbSource } from './kb.types.js';

export interface KbCorpus {
  sources: KbSource[];
  chunks: KbChunk[];
  directory: string | null;
}

interface RawFile {
  source?: Record<string, unknown>;
  chunks?: unknown[];
}

/** The API runs from /api; walk up so /kb is found from tests and from `node dist/main`. */
export function findKbDirectory(start = process.cwd()): string | null {
  let directory = path.resolve(start);
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = path.join(directory, 'kb', 'chunks');
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return null;
}

function text(value: unknown, max = 120): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function stringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => text(entry, 60))
    .filter((entry): entry is string => entry !== null)
    .slice(0, max);
}

/**
 * Malformed files are skipped instead of throwing: a broken chunk must not take the API down,
 * and an empty corpus simply means every question gets "no answer".
 */
export function loadCorpus(directory: string | null = findKbDirectory()): KbCorpus {
  if (!directory) return { sources: [], chunks: [], directory: null };

  const sources: KbSource[] = [];
  const chunks: KbChunk[] = [];

  for (const name of readdirSync(directory).filter((file) => file.endsWith('.json')).sort()) {
    let raw: RawFile;
    try {
      raw = JSON.parse(readFileSync(path.join(directory, name), 'utf8')) as RawFile;
    } catch {
      continue;
    }

    const source = raw.source;
    const id = text(source?.id, 80);
    const title = text(source?.title, 120);
    const department = text(source?.department, 80);
    const language = isLanguage(source?.language) ? source?.language : 'en';
    if (!id || !title || !department || !Array.isArray(raw.chunks)) continue;

    const lastVerified = typeof source?.last_verified === 'string' ? source.last_verified : null;
    sources.push({
      id,
      department,
      title,
      url: text(source?.url, 300),
      language,
      last_verified: lastVerified,
      placeholder: source?.placeholder !== false,
    });

    for (const entry of raw.chunks) {
      if (!entry || typeof entry !== 'object') continue;
      const record = entry as Record<string, unknown>;
      const chunkId = text(record.id, 80);
      const content = text(record.content, 2000);
      if (!chunkId || !content) continue;

      chunks.push({
        id: chunkId,
        source_id: id,
        content,
        topics: stringList(record.topics, 12),
        advice: stringList(record.advice, 6),
      });
    }
  }

  return { sources, chunks, directory };
}
