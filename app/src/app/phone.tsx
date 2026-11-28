import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
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
import { authErrorKey, isNotConfiguredError } from '@/lib/auth-errors';
import { COUNTRIES, DEFAULT_COUNTRY, digitsOnly, toE164, type Country } from '@/lib/countries';
import type { TKey } from '@/i18n/translations';
import { requireSupabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';

const MAX_NATIONAL_LENGTH = 12;

export default function PhoneScreen() {
  const { t } = useSettings();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [number, setNumber] = useState('');
  const [picking, setPicking] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<TKey | null>(null);

  const e164 = useMemo(() => toE164(country, number), [country, number]);
  const canSend = e164 !== null && !sending;

  const sendCode = async () => {
    if (!e164 || sending) return;
    setSending(true);
    setError(null);
    try {
      // shouldCreateUser: a first-time user becomes an account here; Supabase is idempotent for
      // existing numbers, so this never creates a duplicate.
      const { error: authError } = await requireSupabase().auth.signInWithOtp({
        phone: e164,
        options: { shouldCreateUser: true },
      });
      if (authError) {
        setError(authErrorKey(authError, 'send'));
        return;
      }
      router.push({ pathname: '/otp', params: { phone: e164 } });
    } catch (error) {
      setError(isNotConfiguredError(error) ? 'auth.notConfigured' : 'error.network');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          <Text style={styles.backLabel}>{t('common.back')}</Text>
        </Pressable>

        <View style={styles.heading}>
          <Text style={styles.title}>{t('phone.title')}</Text>
          <Text style={styles.subtitle}>{t('phone.subtitle')}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('phone.country')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('phone.changeCountry')}: ${country.name} ${country.dial}`}
            onPress={() => setPicking(true)}
            style={({ pressed }) => [styles.countryRow, pressed && styles.pressed]}
          >
            <Text style={styles.countryName}>{country.name}</Text>
            <View style={styles.countryRight}>
              <Text style={styles.dial}>{country.dial}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.muted} />
            </View>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('phone.number')}</Text>
          <View style={styles.numberRow}>
            <Text style={styles.numberDial}>{country.dial}</Text>
            <TextInput
              value={number}
              onChangeText={(text) => setNumber(digitsOnly(text).slice(0, MAX_NATIONAL_LENGTH))}
              placeholder={country.lengths.includes(10) ? '9876543210' : ''}
              placeholderTextColor="#9AA3AF"
              keyboardType="phone-pad"
              inputMode="tel"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={MAX_NATIONAL_LENGTH}
              accessibilityLabel={t('phone.number')}
              style={styles.numberInput}
            />
          </View>
          <Text style={styles.hint}>{t('phone.numberHint')}</Text>
        </View>

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {t(error)}
          </Text>
        ) : null}
        {!error && number.length > 0 && !e164 ? (
          <Text style={styles.error} accessibilityRole="alert">
            {t('phone.invalid')}
          </Text>
        ) : null}

        <PrimaryButton
          label={sending ? t('phone.sending') : t('phone.send')}
          icon="arrow-forward"
          disabled={!canSend}
          onPress={() => void sendCode()}
        />
      </ScrollView>

      <Modal visible={picking} animationType="slide" transparent onRequestClose={() => setPicking(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('phone.country')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={() => setPicking(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => `${item.code}-${item.dial}`}
              renderItem={({ item }) => {
                const selected = item.code === country.code;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setCountry(item);
                      setNumber('');
                      setError(null);
                      setPicking(false);
                    }}
                    style={({ pressed }) => [
                      styles.countryOption,
                      selected && styles.countryOptionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.countryName}>{item.name}</Text>
                    <View style={styles.countryRight}>
                      <Text style={styles.dial}>{item.dial}</Text>
                      {selected ? (
                        <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
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
  countryRow: {
    minHeight: Type.primaryButtonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
  },
  countryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countryName: {
    fontSize: Type.body,
    color: Colors.text,
  },
  dial: {
    fontSize: Type.body,
    fontWeight: '700',
    color: Colors.muted,
  },
  numberRow: {
    minHeight: Type.primaryButtonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
  },
  numberDial: {
    fontSize: Type.body,
    fontWeight: '700',
    color: Colors.text,
  },
  numberInput: {
    flex: 1,
    minHeight: Type.primaryButtonHeight,
    fontSize: 22,
    color: Colors.text,
  },
  hint: {
    fontSize: Type.small,
    color: Colors.muted,
  },
  error: {
    fontSize: Type.small,
    lineHeight: 22,
    color: '#D32F2F',
  },
  pressed: {
    opacity: 0.85,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '80%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  modalClose: {
    minWidth: Type.touchTarget,
    minHeight: Type.touchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  countryOption: {
    minHeight: Type.primaryButtonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#EEF0F5',
  },
  countryOptionSelected: {
    backgroundColor: Colors.card,
  },
});
