import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';

import { SettingsProvider } from '@/lib/settings-context';

// Without a handler a due-date reminder is silently dropped while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  return (
    <SettingsProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SettingsProvider>
  );
}
