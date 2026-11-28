import type { AuthError } from '@supabase/supabase-js';

import type { TKey } from '@/i18n/translations';

type AuthErrorLike = Pick<AuthError, 'name' | 'message'> & {
  code?: string;
  status?: number;
};

/** A failed fetch has no HTTP status and no Supabase error code; everything else does. */
function isNetworkFailure(error: AuthErrorLike): boolean {
  return error.name === 'AuthRetryableFetchError' || (error.status === undefined && !error.code);
}

const RATE_LIMIT_CODES = ['over_request_rate_limit', 'over_sms_send_rate_limit', 'over_email_send_rate_limit'];
const EXPIRED_CODES = ['otp_expired', 'token_has_expired', 'session_expired'];

/**
 * Maps a Supabase Auth error onto one of our own strings, so a failed request never surfaces raw
 * server text (which is English-only and sometimes mentions internals) to a Telugu or Hindi user.
 */
export function authErrorKey(error: AuthErrorLike, stage: 'send' | 'verify' | 'google'): TKey {
  const code = error.code ?? '';

  if (isNetworkFailure(error)) return 'error.network';
  if (RATE_LIMIT_CODES.includes(code) || error.status === 429) return 'otp.rateLimited';
  if (stage === 'verify' && EXPIRED_CODES.includes(code)) return 'otp.expired';
  if (stage === 'send' && (code === 'validation_failed' || error.status === 400)) return 'phone.invalid';
  if (code === 'phone_not_confirmed' || code === 'phone_exists') return 'otp.invalid';
  if (stage === 'google') return 'auth.googleFailed';
  return stage === 'verify' ? 'otp.invalid' : 'error.generic';
}
