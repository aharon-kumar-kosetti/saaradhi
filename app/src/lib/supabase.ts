import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { AUTH_STORAGE_KEY } from './storage';

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const anonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

/** Both values are public (the anon key is RLS-guarded). Missing env must disable auth, not crash. */
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        storageKey: AUTH_STORAGE_KEY,
        autoRefreshToken: true,
        persistSession: true,
        // No browser URL to read a session from on a phone.
        detectSessionInUrl: false,
      },
    })
  : null;

/** Throws rather than returning null, so a caller can never quietly skip authentication. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('supabase_not_configured');
  return supabase;
}

// A phone keeps the JS thread suspended in the background; a refresh timer firing there would
// spin on a dead client, so park it while the app is away.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
