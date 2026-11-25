import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScamBadge } from '@/components/scam-badge';
import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import { findMockNotice } from '@/data/mock-notices';
import { SCAM_LABEL_KEY } from '@/i18n/translations';
import { formatAmount, formatDate } from '@/lib/format';
import { useSettings } from '@/lib/settings-context';

export default function NoticeScreen() {
  const { t, language } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const notice = id ? findMockNotice(id) : undefined;

  if (!notice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.body}>{t('home.empty')}</Text>
          <Pressable onPress={() => router.replace('/home')} style={styles.back}>
            <Text style={styles.backLabel}>{t('common.back')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const rows = [
    { label: t('notice.department'), value: notice.department },
    { label: t('notice.category'), value: t(`category.${notice.category}`) },
    notice.amount ? { label: t('notice.amount'), value: formatAmount(notice.amount) } : null,
    notice.dueDate ? { label: t('notice.dueDate'), value: formatDate(notice.dueDate) } : null,
    notice.referenceNumber ? { label: t('notice.reference'), value: notice.referenceNumber } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

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

        <View style={styles.demoBanner}>
          <Ionicons name="information-circle-outline" size={22} color={Colors.muted} />
          <Text style={styles.demoText}>{t('notice.demoBanner')}</Text>
        </View>

        <Text style={styles.title}>{notice.title[language]}</Text>

        <ScamBadge label={notice.scam.label} text={t(SCAM_LABEL_KEY[notice.scam.label])} />
        {notice.scam.label === 'safe' ? <Text style={styles.note}>{t('scam.safeNote')}</Text> : null}

        <View style={styles.card}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.reasons}>
          <Text style={styles.sectionTitle}>{t('notice.whatToNotice')}</Text>
          {notice.scam.reasons[language].map((reason) => (
            <View key={reason} style={styles.reason}>
              <Ionicons name="ellipse" size={10} color={Colors.muted} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
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
  demoBanner: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  demoText: {
    flex: 1,
    fontSize: Type.small,
    lineHeight: 22,
    color: Colors.muted,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
  },
  note: {
    fontSize: Type.small,
    color: Colors.muted,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    fontSize: Type.small,
    color: Colors.muted,
  },
  rowValue: {
    fontSize: Type.body,
    fontWeight: '600',
    color: Colors.text,
  },
  reasons: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  reason: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  reasonText: {
    flex: 1,
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.text,
  },
  body: {
    fontSize: Type.body,
    color: Colors.text,
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
