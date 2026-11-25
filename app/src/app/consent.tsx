import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { Colors, Spacing, Type } from '@/constants/tokens';
import { useSettings } from '@/lib/settings-context';
import type { TKey } from '@/i18n/translations';

const POINTS: TKey[] = ['consent.point1', 'consent.point2', 'consent.point3'];

export default function ConsentScreen() {
  const { acceptConsent, t } = useSettings();

  const agree = async () => {
    await acceptConsent();
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
          <Text style={styles.title}>{t('consent.title')}</Text>
          <Text style={styles.body}>{t('consent.body')}</Text>
        </View>

        <View style={styles.points}>
          {POINTS.map((key) => (
            <View key={key} style={styles.point}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              <Text style={styles.pointText}>{t(key)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label={t('consent.agree')} icon="checkmark" onPress={() => void agree()} />
          <PrimaryButton
            label={t('consent.later')}
            icon="arrow-forward"
            variant="secondary"
            onPress={() => router.replace('/home')}
          />
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
    gap: Spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  heading: {
    gap: Spacing.md,
  },
  title: {
    fontSize: Type.heading,
    fontWeight: '700',
    color: Colors.text,
  },
  body: {
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.text,
  },
  points: {
    gap: Spacing.lg,
  },
  point: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  pointText: {
    flex: 1,
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.text,
  },
  actions: {
    gap: Spacing.md,
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
