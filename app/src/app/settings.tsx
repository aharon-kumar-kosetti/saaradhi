import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import { LANGUAGE_NAMES } from '@/i18n/translations';
import { useSettings } from '@/lib/settings-context';

export default function SettingsScreen() {
  const { t, language, deleteAllData } = useSettings();
  const version = Constants.expoConfig?.version ?? '—';

  const confirmDelete = () => {
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteBody'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteAllData().then(() => router.replace('/language'));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          <Text style={styles.backLabel}>{t('common.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('settings.title')}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.language')}
          onPress={() => router.push({ pathname: '/language', params: { next: 'back' } })}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Ionicons name="language" size={24} color={Colors.primary} />
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{t('settings.language')}</Text>
            <Text style={styles.rowValue}>{LANGUAGE_NAMES[language]}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={Colors.muted} />
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.privacy')}</Text>
          <Text style={styles.cardBody}>{t('settings.privacyBody')}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.deleteData')}
          onPress={confirmDelete}
          style={({ pressed }) => [styles.row, styles.danger, pressed && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={24} color="#D32F2F" />
          <Text style={[styles.rowLabel, styles.dangerText]}>{t('settings.deleteData')}</Text>
        </Pressable>

        <Text style={styles.version}>
          {t('settings.version')}: {version}
        </Text>
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
  title: {
    fontSize: Type.heading,
    fontWeight: '700',
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: Type.primaryButtonHeight,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: Type.body,
    fontWeight: '600',
    color: Colors.text,
  },
  rowValue: {
    fontSize: Type.small,
    color: Colors.muted,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: Type.body,
    fontWeight: '700',
    color: Colors.text,
  },
  cardBody: {
    fontSize: Type.small,
    lineHeight: 22,
    color: Colors.text,
  },
  danger: {
    backgroundColor: '#FDECEA',
  },
  dangerText: {
    color: '#D32F2F',
  },
  version: {
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
