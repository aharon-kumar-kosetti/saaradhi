import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Type } from '@/constants/tokens';
import type { TKey } from '@/i18n/translations';
import type { ScamLabel } from '@/types/notice';

const CONFIG: Record<ScamLabel, { color: string; icon: keyof typeof Ionicons.glyphMap; key: TKey }> = {
  safe: { color: '#1B8F4E', icon: 'checkmark-circle', key: 'scam.safe' },
  suspicious: { color: '#E8A317', icon: 'alert-circle', key: 'scam.suspicious' },
  dangerous: { color: '#D32F2F', icon: 'close-circle', key: 'scam.dangerous' },
  unsure: { color: '#5F6B7A', icon: 'help-circle', key: 'scam.unsure' },
};

export function ScamBadge({ label, text }: { label: ScamLabel; text: string }) {
  const { color, icon } = CONFIG[label];

  return (
    // Colour is never the only signal: icon + word always ride along.
    <View style={[styles.badge, { backgroundColor: `${color}1F` }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: {
    fontSize: Type.small,
    fontWeight: '700',
  },
});
