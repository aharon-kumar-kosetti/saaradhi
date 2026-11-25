export const SCAM_LABELS = ['safe', 'suspicious', 'dangerous', 'unsure'] as const;
export type ScamLabel = (typeof SCAM_LABELS)[number];

/** Machine codes only. The app owns the te/hi/en wording, so reasons never carry notice text. */
export const SCAM_REASONS = [
  'shortened_link',
  'lookalike_domain',
  'suspicious_domain_ending',
  'ip_address_link',
  'insecure_link',
  'unverified_domain',
  'urgent_language',
  'qr_payment_request',
  'reference_format_mismatch',
  'registry_entry_unverified',
  'no_link_to_check',
  'no_warning_signs',
] as const;
export type ScamReasonCode = (typeof SCAM_REASONS)[number];

export type LinkFlag =
  | 'shortened'
  | 'lookalike'
  | 'suspicious_ending'
  | 'ip_address'
  | 'insecure'
  | 'unverified'
  | 'official_candidate';

export interface LinkCheck {
  url: string;
  host: string | null;
  flags: LinkFlag[];
  /** Where a shortened link actually points, when expansion succeeded. */
  resolved_to: string | null;
}

export interface RegistryMatch {
  entry_found: boolean;
  department: string | null;
  /** True only for entries a human confirmed. Never inferred by code. */
  verified: boolean;
}

export interface ScamResult {
  label: ScamLabel;
  score: number;
  reasons: ScamReasonCode[];
  links: LinkCheck[];
  registry: RegistryMatch;
  /** Shorteners we could not resolve (network blocked). Worth telling the user plainly. */
  expansion_failed: boolean;
}

export const SCAM_ERROR_CODES = ['invalid_body'] as const;
export type ScamErrorCode = (typeof SCAM_ERROR_CODES)[number];
