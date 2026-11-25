import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalNoticeCard } from '@/components/local-notice-card';
import { NoticeCard } from '@/components/notice-card';
import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import { MOCK_NOTICES } from '@/data/mock-notices';
import { SCAM_LABEL_KEY } from '@/i18n/translations';
import { mimeTypeFor, type PickedFile } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { loadLocalNotices, type LocalNotice } from '@/lib/local-notices';
import { useSettings } from '@/lib/settings-context';
import { CURRENT_CONSENT_VERSION } from '@/lib/storage';

export default function HomeScreen() {
  const { t, language, settings } = useSettings();
  const consented = settings.consentVersion >= CURRENT_CONSENT_VERSION;
  const [notices, setNotices] = useState<LocalNotice[]>([]);

  // Reload on focus so a notice saved or deleted on another screen shows up immediately.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadLocalNotices().then((loaded) => {
        if (active) setNotices(loaded);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const goToReading = (file: PickedFile) => {
    router.push({
      pathname: '/reading',
      params: { uri: file.uri, name: file.name, mimeType: file.mimeType },
    });
  };

  const pickPhoto = async (fromCamera: boolean) => {
    if (!consented) {
      router.push('/consent');
      return;
    }

    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('notice.cameraOff'));
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ['images'] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    const name = asset.fileName ?? 'photo.jpg';
    goToReading({ uri: asset.uri, name, mimeType: asset.mimeType ?? mimeTypeFor(name) });
  };

  const pickPdf = async () => {
    if (!consented) {
      router.push('/consent');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;
    goToReading({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>{t('app.name')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.settings')}
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.primary} />
            <Text style={styles.settingsLabel}>{t('common.settings')}</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={t('home.scan')}
            icon="camera"
            onPress={() => void pickPhoto(true)}
            accessibilityHint={t('consent.point1')}
          />
          {!consented ? <Text style={styles.noticeBanner}>{t('consent.needed')}</Text> : null}

          <View style={styles.secondaryRow}>
            <View style={styles.secondaryItem}>
              <PrimaryButton
                label={t('home.gallery')}
                icon="images-outline"
                variant="secondary"
                onPress={() => void pickPhoto(false)}
              />
            </View>
            <View style={styles.secondaryItem}>
              <PrimaryButton
                label={t('home.pdf')}
                icon="document-text-outline"
                variant="secondary"
                onPress={() => void pickPdf()}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.sample')}
            onPress={() => router.push({ pathname: '/reading', params: { demo: 'bill' } })}
            style={({ pressed }) => [styles.sampleButton, pressed && styles.pressed]}
          >
            <Text style={styles.sampleLabel}>{t('home.sample')}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>{t('home.myNotices')}</Text>
          </View>

          {notices.length === 0 ? (
            <Text style={styles.emptyText}>{t('home.myNoticesEmpty')}</Text>
          ) : (
            notices.map((notice) => (
              <LocalNoticeCard
                key={notice.id}
                notice={notice}
                title={
                  notice.fields.department ??
                  t(notice.fields.category ? `category.${notice.fields.category}` : 'category.other')
                }
                meta={notice.fields.category ? t(`category.${notice.fields.category}`) : t('category.other')}
                sourceText={t(notice.source === 'demo' ? 'home.demo' : 'myNotice.saved')}
                dueLabel={t('notice.dueDate')}
                dueText={notice.fields.due_date ? formatDate(notice.fields.due_date) : null}
                onPress={() =>
                  router.push({ pathname: '/my-notice/[id]', params: { id: notice.id } })
                }
              />
            ))
          )}
        </View>

        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>{t('home.samples')}</Text>
            <Text style={styles.demoChip}>{t('home.demo')}</Text>
          </View>

          {MOCK_NOTICES.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              language={language}
              badgeText={t(SCAM_LABEL_KEY[notice.scam.label])}
              dueLabel={t('notice.dueDate')}
              categoryText={t(`category.${notice.category}`)}
              onPress={() => router.push({ pathname: '/notice/[id]', params: { id: notice.id } })}
            />
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
    gap: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    fontSize: Type.heading,
    fontWeight: '700',
    color: Colors.primary,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: Type.touchTarget,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
  },
  settingsLabel: {
    fontSize: Type.small,
    fontWeight: '700',
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  actions: {
    gap: Spacing.md,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryItem: {
    flex: 1,
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: Type.touchTarget,
    paddingHorizontal: Spacing.md,
  },
  sampleLabel: {
    fontSize: Type.small,
    fontWeight: '700',
    color: Colors.primary,
  },
  noticeBanner: {
    fontSize: Type.small,
    color: '#D32F2F',
  },
  recent: {
    gap: Spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: Type.small,
    color: Colors.muted,
  },
  demoChip: {
    fontSize: 14,
    color: Colors.muted,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  disclaimer: {
    fontSize: Type.small,
    color: Colors.muted,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
