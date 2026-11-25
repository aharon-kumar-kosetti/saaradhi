import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { ExtractionResult } from '../src/extraction/extraction.types.js';
import { GeminiExtractor } from '../src/extraction/gemini.extractor.js';
import { TextNoticeExtractor } from '../src/extraction/text.extractor.js';

import { expectedFiles, sourceFileFor, type ExpectedNotice } from './helpers/notices.js';

interface Row {
  file: string;
  field: string;
  expected: string;
  actual: string;
  ok: boolean;
}

function compare(expected: ExpectedNotice, actual: ExtractionResult): Row[] {
  const rows: Omit<Row, 'ok'>[] = [
    { field: 'language', expected: text(expected.language), actual: text(actual.fields.language) },
    { field: 'category', expected: text(expected.category), actual: text(actual.fields.category) },
    { field: 'department', expected: text(expected.department), actual: text(actual.fields.department) },
    { field: 'notice_type', expected: text(expected.notice_type), actual: text(actual.fields.notice_type) },
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
    const files = expectedFiles();
    expect(files.length, 'no *.expected.json found in /data/notices').toBeGreaterThan(0);

    const extractor = new TextNoticeExtractor();
    const apiKey = (process.env.GEMINI_API_KEY ?? '').trim();
    const model = (process.env.GEMINI_MODEL ?? '').trim() || 'gemini-2.5-flash';
    const rows: Row[] = [];
    const skipped: string[] = [];

    for (const expectedPath of files) {
      const expected = JSON.parse(readFileSync(expectedPath, 'utf8')) as ExpectedNotice;
      const source = sourceFileFor(expectedPath, expected);

      if (!source) {
        skipped.push(`${expected.file}: no source file`);
        continue;
      }

      let actual: ExtractionResult;
      if (source.endsWith('.txt')) {
        actual = extractor.extract(readFileSync(source, 'utf8'));
      } else if (apiKey) {
        actual = await new GeminiExtractor(apiKey, model).extract(
          readFileSync(source),
          source.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        );
      } else {
        skipped.push(`${path.basename(source)}: GEMINI_API_KEY not set`);
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
