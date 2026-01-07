import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  MessageSquare,
  Shield,
  Info,
  ChevronRight,
  Trash2,
  Globe,
  RefreshCw,
  RotateCcw,
  Scan,
} from 'lucide-react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { useSubscriptionStore } from '@/src/stores/subscriptionStore';
import {
  requestSmsPermission,
  checkSmsPermission,
  scanForMandates,
} from '@/src/features/sms-parser';
import { clearAllData } from '@/src/services/database';
import { addMonths } from 'date-fns';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isScanning, setIsScanning] = React.useState(false);

  const hasSmsPermission = useOnboardingStore((s) => s.hasSmsPermission);
  const setSmsPermission = useOnboardingStore((s) => s.setSmsPermission);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  const addSubscription = useSubscriptionStore((s) => s.addSubscription);
  const loadSubscriptions = useSubscriptionStore((s) => s.loadSubscriptions);
  const resetStore = useSubscriptionStore((s) => s.resetStore);

  const handleSmsPermission = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Not Available on iOS',
        'iOS does not allow apps to read SMS messages. Use the NPCI portal or add manually.'
      );
      return;
    }

    const granted = await requestSmsPermission();
    await setSmsPermission(granted);

    if (granted) {
      Alert.alert('Permission Granted', 'SMS parsing is now enabled. Tap "Scan SMS Now" to find subscriptions.');
    } else {
      Alert.alert('Permission Denied', 'Without SMS access, you can still add subscriptions manually or use the NPCI portal.');
    }
  };

  const handleScanSms = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Available', 'SMS scanning is only available on Android.');
      return;
    }

    // Check permission first
    const hasPermission = await checkSmsPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable SMS permission first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: handleSmsPermission },
        ]
      );
      return;
    }

    setIsScanning(true);

    try {
      const result = await scanForMandates();

      if (result.success && result.mandates.length > 0) {
        // Import found mandates
        let imported = 0;
        for (const mandate of result.mandates) {
          if (mandate.type === 'created' || mandate.type === 'debited') {
            try {
              const now = new Date();
              await addSubscription({
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
              });
              imported++;
            } catch (e) {
              // Skip duplicates
            }
          }
        }

        await loadSubscriptions();

        Alert.alert(
          'Scan Complete',
          `Found ${result.mandates.length} mandates, imported ${imported} new subscriptions.`
        );
      } else {
        Alert.alert(
          'Scan Complete',
          'No new UPI mandates found in your SMS messages.'
        );
      }
    } catch (error) {
      Alert.alert('Scan Failed', 'An error occurred while scanning SMS.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenNpci = () => {
    router.push('/npci-portal');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your subscriptions and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear database
              await clearAllData();
              // Reset store state
              resetStore();
              // Reset onboarding
              await resetOnboarding();
              // Clear any other async storage
              await AsyncStorage.clear();

              Alert.alert('Data Cleared', 'All data has been deleted successfully.', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/onboarding'),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will show the onboarding screens again on next app launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await resetOnboarding();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    disabled,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.settingRow,
        { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.tint + '20' }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.text, opacity: 0.6 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        <ChevronRight size={20} color={colors.text} style={{ opacity: 0.3 }} />
      )}
    </Pressable>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* NPCI Portal Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>
          OFFICIAL PORTAL
        </Text>
        <SettingRow
          icon={<Globe size={20} color={colors.tint} />}
          title="NPCI UPI Portal"
          subtitle="View all your UPI mandates officially"
          onPress={handleOpenNpci}
        />
      </View>

      {/* SMS Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>
          AUTO-DETECTION {Platform.OS !== 'android' && '(Android Only)'}
        </Text>
        <SettingRow
          icon={<MessageSquare size={20} color={colors.tint} />}
          title="SMS Permission"
          subtitle={
            Platform.OS === 'android'
              ? hasSmsPermission
                ? 'Enabled - can read UPI SMS'
                : 'Disabled - tap to enable'
              : 'Not available on iOS'
          }
          onPress={Platform.OS === 'android' ? handleSmsPermission : undefined}
          rightElement={
            Platform.OS === 'android' ? (
              <Switch
                value={hasSmsPermission}
                onValueChange={handleSmsPermission}
                trackColor={{ false: '#767577', true: colors.tint }}
              />
            ) : (
              <Text style={{ color: colors.text, opacity: 0.4 }}>N/A</Text>
            )
          }
        />
        {Platform.OS === 'android' && (
          <SettingRow
            icon={<Scan size={20} color={colors.tint} />}
            title="Scan SMS Now"
            subtitle={isScanning ? 'Scanning...' : 'Find UPI mandates in your messages'}
            onPress={handleScanSms}
            disabled={isScanning}
          />
        )}
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>
          NOTIFICATIONS
        </Text>
        <SettingRow
          icon={<Bell size={20} color={colors.tint} />}
          title="Push Notifications"
          subtitle="Get reminded before debits"
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: colors.tint }}
            />
          }
        />
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>
          ABOUT
        </Text>
        <SettingRow
          icon={<Shield size={20} color={colors.tint} />}
          title="Privacy Policy"
          subtitle="Your data never leaves your device"
          onPress={() => {
            Alert.alert(
              'Privacy',
              'Subko stores all data locally on your device. SMS messages are only scanned for UPI keywords and never uploaded anywhere.'
            );
          }}
        />
        <SettingRow
          icon={<Info size={20} color={colors.tint} />}
          title="App Version"
          subtitle="1.0.0 (MVP)"
          rightElement={null}
        />
        <SettingRow
          icon={<RotateCcw size={20} color={colors.tint} />}
          title="Reset Onboarding"
          subtitle="Show welcome screens again"
          onPress={handleResetOnboarding}
        />
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#F44336' }]}>DANGER ZONE</Text>
        <Pressable
          onPress={handleClearData}
          style={[
            styles.settingRow,
            { backgroundColor: '#F4433610' },
          ]}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#F4433620' }]}>
            <Trash2 size={20} color="#F44336" />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: '#F44336' }]}>
              Clear All Data
            </Text>
            <Text style={[styles.settingSubtitle, { color: '#F44336', opacity: 0.7 }]}>
              Delete all subscriptions and settings
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.text, opacity: 0.4 }]}>
          Subko - Track your subscriptions
        </Text>
        <Text style={[styles.footerText, { color: colors.text, opacity: 0.3 }]}>
          Made with care in India
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Helper to detect category from merchant name
function detectCategory(merchantName: string): any {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 14,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});
