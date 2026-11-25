import { describe, expect, it } from 'vitest';

import { EMPTY_FIELDS, type ExtractionFields } from '../extraction/extraction.types.js';
import type { RegistryEntry } from './registry.js';
import { ScamService } from './scam.service.js';

function fields(overrides: Partial<ExtractionFields>): ExtractionFields {
  return { ...EMPTY_FIELDS, ...overrides };
}

const REGISTRY: RegistryEntry[] = [
  {
    department: 'APSPDCL',
    state: 'AP',
    domains: ['apspdcl.in'],
    payment_gateways: [],
    ref_regex: 'APSD/\\d{4}/\\d{7}',
    helpline: null,
    portal_url: null,
    verified: false,
    last_verified: null,
  },
];

const VERIFIED_REGISTRY: RegistryEntry[] = REGISTRY.map((entry) => ({ ...entry, verified: true }));

const noExpansion = () => async () => null;

describe('ScamService', () => {
  const scam = new ScamService();

  it('never says safe while the registry entry is unverified', async () => {
    const result = await scam.check(
      { fields: fields({ department: 'APSPDCL', urls: ['https://apspdcl.in/pay'] }) },
      { registry: REGISTRY, expand: noExpansion() },
    );

    expect(result.label).toBe('unsure');
    expect(result.reasons).toContain('registry_entry_unverified');
  });

  it('says safe only with a verified registry entry and an official link', async () => {
    const result = await scam.check(
      {
        fields: fields({
          department: 'APSPDCL',
          urls: ['https://apspdcl.in/pay'],
          reference_number: 'APSD/2026/0041827',
        }),
      },
      { registry: VERIFIED_REGISTRY, expand: noExpansion() },
    );

    expect(result.label).toBe('safe');
    expect(result.reasons).toContain('no_warning_signs');
  });

  it('does not say safe without a link even when the department is verified', async () => {
    const result = await scam.check(
      { fields: fields({ department: 'APSPDCL' }) },
      { registry: VERIFIED_REGISTRY, expand: noExpansion() },
    );

    expect(result.label).toBe('unsure');
    expect(result.reasons).toContain('no_link_to_check');
  });

  it('marks a lookalike domain with urgency as dangerous', async () => {
    const result = await scam.check(
      {
        fields: fields({ department: 'APSPDCL', urls: ['https://apspdcl-bill.xyz/pay'] }),
        warnings: ['urgent_language'],
      },
      { registry: REGISTRY, expand: noExpansion() },
    );

    expect(result.label).toBe('dangerous');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['lookalike_domain', 'suspicious_domain_ending', 'urgent_language']),
    );
  });

  it('marks a shortened link with a threat as dangerous even when expansion fails', async () => {
    const result = await scam.check(
      { fields: fields({ urls: ['https://bit.ly/ayushman-verify'] }), warnings: ['urgent_language'] },
      { registry: REGISTRY, expand: noExpansion() },
    );

    expect(result.label).toBe('dangerous');
    expect(result.reasons).toContain('shortened_link');
    expect(result.expansion_failed).toBe(true);
  });

  it('judges the destination a shortened link resolves to', async () => {
    const result = await scam.check(
      { fields: fields({ urls: ['https://bit.ly/x'] }) },
      { registry: REGISTRY, expand: async () => 'https://apspdcl.in.evil.click/pay' },
    );

    expect(result.label).toBe('dangerous');
    expect(result.reasons).toEqual(expect.arrayContaining(['lookalike_domain', 'suspicious_domain_ending']));
    expect(result.links[0]?.resolved_to).toBe('https://apspdcl.in.evil.click/pay');
  });

  it('treats a raw IP payment link as dangerous', async () => {
    const result = await scam.check(
      { fields: fields({ urls: ['http://103.21.44.9/pay'] }) },
      { registry: REGISTRY, expand: noExpansion() },
    );

    expect(result.label).toBe('dangerous');
    expect(result.reasons).toContain('ip_address_link');
  });

  it('treats urgency alone as suspicious, not dangerous', async () => {
    const result = await scam.check(
      { fields: fields({ amount: 500 }), warnings: ['urgent_language'] },
      { registry: REGISTRY, expand: noExpansion() },
    );

    expect(result.label).toBe('suspicious');
    expect(result.reasons).toEqual(expect.arrayContaining(['urgent_language', 'no_link_to_check']));
  });

  it('raises a QR payment request', async () => {
    const result = await scam.check(
      { fields: fields({}), warnings: ['qr_payment_request'] },
      { registry: REGISTRY, expand: noExpansion() },
    );

    expect(result.reasons).toContain('qr_payment_request');
  });

  it('reports a reference that does not match the department format', async () => {
    const result = await scam.check(
      {
        fields: fields({
          department: 'APSPDCL',
          urls: ['https://apspdcl.in/pay'],
          reference_number: 'XX-123',
        }),
      },
      { registry: REGISTRY, expand: noExpansion() },
    );

    expect(result.reasons).toContain('reference_format_mismatch');
    expect(result.label).toBe('suspicious');
  });

  it('works with an empty registry by staying unsure and saying so', async () => {
    const result = await scam.check(
      { fields: fields({ department: 'APSPDCL', urls: ['https://apspdcl.in/pay'] }) },
      { registry: [], expand: noExpansion() },
    );

    expect(result.label).toBe('unsure');
    expect(result.registry.entry_found).toBe(false);
    expect(result.reasons).toContain('unverified_domain');
  });
});
