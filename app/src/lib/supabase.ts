import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { AUTH_STORAGE_KEY } from './storage';

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();

// Supabase now issues `sb_publishable_…` keys that replace the legacy anon JWT; both are public
// and RLS-guarded, so any of these names may hold it. Each name must be written out literally for
// Expo to inline it at build time.
const anonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  ''
).trim();

/** Both values are public (the anon key is RLS-guarded). Missing env must disable auth, not crash. */
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

/**
 * Expo Router renders every web route in Node (`web.output: "server"`), where AsyncStorage's web
 * backend touches `window`. createClient() reads the stored session as soon as it is constructed,
 * so an unguarded adapter crashes the server before the first request. On a server render there is
 * no session to read or write, so an in-memory no-op is correct.
 */
const isServerRender = typeof window === 'undefined';

const sessionStore = {
  getItem: (key: string) =>
    isServerRender ? Promise.resolve(null) : AsyncStorage.getItem(key),
  setItem: (key: string, value: string) =>
    isServerRender ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) =>
    isServerRender ? Promise.resolve() : AsyncStorage.removeItem(key),
};

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        storage: sessionStore,
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
