/**
 * Dial codes for the countries Saaradhi's users actually come from (Andhra/Telangana first, then
 * the Gulf and Anglophone destinations people migrate to). `lengths` are the accepted national
 * number lengths after the country code, without leading zeros.
 */
export interface Country {
  code: string;
  name: string;
  dial: string;
  lengths: number[];
  /** Some countries only allocate mobiles in a narrower range; validate it before spending an SMS. */
  mobilePattern?: RegExp;
}

export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dial: '+91', lengths: [10], mobilePattern: /^[6-9]\d{9}$/ },
  { code: 'US', name: 'United States', dial: '+1', lengths: [10], mobilePattern: /^[2-9]\d{9}$/ },
  { code: 'GB', name: 'United Kingdom', dial: '+44', lengths: [10], mobilePattern: /^7\d{9}$/ },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', lengths: [9], mobilePattern: /^5\d{8}$/ },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', lengths: [9], mobilePattern: /^5\d{8}$/ },
  { code: 'QA', name: 'Qatar', dial: '+974', lengths: [8] },
  { code: 'KW', name: 'Kuwait', dial: '+965', lengths: [8] },
  { code: 'OM', name: 'Oman', dial: '+968', lengths: [8] },
  { code: 'SG', name: 'Singapore', dial: '+65', lengths: [8], mobilePattern: /^[89]\d{7}$/ },
  { code: 'MY', name: 'Malaysia', dial: '+60', lengths: [9, 10], mobilePattern: /^1\d{8,9}$/ },
  { code: 'AU', name: 'Australia', dial: '+61', lengths: [9], mobilePattern: /^4\d{8}$/ },
  { code: 'CA', name: 'Canada', dial: '+1', lengths: [10], mobilePattern: /^[2-9]\d{9}$/ },
  { code: 'NZ', name: 'New Zealand', dial: '+64', lengths: [8, 9] },
  { code: 'NP', name: 'Nepal', dial: '+977', lengths: [10], mobilePattern: /^9\d{9}$/ },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', lengths: [9], mobilePattern: /^7\d{8}$/ },
  { code: 'BD', name: 'Bangladesh', dial: '+880', lengths: [10], mobilePattern: /^1\d{9}$/ },
  { code: 'ZA', name: 'South Africa', dial: '+27', lengths: [9] },
  { code: 'DE', name: 'Germany', dial: '+49', lengths: [10, 11] },
  { code: 'IE', name: 'Ireland', dial: '+353', lengths: [9], mobilePattern: /^8\d{8}$/ },
  { code: 'IT', name: 'Italy', dial: '+39', lengths: [10] },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

/** India defaults to +91 but a stray leading 0 (+91 0 98765 43210) must still validate. */
function nationalDigits(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits.replace(/^0+/, '');
}

/** Returns E.164 (e.g. +919876543210) or null when the number cannot be valid for this country. */
export function toE164(country: Country, input: string): string | null {
  const national = nationalDigits(input);
  if (national.length === 0) return null;
  if (!country.lengths.includes(national.length)) return null;
  if (country.mobilePattern && !country.mobilePattern.test(national)) return null;
  return `${country.dial}${national}`;
}

/** "+91 98••••••10": enough for the user to recognise the number, not enough to leak it. */
export function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  if (digits.length <= 5) return e164;
  const national = digits.slice(-10);
  const dial = e164.slice(0, e164.length - national.length);
  const head = national.slice(0, 2);
  const tail = national.slice(-2);
  return `${dial} ${head}${'•'.repeat(Math.max(national.length - 4, 2))}${tail}`;
}

/** Digits only, for a TextInput that must not accept letters or spacer characters. */
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}
