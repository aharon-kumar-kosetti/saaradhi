import { describe, expect, it } from 'vitest';

import {
  clampConfidence,
  normalizeAmount,
  normalizeDate,
  normalizeDocuments,
  normalizeReference,
  normalizeUrls,
} from './normalize.js';

describe('normalizeAmount', () => {
  it('accepts Indian grouping and currency noise', () => {
    expect(normalizeAmount('₹1,850')).toBe(1850);
    expect(normalizeAmount('రూ. 4,999.50')).toBe(4999.5);
    expect(normalizeAmount('Rs. 12,34,567')).toBe(1234567);
    expect(normalizeAmount(1850)).toBe(1850);
  });

  it('rejects zero, negatives and nonsense', () => {
    expect(normalizeAmount('')).toBeNull();
    expect(normalizeAmount('0')).toBeNull();
    expect(normalizeAmount(-5)).toBeNull();
    expect(normalizeAmount('Rs. 999999999999')).toBeNull();
    expect(normalizeAmount(null)).toBeNull();
  });
});

describe('normalizeDate', () => {
  it('reads Indian day-first dates and ISO dates', () => {
    expect(normalizeDate('30/11/2026')).toBe('2026-11-30');
    expect(normalizeDate('5-1-27')).toBe('2027-01-05');
    expect(normalizeDate('2026-11-30')).toBe('2026-11-30');
  });

  it('refuses impossible or partial dates instead of guessing', () => {
    expect(normalizeDate('31/02/2026')).toBeNull();
    expect(normalizeDate('30 November 2026')).toBeNull();
    expect(normalizeDate('11/2026')).toBeNull();
    expect(normalizeDate('30/11/1899')).toBeNull();
  });
});

describe('normalizeUrls', () => {
  it('keeps http(s) links only and removes duplicates', () => {
    expect(
      normalizeUrls([
        'https://apspdcl.in/pay',
        'https://apspdcl.in/pay',
        'apspdcl.in',
        'javascript:alert(1)',
        42,
      ]),
    ).toEqual(['https://apspdcl.in/pay']);
  });

  it('strips trailing punctuation picked up by OCR', () => {
    expect(normalizeUrls(['https://bit.ly/abc).'])).toEqual(['https://bit.ly/abc']);
  });
});

describe('normalizeReference', () => {
  it('trims label punctuation', () => {
    expect(normalizeReference(': APSD/2026/0041827.')).toBe('APSD/2026/0041827');
    expect(normalizeReference('   ')).toBeNull();
  });
});

describe('normalizeDocuments and confidence', () => {
  it('splits, trims and dedupes document names', () => {
    expect(normalizeDocuments('last paid receipt, ownership proof, last paid receipt')).toEqual([
      'last paid receipt',
      'ownership proof',
    ]);
  });

  it('clamps confidence into 0..1', () => {
    expect(clampConfidence(1.4, 0.5)).toBe(1);
    expect(clampConfidence(-1, 0.5)).toBe(0);
    expect(clampConfidence('high', 0.5)).toBe(0.5);
  });
});
