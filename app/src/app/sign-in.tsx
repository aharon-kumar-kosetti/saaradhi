import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleLogo } from '@/components/google-logo';
import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import type { TKey } from '@/i18n/translations';
import { useAuth } from '@/lib/auth-context';
import { signInWithGoogle } from '@/lib/google-auth';
import { useSettings } from '@/lib/settings-context';

export default function SignInScreen() {
  const { t, setGuestMode } = useSettings();
  const { session, configured } = useAuth();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<TKey | null>(null);

  // A restored session can land here if the gate ran before auth finished initialising.
  useEffect(() => {
    if (session) router.replace('/home');
  }, [session]);

  const continueWithGoogle = async () => {
    if (googleBusy) return;
    setError(null);
    // Say why instead of leaving a dead-looking button when the build has no Supabase keys.
    if (!configured) {
      setError('auth.notConfigured');
      return;
    }
    setGoogleBusy(true);
    try {
      const result = await signInWithGoogle();
      if (result.ok) {
        await setGuestMode(false);
        router.replace('/home');
        return;
      }
      if (result.reason === 'cancelled') setError('auth.googleCancelled');
      else if (result.reason === 'unavailable') setError('auth.googleNeedsBuild');
      else if (result.reason === 'not_configured') setError('auth.notConfigured');
      else setError('auth.googleFailed');
    } finally {
      setGoogleBusy(false);
    }
  };

  const openPhone = () => {
    setError(null);
    if (!configured) {
      setError('auth.notConfigured');
      return;
    }
    router.push('/phone');
  };

  const continueAsGuest = async () => {
    await setGuestMode(true);
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Ionicons name="shield-checkmark" size={34} color={Colors.background} />
          </View>
          <Text style={styles.appName}>{t('app.name')}</Text>
          <Text style={styles.title}>{t('auth.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('auth.google')}
            accessibilityState={{ disabled: googleBusy }}
            disabled={googleBusy}
            onPress={() => void continueWithGoogle()}
            style={({ pressed }) => [
              styles.googleButton,
              googleBusy && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {googleBusy ? (
              <ActivityIndicator color={Colors.muted} />
            ) : (
              <View style={styles.googleContent}>
                <GoogleLogo size={22} />
                <Text style={styles.googleLabel}>{t('auth.google')}</Text>
              </View>
            )}
          </Pressable>

          <PrimaryButton label={t('auth.phone')} icon="call-outline" onPress={openPhone} />

          {!configured ? <Text style={styles.hint}>{t('auth.notConfigured')}</Text> : null}

          <View style={styles.divider}>
            <View style={styles.rule} />
            <Text style={styles.orText}>{t('auth.or')}</Text>
            <View style={styles.rule} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('auth.guest')}
            onPress={() => void continueAsGuest()}
            style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}
          >
            <Text style={styles.guestLabel}>{t('auth.guest')}</Text>
          </Pressable>
          <Text style={styles.hint}>{t('auth.guestNote')}</Text>
        </View>

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {t(error)}
          </Text>
        ) : null}

        <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brand: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: Type.heading,
    fontWeight: '700',
    color: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Type.small,
    lineHeight: 24,
    color: Colors.muted,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.md,
  },
  googleButton: {
    minHeight: Type.primaryButtonHeight,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleLabel: {
    fontSize: Type.body,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3E6ED',
  },
  orText: {
    fontSize: Type.small,
    color: Colors.muted,
  },
  guestButton: {
    minHeight: Type.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  guestLabel: {
    fontSize: Type.body,
    fontWeight: '700',
    color: Colors.primary,
  },
  hint: {
    fontSize: Type.small,
    lineHeight: 22,
    color: Colors.muted,
    textAlign: 'center',
  },
  error: {
    fontSize: Type.small,
    lineHeight: 22,
    color: '#D32F2F',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
  },
});
