import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Type } from '@/constants/tokens';

// M0 hello screen. Real Home (language, camera hero button, recent notices) lands in M1.
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.titleTe}>సారథి</Text>
          <Text style={styles.title}>Saaradhi</Text>
          <Text style={styles.tagline}>నోటీసులు, ఫారమ్‌లు అర్థం చేసుకోండి</Text>
          <Text style={styles.tagline}>नोटिस और फ़ॉर्म समझें</Text>
          <Text style={styles.tagline}>Understand notices and forms</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>M0 · skeleton</Text>
          <Text style={styles.cardBody}>
            The app boots. Language selection, camera scan and explanations come in the next milestones.
          </Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>Document comprehension, not legal advice.</Text>
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
    gap: Spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  titleTe: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary,
  },
  title: {
    fontSize: Type.heading,
    fontWeight: '700',
    color: Colors.text,
  },
  tagline: {
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.muted,
    textAlign: 'center',
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
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.text,
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
