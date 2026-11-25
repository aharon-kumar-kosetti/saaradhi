/**
 * Design tokens from /docs/DESIGN_TOKENS.md. Keep this the only place screens read colors/spacing from.
 */
export const Colors = {
  primary: '#5B2EBF',
  background: '#FFFFFF',
  card: '#F6F7FB',
  text: '#1A1A1A',
  muted: '#5F6B7A',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  md: 12,
  lg: 16,
} as const;

// Elderly-first minimums; do not go below these.
export const Type = {
  body: 18,
  bodyLineHeight: 27,
  small: 16,
  heading: 28,
  touchTarget: 48,
  primaryButtonHeight: 56,
} as const;
