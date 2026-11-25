import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { LANGUAGE_NAMES, type TKey } from '@/i18n/translations';
import {
  addChecklistItem,
  removeChecklistItem,
  toggleChecklistItem,
  type ChecklistItem,
} from '@/lib/checklist';
import { FIELD_GUIDES } from '@/lib/form-guide';
import { formatAmount, formatDate } from '@/lib/format';
import { findLocalNotice, saveLocalNotice, type LocalNotice } from '@/lib/local-notices';
import { cancelReminders, REMINDER_OFFSETS, syncReminders } from '@/lib/reminders';
import { useSettings } from '@/lib/settings-context';
import type { ExtractionFieldName } from '@/types/extraction';
import type { Language } from '@/types/notice';

const SPEECH_LANGUAGE: Record<Language, string> = { te: 'te-IN', hi: 'hi-IN', en: 'en-IN' };

/** Text form of a field. Empty means "nothing to show for this field". */
function fieldValue(
  field: Extract<ExtractionFieldName, keyof typeof FIELD_GUIDES>,
  notice: LocalNotice,
  t: (key: TKey) => string,
): string {
  const { fields } = notice;
  switch (field) {
    case 'department':
      return fields.department ?? '';
    case 'category':
      return fields.category ? t(`category.${fields.category}`) : '';
    case 'notice_type':
      return fields.notice_type ?? '';
    case 'language':
      return fields.language ? LANGUAGE_NAMES[fields.language] : '';
    case 'amount':
      return fields.amount != null ? formatAmount(fields.amount) : '';
    case 'due_date':
      return fields.due_date ? formatDate(fields.due_date) : '';
    case 'reference_number':
      return fields.reference_number ?? '';
    case 'urls':
      return fields.urls.join(', ');
  }
}

