import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Subscription } from '../../types';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification behavior (only if not in Expo Go)
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Notification channel for Android
const CHANNEL_ID = 'subscription-reminders';

/**
 * Initialize notification settings and create Android channel
 */
export async function initializeNotifications(): Promise<void> {
  // Skip in Expo Go - push notifications not available
  if (isExpoGo) {
    console.log('Notifications: Running in Expo Go, skipping initialization');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Subscription Reminders',
      description: 'Reminders for upcoming subscription debits',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
    });
  }
}

/**
 * Request notification permissions
 * @returns true if permission granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Skip in Expo Go
  if (isExpoGo) {
    console.log('Notifications: Running in Expo Go, permissions not available');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if notifications are enabled
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  if (isExpoGo) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a reminder notification for a subscription
 * @param subscription The subscription to schedule reminder for
 * @returns The notification identifier, or null if not scheduled
 */
export async function scheduleSubscriptionReminder(
  subscription: Subscription
): Promise<string | null> {
  // Skip in Expo Go
  if (isExpoGo) return null;

  // Don't schedule if reminders are disabled or no next debit date
  if (!subscription.reminderEnabled || !subscription.nextDebitDate) {
    return null;
  }

  // Only schedule for active subscriptions
  if (subscription.status !== 'active') {
    return null;
  }

  // Calculate trigger date (nextDebitDate - reminderDaysBefore)
  const nextDebitDate = new Date(subscription.nextDebitDate);
  const triggerDate = new Date(nextDebitDate);
  triggerDate.setDate(triggerDate.getDate() - subscription.reminderDaysBefore);
  triggerDate.setHours(9, 0, 0, 0); // 9:00 AM

  // Don't schedule if trigger date is in the past
  if (triggerDate <= new Date()) {
    return null;
  }

  // Format amount for display
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: subscription.currency || 'INR',
    maximumFractionDigits: 0,
  }).format(subscription.amount);

  // Create notification content
  const dayText = subscription.reminderDaysBefore === 1
    ? 'tomorrow'
    : `in ${subscription.reminderDaysBefore} days`;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${subscription.merchantName} payment ${dayText}`,
      body: `${formattedAmount} will be debited from your account`,
      data: {
        subscriptionId: subscription.id,
        type: 'reminder',
      },
      sound: true,
    },
    trigger: {
      date: triggerDate,
      channelId: CHANNEL_ID,
    },
  });

  return identifier;
}

/**
 * Cancel a scheduled notification
 * @param identifier The notification identifier to cancel
 */
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Reschedule all reminders for active subscriptions
 * Call this when app starts or when subscriptions are modified
 * @param subscriptions List of all subscriptions
 */
export async function rescheduleAllReminders(
  subscriptions: Subscription[]
): Promise<void> {
  // Skip in Expo Go
  if (isExpoGo) return;

  // Cancel all existing notifications first
  await cancelAllNotifications();

  // Schedule reminders for active subscriptions with reminders enabled
  for (const subscription of subscriptions) {
    if (subscription.status === 'active' && subscription.reminderEnabled) {
      await scheduleSubscriptionReminder(subscription);
    }
  }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Send an immediate notification (for testing)
 */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'Subko notifications are working!',
      data: { type: 'test' },
    },
    trigger: null, // Immediate
  });
}

export default {
  initializeNotifications,
  requestNotificationPermissions,
  checkNotificationPermissions,
  scheduleSubscriptionReminder,
  cancelNotification,
  cancelAllNotifications,
  rescheduleAllReminders,
  getScheduledNotifications,
  sendTestNotification,
};
