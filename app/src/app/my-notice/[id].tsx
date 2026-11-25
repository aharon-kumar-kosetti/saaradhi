import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import type { TKey } from '@/i18n/translations';
import { formatAmount, formatDate } from '@/lib/format';
import { deleteLocalNotice, findLocalNotice, type LocalNotice } from '@/lib/local-notices';
import { useSettings } from '@/lib/settings-context';

const WARNING_KEYS: Record<string, TKey> = {
  demo: 'warning.demo',
  suspicious_link: 'warning.suspicious_link',
  urgent_language: 'warning.urgent_language',
  nothing_found: 'warning.nothing_found',
};

export default function MyNoticeScreen() {
  const { t } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notice, setNotice] = useState<LocalNotice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoading(false);
      return;
    }
    findLocalNotice(id).then((found) => {
      if (!active) return;
      setNotice(found ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const confirmDelete = () => {
    if (!id) return;
    Alert.alert(t('myNotice.delete'), t('myNotice.deleteBody'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteLocalNotice(id).then(() => router.replace('/home'));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.body}>{t('myNotice.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!notice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.body}>{t('myNotice.notFound')}</Text>
          <PrimaryButton label={t('common.back')} icon="arrow-back" onPress={() => router.replace('/home')} />
        </View>
      </SafeAreaView>
    );
  }

  const { fields } = notice;
  const title = fields.department ?? t(fields.category ? `category.${fields.category}` : 'category.other');

  const rows: { label: string; value: string }[] = [];
  if (fields.department) rows.push({ label: t('notice.department'), value: fields.department });
  if (fields.category) rows.push({ label: t('notice.category'), value: t(`category.${fields.category}`) });
  if (fields.amount != null) rows.push({ label: t('notice.amount'), value: formatAmount(fields.amount) });
  if (fields.due_date) rows.push({ label: t('notice.dueDate'), value: formatDate(fields.due_date) });
  if (fields.reference_number) {
    rows.push({ label: t('notice.reference'), value: fields.reference_number });
  }

  const warnings = Array.from(new Set(notice.warnings))
    .map((code) => WARNING_KEYS[code])
    .filter((key): key is TKey => Boolean(key));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.replace('/home')}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          <Text style={styles.backLabel}>{t('common.back')}</Text>
        </Pressable>

        <View style={styles.banner}>
          <Ionicons name="phone-portrait-outline" size={22} color={Colors.muted} />
          <Text style={styles.bannerText}>
            {notice.source === 'demo' ? t('myNotice.sourceDemo') : t('myNotice.sourceRead')} ·{' '}
            {t('myNotice.saved')}
          </Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.card}>
          {rows.length === 0 ? (
            <Text style={styles.hint}>{t('confirm.none')}</Text>
          ) : (
            rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))
          )}
        </View>

        {fields.urls.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('confirm.urls')}</Text>
            {fields.urls.map((url) => (
              <Text key={url} style={styles.body}>
                • {url}
              </Text>
            ))}
          </View>
        ) : null}

        {fields.required_documents.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('confirm.documents')}</Text>
            {fields.required_documents.map((document) => (
              <Text key={document} style={styles.body}>
                • {document}
              </Text>
            ))}
          </View>
        ) : null}

        {warnings.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('notice.whatToNotice')}</Text>
            {warnings.map((key) => (
              <View key={key} style={styles.warningRow}>
                <Ionicons name="alert-circle-outline" size={18} color={Colors.muted} />
                <Text style={styles.body}>{t(key)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.hint}>{notice.fileName}</Text>

        <PrimaryButton
          label={t('myNotice.delete')}
          icon="trash-outline"
          variant="secondary"
          onPress={confirmDelete}
        />
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
  banner: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  bannerText: {
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
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  warningRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  body: {
    flex: 1,
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.text,
  },
  hint: {
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
