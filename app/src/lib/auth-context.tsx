import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useSettings } from '@/lib/settings-context';
import { ensureProfile } from '@/lib/profile';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the stored session has been read once, so we never flash the sign-in screen. */
  initializing: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { language } = useSettings();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(isSupabaseConfigured);

  // The listener below must not be rebuilt when the language changes, so it reads the latest
  // language through a ref instead of a dependency.
  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setInitializing(false);
    });

    // One listener for the whole app; screens read this context instead of subscribing again.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setInitializing(false);
      if (nextSession?.user) {
        void ensureProfile(languageRef.current).catch(() => {
          // The account is valid without a profile row; retried on next launch.
        });
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    // `local` scope: the session is cleared on this phone even when the network is down.
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      initializing,
      configured: isSupabaseConfigured,
      signOut,
    }),
    [session, initializing, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

/** Where a returning user belongs: guests and signed-in users go straight in, everyone else signs in. */
export function useEntryRoute(): '/home' | '/sign-in' {
  const { session } = useAuth();
  const { settings } = useSettings();
  return session || settings.guestMode ? '/home' : '/sign-in';
}
