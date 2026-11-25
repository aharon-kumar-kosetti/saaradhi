import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { EMPTY_FIELDS, type ExtractionFields } from '../extraction/extraction.types.js';
import { ExplainService } from './explain.service.js';
import { enqueueReview, reviewCount } from './review.store.js';

function fields(overrides: Partial<ExtractionFields>): ExtractionFields {
  return { ...EMPTY_FIELDS, ...overrides };
}

const QUEUE_FILE = path.join(process.cwd(), '.data', 'review-queue.json');

describe('ExplainService', () => {
  const explainer = new ExplainService();

  it('reports the local hybrid backend and seeded corpus', () => {
    const status = explainer.status();
    expect(status.backend).toBe('local-hybrid');
    expect(status.chunks).toBeGreaterThanOrEqual(6);
    // Nothing in the seed corpus is verified, and the status must say so.
    expect(status.verified_sources).toBe(0);
  });

  it('explains an electricity notice with advice and citations', () => {
    const result = explainer.explain({
      language: 'te',
      fields: fields({
        department: 'APSPDCL',
        category: 'financial_utility',
        notice_type: 'bill_overdue_disconnection',
      }),
    });

    expect(result.no_answer).toBe(false);
    expect(result.advice).toContain('pay_at_listed_office');
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0]?.last_verified).toBeNull();
    expect(result.placeholders_only).toBe(true);
    expect(result.language).toBe('te');
  });

  it('gives no answer at all when there is nothing to search', () => {
    const result = explainer.explain({ language: 'hi', fields: fields({}) });

    expect(result.no_answer).toBe(true);
    expect(result.advice).toEqual([]);
    expect(result.citations).toEqual([]);
    expect(result.review_reason).toBe('no_kb_answer');
  });

  it('returns the helpline only when the registry has one', () => {
    const result = explainer.explain({
      language: 'en',
      fields: fields({ department: 'APSPDCL', category: 'financial_utility' }),
    });
    // The registry ships helpline: "TODO", so there is nothing to show and nothing is invented.
    expect(result.helpline).toBeNull();
  });
});

describe('review queue', () => {
  afterAll(() => {
    if (existsSync(QUEUE_FILE)) rmSync(QUEUE_FILE);
  });

  it('queues a request that carries codes only', () => {
    const before = reviewCount();
    const entry = enqueueReview({
      reason: 'no_kb_answer',
      language: 'te',
      department: 'APSPDCL',
      category: 'financial_utility',
      notice_type: 'bill_due',
    });

    expect(entry.consent).toBe(true);
    expect(entry.status).toBe('open');
    expect(entry.summary).toBe('APSPDCL / financial_utility / bill_due');
    expect(reviewCount()).toBe(before + 1);
  });
});
