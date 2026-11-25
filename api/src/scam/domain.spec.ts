import { describe, expect, it } from 'vitest';

import {
  hasSuspiciousEnding,
  hostOf,
  isIpHost,
  isLookalike,
  isOfficial,
  isShortener,
  levenshtein,
  registrableDomain,
} from './domain.js';

const OFFICIAL = ['apspdcl.in', 'ghmc.gov.in'];

describe('hostOf', () => {
  it('reads hosts from full URLs and bare domains', () => {
    expect(hostOf('https://apspdcl.in/pay')).toBe('apspdcl.in');
    expect(hostOf('apspdcl.in')).toBe('apspdcl.in');
    expect(hostOf('HTTP://APS@ApSpDcL.IN:8080/x')).toBe('apspdcl.in');
  });

  it('rejects words that are not hosts', () => {
    expect(hostOf('apspdcl')).toBeNull();
    expect(hostOf('   ')).toBeNull();
  });
});

describe('registrableDomain', () => {
  it('keeps second-level Indian suffixes together', () => {
    expect(registrableDomain('ghmc.gov.in')).toBe('ghmc.gov.in');
    expect(registrableDomain('pay.ghmc.gov.in')).toBe('ghmc.gov.in');
    expect(registrableDomain('apspdcl-bill.xyz')).toBe('apspdcl-bill.xyz');
  });
});

describe('link classification', () => {
  it('knows the shorteners from the registry rules', () => {
    expect(isShortener('bit.ly', ['bit.ly', 'tinyurl.com'])).toBe(true);
    expect(isShortener('notbit.ly', ['bit.ly'])).toBe(false);
  });

  it('flags suspicious endings only on the real suffix', () => {
    expect(hasSuspiciousEnding('apspdcl-bill.xyz', ['.xyz'])).toBe(true);
    expect(hasSuspiciousEnding('apspdcl.xyz.gov.in', ['.xyz'])).toBe(false);
  });

  it('treats subdomains of an official domain as official', () => {
    expect(isOfficial('pay.ghmc.gov.in', OFFICIAL)).toBe(true);
    expect(isOfficial('ghmc.gov.in.evil.com', OFFICIAL)).toBe(false);
  });

  it('detects the lookalike tricks listed in the registry', () => {
    expect(isLookalike('apspdcl-bill.xyz', OFFICIAL)).toBe(true);
    expect(isLookalike('apspdcl.in.evil.click', OFFICIAL)).toBe(true);
    expect(isLookalike('apspdcl1.in', OFFICIAL)).toBe(true);
    expect(isLookalike('apspdcl.in', OFFICIAL)).toBe(false);
    expect(isLookalike('pay.apspdcl.in', OFFICIAL)).toBe(false);
    expect(isLookalike('ghmc.gov.in', OFFICIAL)).toBe(false);
    expect(isLookalike('example.com', OFFICIAL)).toBe(false);
  });

  it('detects IP hosts', () => {
    expect(isIpHost('103.21.44.9')).toBe(true);
    expect(isIpHost('apspdcl.in')).toBe(false);
  });

  it('has an edit distance helper', () => {
    expect(levenshtein('apspdcl', 'apspdcl')).toBe(0);
    expect(levenshtein('apspdcl', 'apspdci')).toBe(1);
  });
});
