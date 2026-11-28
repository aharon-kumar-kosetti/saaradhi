import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { translate, type TKey } from '@/i18n/translations';
import {
  clearAllLocalData,
  CURRENT_CONSENT_VERSION,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Settings,
} from '@/lib/storage';
import type { Language } from '@/types/notice';

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  language: Language;
  t: (key: TKey) => string;
  setLanguage: (language: Language) => Promise<void>;
  acceptConsent: () => Promise<void>;
  deleteAllData: () => Promise<void>;
  setGuestMode: (guest: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadSettings().then((loaded) => {
      if (!active) return;
      setSettings(loaded);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const language = settings.language ?? 'en';

  const setLanguage = useCallback(async (next: Language) => {
    setSettings((current) => {
      const updated = { ...current, language: next };
      void saveSettings(updated);
      return updated;
    });
  }, []);

  const acceptConsent = useCallback(async () => {
    setSettings((current) => {
      const updated: Settings = {
        ...current,
        consentVersion: CURRENT_CONSENT_VERSION,
        consentedAt: new Date().toISOString(),
      };
      void saveSettings(updated);
      return updated;
    });
  }, []);

  const deleteAllData = useCallback(async () => {
    await clearAllLocalData();
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Only the flag is stored: guest notices stay where they already are, so signing in later
  // neither loses them nor uploads them.
  const setGuestMode = useCallback(async (guest: boolean) => {
    setSettings((current) => {
      const updated: Settings = { ...current, guestMode: guest };
      void saveSettings(updated);
      return updated;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      loading,
      language,
      t: (key: TKey) => translate(language, key),
      setLanguage,
      acceptConsent,
      deleteAllData,
      setGuestMode,
    }),
    [settings, loading, language, setLanguage, acceptConsent, deleteAllData, setGuestMode],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
