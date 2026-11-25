import { describe, expect, it } from 'vitest';

import { TextNoticeExtractor } from './text.extractor.js';

const extractor = new TextNoticeExtractor();

describe('TextNoticeExtractor', () => {
  it('leaves fields empty when the text has nothing readable', () => {
    const result = extractor.extract('ఏదో గీతలు మాత్రమే ఉన్నాయి');
    expect(result.fields.amount).toBeNull();
    expect(result.fields.due_date).toBeNull();
    expect(result.fields.reference_number).toBeNull();
    expect(result.fields.urls).toEqual([]);
    expect(result.warnings).toContain('nothing_found');
  });

  it('flags shortened links and urgency without deciding the final label', () => {
    const result = extractor.extract('Pay today only: https://bit.ly/xyz');
    expect(result.fields.category).toBe('scam_fraud');
    expect(result.warnings).toEqual(['suspicious_link', 'urgent_language']);
    expect(result.confidence.amount).toBe(0);
  });

  it('reads a bare domain as a link when no scheme is printed', () => {
    const result = extractor.extract('Check apspdcl.in for details');
    expect(result.fields.urls).toEqual(['apspdcl.in']);
    expect(result.warnings).not.toContain('suspicious_link');
  });

  it('detects the notice language from the script', () => {
    expect(extractor.extract('विद्युत बिल').fields.language).toBe('hi');
    expect(extractor.extract('విద్యుత్ బిల్లు').fields.language).toBe('te');
    expect(extractor.extract('Electricity bill').fields.language).toBe('en');
  });
});
