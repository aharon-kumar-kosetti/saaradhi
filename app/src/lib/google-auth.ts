import { requireSupabase } from './supabase';

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; reason: 'cancelled' | 'unavailable' | 'not_configured' | 'failed' };

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

let cached: GoogleModule | null | undefined;

/**
 * The native module only exists in a development/production build. Expo Go has no
 * RNGoogleSignin, and importing it there throws during module init, so the import itself is
 * deferred and guarded. That keeps phone and guest sign-in working in Expo Go.
 */
async function loadGoogleModule(): Promise<GoogleModule | null> {
  if (cached !== undefined) return cached;
  try {
    cached = await import('@react-native-google-signin/google-signin');
  } catch {
    cached = null;
  }
  return cached;
}

const webClientId = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '').trim();

/**
 * Opens the native Google account picker and exchanges the resulting ID token for a Supabase
 * session. The ID token is verified by Supabase against the client IDs configured there; the app
 * never holds a client secret.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!webClientId) return { ok: false, reason: 'not_configured' };

  const google = await loadGoogleModule();
  if (!google) return { ok: false, reason: 'unavailable' };

  try {
    google.GoogleSignin.configure({ webClientId, offlineAccess: false });
    await google.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await google.GoogleSignin.signIn();
    if (google.isCancelledResponse(response)) return { ok: false, reason: 'cancelled' };
    if (!google.isSuccessResponse(response)) return { ok: false, reason: 'failed' };

    const token = response.data.idToken;
    if (!token) return { ok: false, reason: 'failed' };

    const { error } = await requireSupabase().auth.signInWithIdToken({ provider: 'google', token });
    if (error) return { ok: false, reason: 'failed' };
    return { ok: true };
  } catch (error) {
    if (google.isErrorWithCode(error)) {
      if (error.code === google.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { ok: false, reason: 'unavailable' };
      }
      // IN_PROGRESS means a second tap while the picker is open: not a failure to report.
      if (error.code === google.statusCodes.IN_PROGRESS) return { ok: false, reason: 'cancelled' };
    }
    if (error instanceof Error && error.message === 'supabase_not_configured') {
      return { ok: false, reason: 'not_configured' };
    }
    return { ok: false, reason: 'failed' };
  }
}
