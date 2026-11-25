import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import type { LocalNotice } from '@/lib/local-notices';

interface Props {
  notice: LocalNotice;
  title: string;
  meta: string;
  sourceText: string;
  dueLabel: string;
  dueText: string | null;
  onPress: () => void;
}

/** A notice the user confirmed on this phone. No scam label yet: that arrives in M3. */
export function LocalNoticeCard({ notice, title, meta, sourceText, dueLabel, dueText, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.chip}>
          <Ionicons name="phone-portrait-outline" size={16} color={Colors.muted} />
          <Text style={styles.chipText}>{sourceText}</Text>
        </View>
      </View>

      <Text style={styles.meta}>{meta}</Text>
      {dueText ? (
        <View style={styles.dueRow}>
          <Ionicons name="calendar-outline" size={18} color={Colors.muted} />
          <Text style={styles.meta}>
            {dueLabel}: {dueText}
          </Text>
        </View>
      ) : null}
      {notice.warnings.includes('suspicious_link') ? (
        <View style={styles.dueRow}>
          <Ionicons name="link-outline" size={18} color={Colors.muted} />
          <Text style={styles.meta}>{notice.fields.urls[0]}</Text>
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 14,
    color: Colors.muted,
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
