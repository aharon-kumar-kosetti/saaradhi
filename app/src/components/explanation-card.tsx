import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import { useSettings } from '@/lib/settings-context';
import { fetchExplanation, requestReview } from '@/lib/explain';
import type { TKey } from '@/i18n/translations';
import type { ExtractionFields } from '@/types/extraction';
import { isAdviceCode, type Explanation } from '@/types/explain';
import type { Language } from '@/types/notice';

const SPEECH_LANGUAGE: Record<Language, string> = { te: 'te-IN', hi: 'hi-IN', en: 'en-IN' };

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: Explanation };

interface Props {
  fields: ExtractionFields;
}

/**
 * Explains a confirmed notice from the knowledge base. Every line of advice is a code translated
 * here, and each one carries a citation, so nothing is asserted without a source to point at.
 */
export function ExplanationCard({ fields }: Props) {
  const { t, language } = useSettings();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [speaking, setSpeaking] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });

    fetchExplanation(fields, language).then((data) => {
      if (!active) return;
      setState(data ? { status: 'ready', data } : { status: 'error' });
    });

    return () => {
      active = false;
      void Speech.stop();
      setSpeaking(false);
    };
  }, [fields, language]);

  const adviceText = (code: string): string => (isAdviceCode(code) ? t(`advice.${code}` as TKey) : code);

  const readAloud = () => {
    if (state.status !== 'ready') return;
    const parts = [
      t('explain.title'),
      ...state.data.advice.map(adviceText),
      state.data.placeholders_only ? t('explain.notVerified') : '',
    ].filter(Boolean);

    Speech.stop();
    Speech.speak(parts.join('. '), {
      language: SPEECH_LANGUAGE[language],
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    setSpeaking(true);
  };

  const sendToReviewer = async () => {
    setSending(true);
    const sent = await requestReview({
      reason: 'no_kb_answer',
      language,
      department: fields.department,
      category: fields.category,
      notice_type: fields.notice_type,
    });
    setSending(false);
    if (sent) setReviewSent(true);
    else Alert.alert(t('explain.reviewFailed'));
  };

  const askReviewer = () => {
    Alert.alert(t('explain.reviewTitle'), t('explain.reviewBody'), [
      { text: t('settings.cancel'), style: 'cancel' },
      { text: t('explain.reviewSend'), onPress: () => void sendToReviewer() },
    ]);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('explain.title')}</Text>

      {state.status === 'loading' ? (
        <View style={styles.row}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.muted}>{t('explain.loading')}</Text>
        </View>
      ) : null}

      {state.status === 'error' ? <Text style={styles.muted}>{t('explain.error')}</Text> : null}

      {state.status === 'ready' ? (
        <>
          {state.data.no_answer ? (
            <Text style={styles.body}>{t('explain.noAnswer')}</Text>
          ) : (
            <View style={styles.adviceList}>
              {state.data.advice.map((code) => (
                <View key={code} style={styles.adviceRow}>
                  <Ionicons name="checkmark-circle-outline" size={22} color={Colors.primary} />
                  <Text style={styles.body}>{adviceText(code)}</Text>
                </View>
              ))}
            </View>
          )}

          {state.data.helpline ? (
            <Text style={styles.body}>
              {t('explain.helpline')}: {state.data.helpline}
            </Text>
          ) : (
            <Text style={styles.muted}>{t('explain.noHelpline')}</Text>
          )}

          {state.data.no_answer && !reviewSent ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('explain.askReviewer')}
              onPress={askReviewer}
              disabled={sending}
              style={({ pressed }) => [styles.reviewButton, pressed && styles.pressed]}
            >
              <Ionicons name="person-outline" size={22} color={Colors.primary} />
              <Text style={styles.reviewLabel}>{t('explain.askReviewer')}</Text>
            </Pressable>
          ) : null}

          {reviewSent ? <Text style={styles.muted}>{t('explain.reviewSent')}</Text> : null}

          {!state.data.no_answer ? (
            <View style={styles.citations}>
              <Text style={styles.muted}>{t('explain.sources')}</Text>
              {state.data.citations.map((citation) => (
                <Text key={citation.chunk_id} style={styles.muted}>
                  • {citation.source_title}
                  {citation.verified && citation.last_verified
                    ? ` — ${t('explain.lastVerified')} ${citation.last_verified}`
                    : ` — ${t('explain.notVerified')}`}
                </Text>
              ))}
            </View>
          ) : null}

          {!state.data.no_answer ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={speaking ? t('explain.stopReading') : t('explain.readAloud')}
              onPress={() => {
                if (speaking) {
                  Speech.stop();
                  setSpeaking(false);
                  return;
                }
                readAloud();
              }}
              style={({ pressed }) => [styles.readButton, pressed && styles.pressed]}
            >
              <Ionicons name={speaking ? 'stop-circle-outline' : 'volume-high-outline'} size={22} color={Colors.primary} />
              <Text style={styles.reviewLabel}>{speaking ? t('explain.stopReading') : t('explain.readAloud')}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  adviceList: {
    gap: Spacing.sm,
  },
  adviceRow: {
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
  muted: {
    fontSize: Type.small,
    lineHeight: 22,
    color: Colors.muted,
  },
  citations: {
    gap: 2,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: Type.primaryButtonHeight,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
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
  reviewLabel: {
    fontSize: Type.body,
    fontWeight: '700',
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
