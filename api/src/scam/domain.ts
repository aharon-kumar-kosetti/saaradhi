/** Host utilities for link checks. No network access happens here. */

export function hostOf(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `http://${text}`;

  let host: string;
  try {
    host = new URL(withScheme).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return null;
  }
  // A bare word like "apspdcl" is not a host we can judge.
  if (!host || !host.includes('.')) return null;
  return host;
}

export function isIpHost(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':');
}

const SECOND_LEVEL = new Set(['co', 'gov', 'ac', 'net', 'org', 'edu', 'res', 'nic', 'com']);

/** Good enough without a public-suffix list: gov.in stays one domain, not two. */
export function registrableDomain(host: string): string {
  const labels = host.split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');
  const secondLast = labels[labels.length - 2] ?? '';
  if (SECOND_LEVEL.has(secondLast) && labels[labels.length - 1]?.length === 2) {
    return labels.slice(-3).join('.');
  }
  return labels.slice(-2).join('.');
}

export function isShortener(host: string, shorteners: string[]): boolean {
  const bare = host.replace(/^www\./, '');
  return shorteners.some((shortener) => bare === shortener || bare.endsWith(`.${shortener}`));
}

export function hasSuspiciousEnding(host: string, tlds: string[]): boolean {
  return tlds.some((tld) => host.endsWith(tld.toLowerCase()));
}

export function isOfficial(host: string, domains: string[]): boolean {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** 0/o, 1/l, 5/s, 3/e — the substitutions used by lookalike domains. */
function foldDigits(value: string): string {
  return value.replace(/0/g, 'o').replace(/1/g, 'l').replace(/5/g, 's').replace(/3/g, 'e');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min((current[j - 1] ?? 0) + 1, (previous[j] ?? 0) + 1, (previous[j - 1] ?? 0) + cost);
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/**
 * Compares against the registry's domains, including unverified ones: an unverified entry is
 * evidence that a link is imitating something, never evidence that it is genuine.
 */
export function isLookalike(host: string, officialDomains: string[]): boolean {
  for (const official of officialDomains) {
    if (!official || isOfficial(host, [official])) continue;

    const officialLabel = official.split('.')[0] ?? '';
    if (officialLabel.length < 4) continue;

    const hostLabel = host.split('.')[0] ?? '';
    // "apspdcl-bill.xyz", "apspdcl.in.pay-now.xyz": the real name is only a part of the host.
    if (host.includes(officialLabel) && registrableDomain(host) !== registrableDomain(official)) {
      return true;
    }
    if (foldDigits(hostLabel) === foldDigits(officialLabel)) return true;
    if (
      officialLabel.length >= 5 &&
      hostLabel.length >= 5 &&
      !hostLabel.includes(officialLabel) &&
      levenshtein(hostLabel, officialLabel) <= 2
    ) {
      return true;
    }
  }
  return false;
}
