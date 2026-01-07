import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import { scanForMandates } from '../../features/sms-parser';
import { getAllSubscriptions, insertSubscription } from '../database';
import type { Subscription, SubscriptionCategory } from '../../types';

const SMS_MONITOR_TASK = 'SUBKO_SMS_MONITOR';

// Helper to detect category from merchant name
function detectCategory(merchantName: string): SubscriptionCategory {
  const name = merchantName.toLowerCase();

  if (['netflix', 'prime', 'hotstar', 'zee5', 'sony', 'voot', 'mxplayer'].some(s => name.includes(s))) {
    return 'ott';
  }
  if (['spotify', 'gaana', 'saavn', 'wynk', 'apple music', 'youtube music'].some(s => name.includes(s))) {
    return 'music';
  }
  if (['youtube premium', 'youtube'].some(s => name.includes(s))) {
    return 'ott';
  }
  if (['cult', 'fitness', 'gym'].some(s => name.includes(s))) {
    return 'fitness';
  }
  if (['google one', 'icloud', 'dropbox', 'onedrive'].some(s => name.includes(s))) {
    return 'cloud';
  }
  if (['insurance', 'hdfc ergo', 'icici lombard', 'lic'].some(s => name.includes(s))) {
    return 'insurance';
  }
  if (['airtel', 'jio', 'vodafone', 'vi ', 'bsnl'].some(s => name.includes(s))) {
    return 'telecom';
  }

  return 'other';
}

// Define the background task
TaskManager.defineTask(SMS_MONITOR_TASK, async () => {
  if (Platform.OS !== 'android') {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  try {
    // Scan for new mandates
    const result = await scanForMandates();

    if (!result.success || result.mandates.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Get existing subscriptions
    const existingSubscriptions = await getAllSubscriptions();
    const existingMerchants = new Set(
      existingSubscriptions.map((s) => s.merchantName.toLowerCase())
    );

    let newCount = 0;

    // Import new mandates
    for (const mandate of result.mandates) {
      // Skip if already exists
      if (existingMerchants.has(mandate.merchantName.toLowerCase())) {
        continue;
      }

      // Only import created or debited mandates
      if (mandate.type !== 'created' && mandate.type !== 'debited') {
        continue;
      }

      const now = new Date();
      const subscription: Subscription = {
        id: uuidv4(),
        merchantName: mandate.merchantName,
        amount: mandate.amount,
        currency: 'INR',
        frequency: mandate.frequency,
        category: detectCategory(mandate.merchantName),
        status: 'active',
        startDate: mandate.date.toISOString(),
        nextDebitDate: addMonths(now, 1).toISOString(),
        upiApp: mandate.upiApp,
        bankAccount: mandate.bankAccount,
        source: 'sms',
        smsPattern: mandate.originalSms,
        reminderEnabled: true,
        reminderDaysBefore: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      try {
        await insertSubscription(subscription);
        existingMerchants.add(mandate.merchantName.toLowerCase());
        newCount++;
      } catch (error) {
        // Skip if insert fails (likely duplicate)
        console.log('Failed to insert subscription:', error);
      }
    }

    // Send notification if new subscriptions found
    if (newCount > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Subscriptions Found',
          body: `Subko found ${newCount} new UPI mandate${newCount > 1 ? 's' : ''}`,
          data: { type: 'newMandates' },
        },
        trigger: null, // Immediate
      });

      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background SMS scan failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background SMS monitor task
 */
export async function registerSmsMonitorTask(): Promise<void> {
  if (Platform.OS !== 'android') {
    console.log('Background SMS monitoring only available on Android');
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_MONITOR_TASK);

    if (isRegistered) {
      console.log('SMS monitor task already registered');
      return;
    }

    await BackgroundFetch.registerTaskAsync(SMS_MONITOR_TASK, {
      minimumInterval: 60 * 60, // 1 hour minimum
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('SMS monitor task registered successfully');
  } catch (error) {
    console.error('Failed to register SMS monitor task:', error);
  }
}

/**
 * Unregister the background SMS monitor task
 */
export async function unregisterSmsMonitorTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_MONITOR_TASK);

    if (!isRegistered) {
      return;
    }

    await TaskManager.unregisterTaskAsync(SMS_MONITOR_TASK);
    console.log('SMS monitor task unregistered');
  } catch (error) {
    console.error('Failed to unregister SMS monitor task:', error);
  }
}

/**
 * Check if the background SMS monitor task is registered
 */
export async function isSmsMonitorRegistered(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(SMS_MONITOR_TASK);
  } catch {
    return false;
  }
}

/**
 * Get the status of background fetch
 */
export async function getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
  return BackgroundFetch.getStatusAsync();
}

export default {
  registerSmsMonitorTask,
  unregisterSmsMonitorTask,
  isSmsMonitorRegistered,
  getBackgroundFetchStatus,
  SMS_MONITOR_TASK,
};
