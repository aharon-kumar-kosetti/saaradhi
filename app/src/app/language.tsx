import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import { useSettings } from '@/lib/settings-context';
import { CURRENT_CONSENT_VERSION } from '@/lib/storage';
import type { Language } from '@/types/notice';

const OPTIONS: { code: Language; native: string; english: string }[] = [
  { code: 'te', native: 'తెలుగు', english: 'Telugu' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'en', native: 'English', english: 'English' },
];

export default function LanguageScreen() {
  const { language, setLanguage, settings, t } = useSettings();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const choose = async (code: Language) => {
    await setLanguage(code);
    // Changing from Settings: return there. First run: no history exists, so route onward.
    if (next === 'back') {
      router.back();
      return;
    }
    router.replace(settings.consentVersion >= CURRENT_CONSENT_VERSION ? '/home' : '/consent');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title}>{t('language.title')}</Text>
          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const selected = option.code === language;
            return (
              <Pressable
                key={option.code}
                accessibilityRole="button"
                accessibilityLabel={`${option.native}, ${option.english}`}
                accessibilityState={{ selected }}
                onPress={() => void choose(option.code)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionNative}>{option.native}</Text>
                  <Text style={styles.optionEnglish}>{option.english}</Text>
                </View>
                {selected ? <Ionicons name="checkmark-circle" size={26} color={Colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
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
    gap: Spacing.xxl,
    flexGrow: 1,
    justifyContent: 'center',
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
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.muted,
  },
  options: {
    gap: Spacing.md,
  },
  option: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  optionText: {
    gap: 2,
  },
  optionNative: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
  },
  optionEnglish: {
    fontSize: Type.small,
    color: Colors.muted,
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
