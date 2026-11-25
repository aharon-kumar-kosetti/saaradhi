import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import type { TKey } from '@/i18n/translations';
import { parseDateInput, toDateInput } from '@/lib/date-input';
import { newNoticeId, saveLocalNotice } from '@/lib/local-notices';
import { takePendingExtraction } from '@/lib/pending-extraction';
import { useSettings } from '@/lib/settings-context';
import type { NoticeCategory } from '@/types/notice';

const CATEGORIES: NoticeCategory[] = [
  'financial_utility',
  'health_insurance',
  'community_service',
  'scam_fraud',
  'other',
];

const WARNING_KEYS: Record<string, TKey> = {
  demo: 'warning.demo',
  suspicious_link: 'warning.suspicious_link',
  urgent_language: 'warning.urgent_language',
  nothing_found: 'warning.nothing_found',
};

/** The user's own check on what we read. Only what they confirm here gets saved. */
export default function ConfirmScreen() {
  const { t } = useSettings();
  // Taken once: leaving this screen discards the extraction rather than resurrecting it.
  const [pending] = useState(() => takePendingExtraction());

  const [department, setDepartment] = useState(pending?.result.fields.department ?? '');
  const [category, setCategory] = useState<NoticeCategory | null>(pending?.result.fields.category ?? null);
  const [amount, setAmount] = useState(
    pending?.result.fields.amount != null ? String(pending.result.fields.amount) : '',
  );
  const [dueDate, setDueDate] = useState(toDateInput(pending?.result.fields.due_date ?? null));
  const [reference, setReference] = useState(pending?.result.fields.reference_number ?? '');
  const [dateError, setDateError] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!pending) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContent}>
          <Text style={styles.body}>{t('confirm.nothing')}</Text>
          <PrimaryButton label={t('common.back')} icon="arrow-back" onPress={() => router.replace('/home')} />
        </View>
      </SafeAreaView>
    );
  }

  const { result, fileName } = pending;
  const warnings = Array.from(new Set(result.warnings))
    .map((code) => WARNING_KEYS[code])
    .filter((key): key is TKey => Boolean(key));

  const save = async () => {
    const parsedDate = dueDate.trim() ? parseDateInput(dueDate) : null;
    if (dueDate.trim() && !parsedDate) {
      setDateError(true);
      return;
    }
    setDateError(false);

    const digits = amount.replace(/[^0-9.]/g, '');
    const parsedAmount = digits ? Number(digits) : null;
    const finalAmount = parsedAmount !== null && Number.isFinite(parsedAmount) ? parsedAmount : null;
    const id = newNoticeId();

    setSaving(true);
    try {
      await saveLocalNotice({
        id,
        createdAt: new Date().toISOString(),
        fileName,
        source: result.source,
        confidence: result.confidence,
        warnings: result.warnings,
        // Keep the fields the API returned (notice_type, language, urls) and overlay the edits.
        fields: {
          ...result.fields,
          department: department.trim() || null,
          category,
          amount: finalAmount,
          due_date: parsedDate,
          reference_number: reference.trim() || null,
        },
      });
      router.replace({ pathname: '/my-notice/[id]', params: { id } });
    } catch {
      setSaving(false);
      Alert.alert(t('confirm.saveFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.replace('/home')}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          <Text style={styles.backLabel}>{t('common.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('confirm.title')}</Text>
        <Text style={styles.body}>{t('confirm.body')}</Text>

        {result.source === 'demo' ? (
          <View style={styles.banner}>
            <Ionicons name="information-circle-outline" size={22} color={Colors.muted} />
            <Text style={styles.bannerText}>{t('confirm.demoNote')}</Text>
          </View>
        ) : null}

        {result.missing.length > 0 ? (
          <Text style={styles.hint}>{t('confirm.unreadNote')}</Text>
        ) : null}

        <Field label={t('confirm.department')} value={department} onChangeText={setDepartment} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('confirm.category')}</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((option) => {
              const selected = category === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t(`category.${option}`)}
                  onPress={() => setCategory(option)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {t(`category.${option}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Field
          label={t('confirm.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <View style={styles.field}>
          <Field
            label={t('confirm.dueDate')}
            value={dueDate}
            onChangeText={(text) => {
              setDueDate(text);
              setDateError(false);
            }}
            keyboardType="numbers-and-punctuation"
            placeholder={t('confirm.dueDateHint')}
            error={dateError ? t('confirm.dueDateInvalid') : null}
          />
          {!dateError && !dueDate.trim() ? (
            <Text style={styles.hint}>{t('confirm.dueDateHint')}</Text>
          ) : null}
        </View>

        <Field
          label={t('confirm.reference')}
          value={reference}
          onChangeText={setReference}
          autoCapitalize="characters"
        />

        <ReadOnlyList title={t('confirm.urls')} items={result.fields.urls} emptyText={t('confirm.none')} />
        <ReadOnlyList
          title={t('confirm.documents')}
          items={result.fields.required_documents}
          emptyText={t('confirm.none')}
        />

        {warnings.length > 0 ? (
          <View style={styles.banner}>
            <Ionicons name="warning-outline" size={22} color={Colors.muted} />
            <View style={styles.warningList}>
              {warnings.map((key) => (
                <Text key={key} style={styles.bannerText}>
                  {t(key)}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        <PrimaryButton
          label={saving ? t('confirm.saving') : t('confirm.save')}
          icon="checkmark-circle-outline"
          onPress={() => void save()}
        />
      </ScrollView>

      <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
    </SafeAreaView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  placeholder?: string;
  error?: string | null;
}

function Field({ label, value, onChangeText, keyboardType, autoCapitalize, placeholder, error }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        accessibilityLabel={label}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function ReadOnlyList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{title}</Text>
      <View style={styles.box}>
        {items.length === 0 ? (
          <Text style={styles.hint}>{emptyText}</Text>
        ) : (
          items.map((item) => (
            <Text key={item} style={styles.body}>
              • {item}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyContent: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
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
  body: {
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.text,
  },
  hint: {
    fontSize: Type.small,
    color: Colors.muted,
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
  warningList: {
    flex: 1,
    gap: 4,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: Type.small,
    fontWeight: '700',
    color: Colors.text,
  },
  input: {
    minHeight: Type.primaryButtonHeight,
    borderWidth: 1,
    borderColor: '#C9CFDA',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Type.body,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  errorText: {
    fontSize: Type.small,
    color: '#D32F2F',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    minHeight: Type.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#C9CFDA',
    backgroundColor: Colors.background,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Type.small,
    fontWeight: '600',
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.background,
  },
  box: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
