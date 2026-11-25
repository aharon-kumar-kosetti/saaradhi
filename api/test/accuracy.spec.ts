import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { ExtractionResult } from '../src/extraction/extraction.types.js';
import { GeminiExtractor } from '../src/extraction/gemini.extractor.js';
import { TextNoticeExtractor } from '../src/extraction/text.extractor.js';

const NOTICES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/notices',
);

interface ExpectedNotice {
  file: string;
  is_real: boolean;
  language: string;
  category: string;
  department: string;
  notice_type: string;
  amount: number | null;
  due_date: string | null;
  reference_number: string | null;
  urls_on_notice: string[];
  expected_scam_label: string;
  required_documents: string[];
  notes?: string;
}

interface Row {
  file: string;
  field: string;
  expected: string;
  actual: string;
  ok: boolean;
}

/** Every *.expected.json under /data/notices, so new photos are picked up automatically. */
function expectedFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return expectedFiles(full);
    return entry.name.endsWith('.expected.json') ? [full] : [];
  });
}

function compare(expected: ExpectedNotice, actual: ExtractionResult): Row[] {
  const rows: Omit<Row, 'ok'>[] = [
    { field: 'language', expected: expected.language, actual: text(actual.fields.language) },
    { field: 'category', expected: expected.category, actual: text(actual.fields.category) },
    { field: 'department', expected: expected.department, actual: text(actual.fields.department) },
    { field: 'notice_type', expected: expected.notice_type, actual: text(actual.fields.notice_type) },
    { field: 'amount', expected: text(expected.amount), actual: text(actual.fields.amount) },
    { field: 'due_date', expected: text(expected.due_date), actual: text(actual.fields.due_date) },
    {
      field: 'reference_number',
      expected: text(expected.reference_number),
      actual: text(actual.fields.reference_number),
    },
    {
      field: 'urls_on_notice',
      expected: list(expected.urls_on_notice),
      actual: list(actual.fields.urls),
    },
    {
      field: 'required_documents',
      expected: list(expected.required_documents),
      actual: list(actual.fields.required_documents),
    },
  ];

  return rows.map((row) => ({ ...row, file: expected.file, ok: row.expected === row.actual }));
}

function text(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

function list(values: string[]): string {
  return values.length === 0 ? '—' : [...values].sort().join(' | ');
}

describe('extraction accuracy on /data/notices', () => {
  it('matches every expected field, or reports each mismatch', async () => {
    const files = expectedFiles(NOTICES_DIR);
    expect(files.length, 'no *.expected.json found in /data/notices').toBeGreaterThan(0);

    const extractor = new TextNoticeExtractor();
    const apiKey = (process.env.GEMINI_API_KEY ?? '').trim();
    const model = (process.env.GEMINI_MODEL ?? '').trim() || 'gemini-2.5-flash';
    const rows: Row[] = [];
    const skipped: string[] = [];

    for (const expectedPath of files) {
      const expected = JSON.parse(readFileSync(expectedPath, 'utf8')) as ExpectedNotice;
      const directory = path.dirname(expectedPath);
      const sourceName = path.basename(expected.file);
      const textPath = path.join(directory, sourceName);
      const baseName = sourceName.replace(/\.[^.]+$/, '');
      const imagePath = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
        .map((extension) => path.join(directory, `${baseName}.${extension}`))
        .find((candidate) => existsSync(candidate));

      let actual: ExtractionResult | null = null;
      if (existsSync(textPath) && textPath.endsWith('.txt')) {
        actual = extractor.extract(readFileSync(textPath, 'utf8'));
      } else if (imagePath && apiKey) {
        actual = await new GeminiExtractor(apiKey, model).extract(
          readFileSync(imagePath),
          imagePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        );
      } else {
        skipped.push(`${sourceName}: ${imagePath ? 'GEMINI_API_KEY not set' : 'no source file'}`);
        continue;
      }

      rows.push(...compare(expected, actual));
    }

    const failures = rows.filter((row) => !row.ok);
    // eslint-disable-next-line no-console
    console.table(rows.map(({ file, field, expected, actual, ok }) => ({ file, field, expected, actual, ok })));
    if (skipped.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`Skipped (not measured):\n${skipped.join('\n')}`);
    }

    expect(
      failures.map((row) => `${row.file} → ${row.field}: expected "${row.expected}", got "${row.actual}"`),
    ).toEqual([]);
  });
});