export default function GuideScreen() {
  const { t, language } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notice, setNotice] = useState<LocalNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);

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
      void Speech.stop();
    };
  }, [id]);

  const persist = async (updated: LocalNotice) => {
    setNotice(updated);
    try {
      await saveLocalNotice(updated);
    } catch {
      Alert.alert(t('guide.reminderSaveFailed'));
    }
  };

  const toggleItem = (item: ChecklistItem) => {
    if (!notice) return;
    void persist({ ...notice, checklist: toggleChecklistItem(notice.checklist, item.id) });
  };

  const removeItem = (item: ChecklistItem) => {
    if (!notice) return;
    void persist({ ...notice, checklist: removeChecklistItem(notice.checklist, item.id) });
  };

  const addItem = () => {
    if (!notice) return;
    const label = newItem.trim();
    if (!label) return;
    void persist({ ...notice, checklist: addChecklistItem(notice.checklist, label) });
    setNewItem('');
  };

  const toggleReminder = async (daysBefore: number) => {
    if (!notice) return;
    const enabled = notice.reminderOffsets.includes(daysBefore);
    const offsets = enabled
      ? notice.reminderOffsets.filter((value) => value !== daysBefore)
      : [...notice.reminderOffsets, daysBefore].sort((a, b) => b - a);

    setBusy(true);
    const result = await syncReminders({
      noticeId: notice.id,
      dueDate: notice.fields.due_date,
      offsets,
      previousIds: notice.reminderIds,
      content: (days, dueDate) => ({
        title: t('reminder.title'),
        body:
          days === 0
            ? `${t('reminder.today')} ${formatDate(dueDate)}`
            : `${t('reminder.soon')} ${days} ${t('guide.daysBefore')} — ${formatDate(dueDate)}`,
      }),
    });
    setBusy(false);

    if (!result) {
      Alert.alert(t('guide.reminderPermission'));
      return;
    }
    await persist({ ...notice, reminderOffsets: result.offsets, reminderIds: result.ids });
  };

  const readAloud = () => {
    if (!notice) return;
    if (speaking) {
      void Speech.stop();
      setSpeaking(false);
      return;
    }
    const parts: string[] = [t('guide.intro')];
    for (const field of Object.keys(FIELD_GUIDES) as (keyof typeof FIELD_GUIDES)[]) {
      const value = fieldValue(field, notice, t);
      if (!value) continue;
      parts.push(`${t(FIELD_GUIDES[field].labelKey)}: ${value}. ${t(FIELD_GUIDES[field].guideKey)}`);
    }
    if (notice.checklist.length > 0) {
      parts.push(`${t('guide.checklist')}: ${notice.checklist.map((item) => item.label).join(', ')}`);
    }
    Speech.speak(parts.join('. '), {
      language: SPEECH_LANGUAGE[language],
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    setSpeaking(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!notice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.body}>{t('guide.notFound')}</Text>
          <PrimaryButton label={t('common.back')} icon="arrow-back" onPress={() => router.replace('/home')} />
        </View>
      </SafeAreaView>
    );
  }

  const rows = (Object.keys(FIELD_GUIDES) as (keyof typeof FIELD_GUIDES)[])
    .map((field) => ({ field, value: fieldValue(field, notice, t) }))
    .filter((row) => row.value.length > 0);

  const dueDate = notice.fields.due_date;
  const doneCount = notice.checklist.filter((item) => item.done).length;

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

        <Text style={styles.title}>{t('guide.title')}</Text>
        <Text style={styles.body}>{t('guide.intro')}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={speaking ? t('guide.stopReading') : t('guide.readAloud')}
          onPress={readAloud}
          style={({ pressed }) => [styles.readButton, pressed && styles.pressed]}
        >
          <Ionicons
            name={speaking ? 'stop-circle-outline' : 'volume-high-outline'}
            size={22}
            color={Colors.primary}
          />
          <Text style={styles.readLabel}>{speaking ? t('guide.stopReading') : t('guide.readAloud')}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>{t('guide.fields')}</Text>
        {rows.length === 0 ? (
          <Text style={styles.hint}>{t('guide.noFields')}</Text>
        ) : (
          <View style={styles.card}>
            {rows.map((row) => (
              <View key={row.field} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t(FIELD_GUIDES[row.field].labelKey)}</Text>
                <Text style={styles.fieldValue}>{row.value}</Text>
                <Text style={styles.hint}>{t(FIELD_GUIDES[row.field].guideKey)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('guide.checklist')}</Text>
        <Text style={styles.hint}>
          {t('guide.checklistNote')}
          {notice.checklist.length > 0 ? ` (${doneCount}/${notice.checklist.length})` : ''}
        </Text>

        {notice.checklist.length === 0 ? (
          <Text style={styles.hint}>{t('guide.checklistEmpty')}</Text>
        ) : (
          <View style={styles.card}>
            {notice.checklist.map((item) => (
              <View key={item.id} style={styles.checkRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.done }}
                  accessibilityLabel={item.label}
                  onPress={() => toggleItem(item)}
                  style={styles.checkTap}
                >
                  <Ionicons
                    name={item.done ? 'checkbox' : 'square-outline'}
                    size={28}
                    color={item.done ? Colors.primary : Colors.muted}
                  />
                  <Text style={[styles.body, item.done && styles.doneText]}>{item.label}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('guide.remove')}: ${item.label}`}
                  onPress={() => removeItem(item)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle-outline" size={24} color={Colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('guide.addItem')}</Text>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            placeholder={t('guide.addPlaceholder')}
            placeholderTextColor={Colors.muted}
            accessibilityLabel={t('guide.addItem')}
            style={styles.input}
            onSubmitEditing={addItem}
          />
          <PrimaryButton label={t('guide.add')} icon="add" variant="secondary" onPress={addItem} />
        </View>

        <Text style={styles.sectionTitle}>{t('guide.reminders')}</Text>
        {dueDate ? (
          <>
            <Text style={styles.hint}>{t('guide.alarmTime')}</Text>
            <View style={styles.card}>
              {REMINDER_OFFSETS.map((days) => {
                const enabled = notice.reminderOffsets.includes(days);
                return (
                  <Pressable
                    key={days}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: enabled }}
                    disabled={busy}
                    onPress={() => void toggleReminder(days)}
                    style={styles.checkTap}
                  >
                    <Ionicons
                      name={enabled ? 'checkbox' : 'square-outline'}
                      size={28}
                      color={enabled ? Colors.primary : Colors.muted}
                    />
                    <Text style={styles.body}>
                      {days === 0 ? t('guide.onDueDay') : `${days} ${t('guide.daysBefore')}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.hint}>{t('guide.noDueDate')}</Text>
        )}
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
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  body: {
    flex: 1,
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.text,
  },
  hint: {
    fontSize: Type.small,
    lineHeight: 22,
    color: Colors.muted,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fieldRow: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: Type.small,
    fontWeight: '700',
    color: Colors.text,
  },
  fieldValue: {
    fontSize: Type.body,
    fontWeight: '600',
    color: Colors.text,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: Type.touchTarget,
  },
  removeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Type.touchTarget,
    minWidth: Type.touchTarget,
  },
  doneText: {
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },
  field: {
    gap: Spacing.sm,
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
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: Type.touchTarget + 8,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
  },
  readLabel: {
    fontSize: Type.body,
    fontWeight: '700',
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
