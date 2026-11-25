import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/tokens';
import { useSettings } from '@/lib/settings-context';
import { CURRENT_CONSENT_VERSION } from '@/lib/storage';

export default function Index() {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!settings.language) return <Redirect href="/language" />;
  if (settings.consentVersion < CURRENT_CONSENT_VERSION) return <Redirect href="/consent" />;
  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
