import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Language } from '@/types/notice';

/** Bump when the consent text changes so everyone is asked again. */
export const CURRENT_CONSENT_VERSION = 1;

const SETTINGS_KEY = 'saaradhi.settings.v1';

export interface Settings {
  language: Language | null;
  consentVersion: number;
  consentedAt: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  language: null,
  consentVersion: 0,
  consentedAt: null,
};

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      language: parsed.language ?? null,
      consentVersion: typeof parsed.consentVersion === 'number' ? parsed.consentVersion : 0,
      consentedAt: parsed.consentedAt ?? null,
    };
  } catch {
    // Corrupt value: start clean rather than crash on launch.
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Guest mode: everything we hold is local, so this is the privacy "delete data" action. */
export async function clearAllLocalData(): Promise<void> {
  await AsyncStorage.clear();
}
