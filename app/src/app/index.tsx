import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/tokens';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { CURRENT_CONSENT_VERSION } from '@/lib/storage';

export default function Index() {
  const { settings, loading } = useSettings();
  const { session, initializing } = useAuth();

  // Wait for the stored session before choosing a route, otherwise a signed-in user is sent to
  // the sign-in screen for a frame on every cold start.
  if (loading || initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!settings.language) return <Redirect href="/language" />;
  if (settings.consentVersion < CURRENT_CONSENT_VERSION) return <Redirect href="/consent" />;
  if (session || settings.guestMode) return <Redirect href="/home" />;
  return <Redirect href="/sign-in" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
