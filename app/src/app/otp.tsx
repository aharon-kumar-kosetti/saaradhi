import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import type { TKey } from '@/i18n/translations';
import { authErrorKey, isNotConfiguredError } from '@/lib/auth-errors';
import { digitsOnly, maskPhone } from '@/lib/countries';
import { requireSupabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';

/** Supabase issues 6-digit SMS codes by default. */
const OTP_LENGTH = 6;
/** Supabase allows one code per minute per number; the countdown mirrors that. */
const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const { t } = useSettings();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [error, setError] = useState<TKey | null>(null);
  const [notice, setNotice] = useState<TKey | null>(null);

  // Autofill and fast typing can fire onChangeText twice for the same 6 digits; these refs make
  // sure exactly one verify request is ever in flight.
  const inFlight = useRef(false);

  const e164 = typeof phone === 'string' ? phone : '';

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const verify = useCallback(
    async (token: string) => {
      if (!e164 || inFlight.current) return;
      if (token.length !== OTP_LENGTH) return;
      inFlight.current = true;
      setVerifying(true);
      setError(null);
      setNotice(null);
      try {
        const { error: authError } = await requireSupabase().auth.verifyOtp({
          phone: e164,
          token,
          type: 'sms',
        });
        if (authError) {
          setError(authErrorKey(authError, 'verify'));
          setCode('');
          return;
        }
        // The session is already persisted by the Supabase client; home reads it from context.
        // Spoken rather than shown, because this screen is replaced straight away.
        AccessibilityInfo.announceForAccessibility(t('auth.success'));
        router.replace('/home');
      } catch (error) {
        setError(isNotConfiguredError(error) ? 'auth.notConfigured' : 'error.network');
      } finally {
        inFlight.current = false;
        setVerifying(false);
      }
    },
    [e164, t],
  );

  const onChangeCode = (text: string) => {
    const next = digitsOnly(text).slice(0, OTP_LENGTH);
    setCode(next);
    setError(null);
    // Auto-submit once the complete code is present (typed, pasted or autofilled).
    if (next.length === OTP_LENGTH) void verify(next);
  };

  const resend = async () => {
    if (!e164 || resending || secondsLeft > 0) return;
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      const { error: authError } = await requireSupabase().auth.signInWithOtp({
        phone: e164,
        options: { shouldCreateUser: true },
      });
      if (authError) {
        setError(authErrorKey(authError, 'send'));
        return;
      }
      setNotice('otp.resent');
      setSecondsLeft(RESEND_SECONDS);
      setCode('');
    } catch (error) {
      setError(isNotConfiguredError(error) ? 'auth.notConfigured' : 'error.network');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
            <Text style={styles.backLabel}>{t('otp.changeNumber')}</Text>
          </Pressable>

          <View style={styles.heading}>
            <Text style={styles.title}>{t('otp.title')}</Text>
            <Text style={styles.subtitle}>
              {t('otp.sentTo')} {maskPhone(e164)}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('otp.label')}</Text>
            <TextInput
              value={code}
              onChangeText={onChangeCode}
              // Android's autofill framework offers the code from the SMS; iOS shows it above the
              // keyboard. The keyboard and OS decide whether a suggestion actually appears.
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              editable={!verifying}
              placeholder="••••••"
              placeholderTextColor="#9AA3AF"
              accessibilityLabel={t('otp.label')}
              style={styles.otpInput}
            />
            <Text style={styles.hint}>{t('otp.hint')}</Text>
          </View>

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {t(error)}
            </Text>
          ) : null}
          {notice && !error ? (
            <Text style={styles.notice} accessibilityLiveRegion="polite">
              {t(notice)}
            </Text>
          ) : null}

          <PrimaryButton
            label={verifying ? t('otp.verifying') : t('otp.verify')}
            icon="checkmark"
            disabled={verifying || code.length !== OTP_LENGTH}
            onPress={() => void verify(code)}
          />

          {secondsLeft > 0 ? (
            <Text style={styles.resendWait}>
              {t('otp.resendWait')} {secondsLeft}s
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('otp.resend')}
            accessibilityState={{ disabled: secondsLeft > 0 || resending }}
            disabled={secondsLeft > 0 || resending}
            onPress={() => void resend()}
            style={({ pressed }) => [styles.resend, pressed && styles.pressed]}
          >
            <Text style={[styles.resendLabel, secondsLeft > 0 && styles.resendDisabled]}>
              {t('otp.resend')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: Type.touchTarget,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontSize: Type.small,
    fontWeight: '700',
    color: Colors.primary,
  },
  heading: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: Type.heading,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: Type.small,
    lineHeight: 24,
    color: Colors.muted,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Type.small,
    fontWeight: '700',
    color: Colors.text,
  },
  otpInput: {
    minHeight: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 10,
    color: Colors.text,
  },
  hint: {
    fontSize: Type.small,
    lineHeight: 22,
    color: Colors.muted,
  },
  error: {
    fontSize: Type.small,
    lineHeight: 22,
    color: '#D32F2F',
  },
  notice: {
    fontSize: Type.small,
    lineHeight: 22,
    color: '#1B7F3B',
  },
  resendWait: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
  },
  resend: {
    minHeight: Type.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendLabel: {
    fontSize: Type.body,
    fontWeight: '700',
    color: Colors.primary,
  },
  resendDisabled: {
    color: Colors.muted,
  },
  pressed: {
    opacity: 0.85,
  },
});
