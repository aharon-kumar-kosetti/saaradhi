import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Days before the due date, largest first, so the screen reads in time order. */
export const REMINDER_OFFSETS = [7, 3, 1, 0] as const;

/** Morning is when an elderly user is most likely to act on it. */
export const REMINDER_HOUR = 9;

const CHANNEL_ID = 'due-reminders';

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Due dates',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** False means the OS refused; the screen must say so instead of pretending a reminder exists. */
export async function askReminderPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function cancelReminders(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // Already fired or gone; nothing left to cancel.
      }
    }),
  );
}

/** Guest privacy promise: deleting all data must also stop every future reminder. */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // No notification module available (for example on web); nothing to cancel.
  }
}

export interface ReminderContent {
  title: string;
  body: string;
}

export interface SyncRemindersInput {
  noticeId: string;
  dueDate: string | null;
  /** The offsets the user wants, as shown on the guide screen. */
  offsets: number[];
  /** Ids already scheduled for this notice; they are replaced, not added to. */
  previousIds: string[];
  content: (daysBefore: number, dueDate: string) => ReminderContent;
}

export interface ReminderSchedule {
  offsets: number[];
  ids: string[];
}

function reminderDate(dueDate: string, daysBefore: number): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dueDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Local time, because a reminder at 09:00 UTC would be the middle of the night here.
  const date = new Date(year, month - 1, day - daysBefore, REMINDER_HOUR, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Replaces this notice's reminders with exactly `offsets`. Returns null when permission was
 * refused, and keeps only the offsets that actually got a notification (past dates are dropped).
 */
export async function syncReminders(input: SyncRemindersInput): Promise<ReminderSchedule | null> {
  const dueDate = input.dueDate;
  if (!dueDate || input.offsets.length === 0) {
    await cancelReminders(input.previousIds);
    return { offsets: [], ids: [] };
  }

  const granted = await askReminderPermission();
  if (!granted) return null;

  await cancelReminders(input.previousIds);

  const ids: string[] = [];
  const offsets: number[] = [];
  for (const daysBefore of input.offsets) {
    const date = reminderDate(dueDate, daysBefore);
    if (!date || date.getTime() <= Date.now()) continue;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { ...input.content(daysBefore, dueDate), sound: false, data: { noticeId: input.noticeId } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
      });
      ids.push(id);
      offsets.push(daysBefore);
    } catch {
      // One failed reminder must not wipe out the others.
    }
  }

  return { offsets, ids };
}
