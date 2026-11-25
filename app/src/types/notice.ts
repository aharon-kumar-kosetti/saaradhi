export type Language = 'te' | 'hi' | 'en';

export type ScamLabel = 'safe' | 'suspicious' | 'dangerous' | 'unsure';

export type NoticeCategory =
  | 'health_insurance'
  | 'financial_utility'
  | 'community_service'
  | 'scam_fraud'
  | 'other';

/** Reasons are plain language, per language, never a single certainty claim. */
export type Localized = Record<Language, string>;
export type LocalizedList = Record<Language, string[]>;

export interface Notice {
  id: string;
  title: Localized;
  category: NoticeCategory;
  /** Display name only. "Official" is decided by the registry, never here. */
  department: string;
  amount?: number;
  dueDate?: string;
  referenceNumber?: string;
  scam: {
    label: ScamLabel;
    reasons: LocalizedList;
  };
}
