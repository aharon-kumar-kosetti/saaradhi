import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import { ApiError, extractDemo, extractFile, mimeTypeFor, type ApiErrorCode } from '@/lib/api';
import { setPendingExtraction } from '@/lib/pending-extraction';
import { useSettings } from '@/lib/settings-context';

const ERROR_KEYS: Record<ApiErrorCode, Parameters<ReturnType<typeof useSettings>['t']>[0]> = {
  not_configured: 'error.not_configured',
  unreadable: 'error.unreadable',
  too_large: 'error.too_large',
  unsupported_type: 'error.unsupported_type',
  upstream_unavailable: 'error.upstream_unavailable',
  invalid_response: 'error.invalid_response',
  offline: 'error.offline',
  server_error: 'error.upstream_unavailable',
};

type State = { status: 'reading' } | { status: 'failed'; code: ApiErrorCode | 'no_file' };

/** Uploads one notice, then hands the result to the confirm screen. Never stores the file. */
export default function ReadingScreen() {
  const { t } = useSettings();
  const { uri, name, mimeType, demo } = useLocalSearchParams<{
    uri?: string;
    name?: string;
    mimeType?: string;
    demo?: string;
  }>();

  const [state, setState] = useState<State>({ status: 'reading' });

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        if (demo) {
          const result = await extractDemo(demo);
          if (!active) return;
          setPendingExtraction({ fileName: `sample-${demo}`, result });
        } else if (uri) {
          const fileName = name ?? 'notice';
          const result = await extractFile({
            uri,
            name: fileName,
            mimeType: mimeType ?? mimeTypeFor(fileName),
          });
          if (!active) return;
          setPendingExtraction({ fileName, result });
        } else {
          if (active) setState({ status: 'failed', code: 'no_file' });
          return;
        }

        if (active) router.replace('/confirm');
      } catch (error) {
        if (!active) return;
        setState({ status: 'failed', code: error instanceof ApiError ? error.code : 'offline' });
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [demo, uri, name, mimeType]);

  if (state.status === 'reading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.title}>{t('reading.reading')}</Text>
          <Text style={styles.body}>{t('reading.readingHint')}</Text>
        </View>
        <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
      </SafeAreaView>
    );
  }

  const message =
    state.code === 'no_file' ? t('reading.noFile') : t(ERROR_KEYS[state.code]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Ionicons name="alert-circle" size={48} color={Colors.muted} />
        <Text style={styles.title}>{t('reading.failedTitle')}</Text>
        <Text style={styles.body}>{message}</Text>

        <View style={styles.actions}>
          <PrimaryButton
            label={t('reading.trySample')}
            icon="document-text-outline"
            variant="secondary"
            onPress={() => router.replace({ pathname: '/reading', params: { demo: 'bill' } })}
          />
          <PrimaryButton label={t('common.back')} icon="arrow-back" onPress={() => router.replace('/home')} />
        </View>
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
  body: {
    fontSize: Type.body,
    lineHeight: Type.bodyLineHeight,
    color: Colors.muted,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
