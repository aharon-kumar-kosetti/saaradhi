import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import { useSettings } from '@/lib/settings-context';

/** Placeholder between picking a file (M1) and Gemini extraction (M2). Uploads nothing. */
export default function ReadingScreen() {
  const { t } = useSettings();
  const { name } = useLocalSearchParams<{ name?: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Ionicons name="document-text" size={48} color={Colors.primary} />
        <Text style={styles.title}>{t('reading.title')}</Text>
        {name ? <Text style={styles.file}>{name}</Text> : null}
        <Text style={styles.body}>{t('reading.body')}</Text>

        <PrimaryButton label={t('common.back')} icon="arrow-back" onPress={() => router.replace('/home')} />
      </View>
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
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  title: {
    fontSize: Type.heading,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  file: {
    fontSize: Type.small,
    color: Colors.muted,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxWidth: '100%',
  },
  body: {
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.text,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
