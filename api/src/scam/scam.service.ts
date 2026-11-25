import { Injectable } from '@nestjs/common';

import type { ExtractionFields } from '../extraction/extraction.types.js';
import {
  hasSuspiciousEnding,
  hostOf,
  isIpHost,
  isLookalike,
  isOfficial,
  isShortener,
} from './domain.js';
import { expandShortLink } from './expand.js';
import {
  findEntryByDepartment,
  loadRegistry,
  type RegistryEntry,
} from './registry.js';
import type {
  LinkCheck,
  LinkFlag,
  RegistryMatch,
  ScamLabel,
  ScamReasonCode,
  ScamResult,
} from './scam.types.js';

/** Points added per signal. Tuned so one serious trick is enough to clear `suspicious`. */
const WEIGHTS: Partial<Record<ScamReasonCode, number>> = {
  shortened_link: 40,
  lookalike_domain: 50,
  suspicious_domain_ending: 30,
  ip_address_link: 40,
  insecure_link: 10,
  unverified_domain: 15,
  urgent_language: 25,
  qr_payment_request: 25,
  // A number that cannot belong to the department is a real signal on its own.
  reference_format_mismatch: 25,
};

const DANGEROUS_AT = 60;
const SUSPICIOUS_AT = 25;

export interface ScamInput {
  fields: ExtractionFields;
  /** Machine codes from extraction (urgent_language, qr_payment_request...). */
  warnings?: string[];
}

export interface ScamOptions {
  registry?: RegistryEntry[];
  expand?: (url: string) => Promise<string | null>;
}

@Injectable()
export class ScamService {
  status() {
    const registry = loadRegistry();
    return {
      departments: registry.length,
      verified: registry.filter((entry) => entry.verified).length,
      rules: Object.keys(WEIGHTS),
    };
  }

  async check(input: ScamInput, options: ScamOptions = {}): Promise<ScamResult> {
    const registry = options.registry ?? loadRegistry();
    const shorteners = SHORTENERS;
    const suspiciousTlds = SUSPICIOUS_TLDS;
    const officialDomains = registry.flatMap((entry) => entry.domains);
    const expand =
      options.expand ??
      ((url: string) => expandShortLink(url, (host) => isShortener(host, shorteners)));

    const warnings = new Set(input.warnings ?? []);
    const weights = new Map<ScamReasonCode, number>();
    const raise = (code: ScamReasonCode) => {
      const weight = WEIGHTS[code];
      if (weight && !weights.has(code)) weights.set(code, weight);
    };

    const links: LinkCheck[] = [];
    let expansionFailed = false;

    for (const raw of input.fields.urls) {
      const host = hostOf(raw);
      if (!host) continue;

      const flags: LinkFlag[] = [];
      if (/^http:\/\//i.test(raw)) {
        flags.push('insecure');
        raise('insecure_link');
      }
      if (isIpHost(host)) {
        flags.push('ip_address');
        raise('ip_address_link');
      }

      let resolved: string | null = null;
      if (isShortener(host, shorteners)) {
        flags.push('shortened');
        raise('shortened_link');
        resolved = await expand(raw).catch(() => null);
        if (!resolved) expansionFailed = true;
      }

      const judgedHosts = [host, ...(resolved ? [hostOf(resolved)].filter(Boolean) : [])] as string[];

      for (const judged of judgedHosts) {
        if (isIpHost(judged)) {
          flags.push('ip_address');
          raise('ip_address_link');
        }
        if (hasSuspiciousEnding(judged, suspiciousTlds)) {
          flags.push('suspicious_ending');
          raise('suspicious_domain_ending');
        }
        if (isLookalike(judged, officialDomains)) {
          flags.push('lookalike');
          raise('lookalike_domain');
        }
        if (isOfficial(judged, officialDomains)) {
          flags.push('official_candidate');
        } else if (!isShortener(judged, shorteners)) {
          flags.push('unverified');
          raise('unverified_domain');
        }
      }

      links.push({ url: raw, host, flags: [...new Set(flags)], resolved_to: resolved });
    }

    if (warnings.has('urgent_language')) raise('urgent_language');
    if (warnings.has('qr_payment_request')) raise('qr_payment_request');

    const match = findEntryByDepartment(input.fields.department, registry);
    const registryMatch: RegistryMatch = {
      entry_found: match !== null,
      department: match?.department ?? null,
      verified: match?.verified === true,
    };

    if (match?.ref_regex && input.fields.reference_number && !matchesPattern(input.fields.reference_number, match.ref_regex)) {
      raise('reference_format_mismatch');
    }

    const officialLinkVerified = links.some(
      (link) =>
        link.host !== null &&
        registry.some((entry) => entry.verified && isOfficial(link.host ?? '', entry.domains)),
    );

    const score = [...weights.values()].reduce((total, weight) => total + weight, 0);
    let label: ScamLabel = 'unsure';
    if (score >= DANGEROUS_AT) label = 'dangerous';
    else if (score >= SUSPICIOUS_AT) label = 'suspicious';
    else if (officialLinkVerified) label = 'safe';

    // The gate that matters: no verified registry evidence, no "safe" — whatever the score says.
    if (label === 'safe' && !officialLinkVerified) label = 'unsure';
    if (label === 'unsure' && links.length === 0) {
      // Nothing to check, so say exactly that instead of implying the notice is clean.
      weights.clear();
    }

    const reasons = orderReasons(weights, { label, links: links.length, registryMatch, expansionFailed });

    return {
      label,
      score,
      reasons,
      links,
      registry: registryMatch,
      expansion_failed: expansionFailed,
    };
  }
}

/** Fixed order: the strongest, most actionable signals first. */
const REASON_ORDER: ScamReasonCode[] = [
  'lookalike_domain',
  'ip_address_link',
  'shortened_link',
  'suspicious_domain_ending',
  'qr_payment_request',
  'urgent_language',
  'reference_format_mismatch',
  'insecure_link',
  'unverified_domain',
  'registry_entry_unverified',
  'no_link_to_check',
  'no_warning_signs',
];

function orderReasons(
  weights: Map<ScamReasonCode, number>,
  context: { label: ScamLabel; links: number; registryMatch: RegistryMatch; expansionFailed: boolean },
): ScamReasonCode[] {
  const raised = new Set(weights.keys());

  if (context.links === 0) {
    raised.add('no_link_to_check');
  } else if (context.label === 'unsure' && context.registryMatch.entry_found && !context.registryMatch.verified) {
    raised.add('registry_entry_unverified');
  }
  if (context.label === 'safe') raised.add('no_warning_signs');
  // A failed expansion is not a verdict; the shortened_link reason already covers the risk.
  if (context.expansionFailed) raised.delete('no_warning_signs');

  return REASON_ORDER.filter((code) => raised.has(code));
}

function matchesPattern(value: string, pattern: string): boolean {
  try {
    // Registry patterns are written for whole-number checks; anchor the comparison.
    return new RegExp(`^(?:${pattern})$`).test(value);
  } catch {
    return true;
  }
}

/** Mirrors data/trusted_registry.json → global_rules. Duplicated so the checker works offline. */
const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'rb.gy', 'is.gd'];
const SUSPICIOUS_TLDS = ['.xyz', '.top', '.click', '.icu', '.buzz', '.rest'];
