import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import { formatDate } from '@/lib/format';
import type { Language, Notice } from '@/types/notice';

import { ScamBadge } from './scam-badge';

interface Props {
  notice: Notice;
  language: Language;
  badgeText: string;
  dueLabel: string;
  categoryText: string;
  onPress: () => void;
}

export function NoticeCard({ notice, language, badgeText, dueLabel, categoryText, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={notice.title[language]}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{notice.title[language]}</Text>
        <ScamBadge label={notice.scam.label} text={badgeText} />
      </View>

      <Text style={styles.meta}>{categoryText}</Text>
      {notice.dueDate ? (
        <View style={styles.dueRow}>
          <Ionicons name="calendar-outline" size={18} color={Colors.muted} />
          <Text style={styles.meta}>
            {dueLabel}: {formatDate(notice.dueDate)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    minHeight: Type.touchTarget,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: Type.body,
    fontWeight: '700',
    color: Colors.text,
  },
  meta: {
    fontSize: Type.small,
    color: Colors.muted,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
