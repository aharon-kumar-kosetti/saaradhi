import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoticeCard } from '@/components/notice-card';
import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, Type } from '@/constants/tokens';
import { MOCK_NOTICES } from '@/data/mock-notices';
import { SCAM_LABEL_KEY } from '@/i18n/translations';
import { useSettings } from '@/lib/settings-context';
import { CURRENT_CONSENT_VERSION } from '@/lib/storage';

export default function HomeScreen() {
  const { t, language, settings } = useSettings();
  const consented = settings.consentVersion >= CURRENT_CONSENT_VERSION;

  const openReading = (name: string) => router.push({ pathname: '/reading', params: { name } });

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
    openReading(result.assets[0]?.fileName ?? 'photo');
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
    if (asset) openReading(asset.name);
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
        </View>

        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>{t('home.recent')}</Text>
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
