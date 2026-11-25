import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { TextNoticeExtractor } from '../src/extraction/text.extractor.js';
import { loadRegistry } from '../src/scam/registry.js';
import { ScamService } from '../src/scam/scam.service.js';

import { expectedFiles, sourceFileFor, type ExpectedNotice } from './helpers/notices.js';

interface Row {
  file: string;
  isReal: boolean;
  expected: string;
  actual: string;
  reasons: string;
  ok: boolean;
}

const LABELS = new Set(['safe', 'suspicious', 'dangerous', 'unsure']);

describe('scam labels on /data/notices', () => {
  it('labels every notice, or lists every wrong label', async () => {
    const files = expectedFiles();
    expect(files.length, 'no *.expected.json found in /data/notices').toBeGreaterThan(0);

    const extractor = new TextNoticeExtractor();
    const scam = new ScamService();
    const registry = loadRegistry();

    const rows: Row[] = [];
    const skipped: string[] = [];

    for (const expectedPath of files) {
      const expected = JSON.parse(readFileSync(expectedPath, 'utf8')) as ExpectedNotice;
      const source = sourceFileFor(expectedPath, expected);

      // Photos need a Gemini key, so they cannot be labelled here yet.
      if (!source || !source.endsWith('.txt')) {
        skipped.push(`${expected.file}: ${source ? 'photo/PDF, not measured' : 'no source file'}`);
        continue;
      }

      const extraction = extractor.extract(readFileSync(source, 'utf8'));
      const verdict = await scam.check(
        { fields: extraction.fields, warnings: extraction.warnings },
        { registry, expand: async () => null },
      );

      rows.push({
        file: expected.file,
        isReal: expected.is_real,
        expected: expected.expected_scam_label,
        actual: verdict.label,
        reasons: verdict.reasons.join(', '),
        ok: verdict.label === expected.expected_scam_label,
      });
    }

    // eslint-disable-next-line no-console
    console.table(rows);

    if (skipped.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`Skipped (not measured):\n${skipped.join('\n')}`);
    }

    const wrong = rows
      .filter((row) => !row.ok)
      .map((row) => `${row.file}: expected "${row.expected}", got "${row.actual}" (${row.reasons})`);

    expect(wrong).toEqual([]);

    // A false "safe" would be the worst outcome, so it is checked separately.
    const falseSafe = rows
      .filter((row) => !row.isReal && row.actual === 'safe')
      .map((row) => row.file);
    expect(falseSafe).toEqual([]);

    // Real notices must not be called dangerous or suspicious without a verified registry.
    const falseAccusations = rows
      .filter((row) => row.isReal && (row.actual === 'dangerous' || row.actual === 'suspicious'))
      .map((row) => `${row.file}: ${row.actual} (${row.reasons})`);
    expect(falseAccusations).toEqual([]);

    for (const row of rows) {
      expect(LABELS.has(row.actual), `${row.file} returned an unknown label`).toBe(true);
    }
  });
});
