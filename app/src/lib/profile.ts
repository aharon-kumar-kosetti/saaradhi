import type { Language } from '@/types/notice';

import { requireSupabase } from './supabase';

/** Postgres unique-violation: the row already exists, which is exactly what we wanted. */
const UNIQUE_VIOLATION = '23505';

/**
 * Creates the `profiles` row the first time an account is seen, and never a second time.
 *
 * The schema has no signup trigger, and RLS ("own profile") already allows a user to insert only
 * their own id, so this is the whole job. It runs for phone and Google sign-in alike, and again on
 * every launch, so a failed first attempt repairs itself.
 */
export async function ensureProfile(language: Language): Promise<void> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('not_signed_in');

  const { data: existing, error: readError } = await client
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return;

  const { error: insertError } = await client
    .from('profiles')
    .insert({ id: user.id, language })
    .select('id');
  if (insertError && insertError.code !== UNIQUE_VIOLATION) throw insertError;
}
