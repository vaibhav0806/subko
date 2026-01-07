import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useSubscriptionStore } from '@/src/stores/subscriptionStore';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import {
  initializeNotifications,
  rescheduleAllReminders,
} from '@/src/services/notifications';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'onboarding',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Subscription store
  const initializeSubscriptions = useSubscriptionStore((state) => state.initialize);
  const isSubscriptionsInitialized = useSubscriptionStore((state) => state.isInitialized);
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);

  // Onboarding store
  const loadOnboardingState = useOnboardingStore((state) => state.loadOnboardingState);
  const isOnboardingLoading = useOnboardingStore((state) => state.isLoading);
  const isOnboardingComplete = useOnboardingStore((state) => state.isOnboardingComplete);

  // Navigation state
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Notification response listener ref
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Initialize stores and notifications
  useEffect(() => {
    loadOnboardingState();
    initializeSubscriptions();
    // Initialize notifications (will fail silently in Expo Go)
    initializeNotifications().catch(() => {
      console.log('Notifications not available in Expo Go');
    });
  }, []);

  // Setup notification listeners
  useEffect(() => {
    try {
      // Listen for incoming notifications while app is foregrounded
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          // Handle notification received while app is in foreground
          console.log('Notification received:', notification);
        }
      );

      // Listen for notification responses (when user taps notification)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          if (data?.subscriptionId) {
            // Navigate to subscription detail
            router.push(`/subscription/${data.subscriptionId}`);
          }
        }
      );
    } catch (error) {
      // Notifications not available in Expo Go
      console.log('Notification listeners not available in Expo Go');
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Reschedule reminders when subscriptions change
  useEffect(() => {
    if (isSubscriptionsInitialized && subscriptions.length > 0) {
      rescheduleAllReminders(subscriptions).catch(() => {
        // Notifications not available in Expo Go
      });
    }
  }, [isSubscriptionsInitialized, subscriptions]);

  // Handle navigation based on onboarding state
  useEffect(() => {
    if (!navigationState?.key) return;
    if (isOnboardingLoading) return;

    const currentRoute = segments[0];

    // Routes allowed during onboarding (before completion)
    const onboardingRoutes = ['onboarding', 'npci-portal'];
    const inOnboardingFlow = onboardingRoutes.includes(currentRoute);

    if (isOnboardingComplete && currentRoute === 'onboarding') {
      // Onboarding done, redirect from onboarding to main app
      router.replace('/(tabs)');
    } else if (!isOnboardingComplete && !inOnboardingFlow) {
      // Onboarding not done and not on allowed route, go to onboarding
      router.replace('/onboarding');
    }
  }, [isOnboardingComplete, isOnboardingLoading, segments, navigationState?.key]);

  // Hide splash when ready
  useEffect(() => {
    if (loaded && isSubscriptionsInitialized && !isOnboardingLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isSubscriptionsInitialized, isOnboardingLoading]);

  if (!loaded || !isSubscriptionsInitialized || isOnboardingLoading) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Onboarding */}
        <Stack.Screen
          name="onboarding/index"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        {/* Main App Tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* NPCI Portal */}
        <Stack.Screen
          name="npci-portal"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />

        {/* Subscription Screens */}
        <Stack.Screen
          name="subscription/[id]"
          options={{
            title: 'Subscription Details',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="subscription/add"
          options={{
            title: 'Add Subscription',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="subscription/edit/[id]"
          options={{
            title: 'Edit Subscription',
            presentation: 'modal',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
