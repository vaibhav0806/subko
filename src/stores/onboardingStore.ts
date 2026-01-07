import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';
const SMS_PERMISSION_KEY = 'sms_permission_granted';

interface OnboardingState {
  isOnboardingComplete: boolean;
  hasSmsPermission: boolean;
  isLoading: boolean;
  currentStep: number;
  detectedSubscriptionsCount: number;

  // Actions
  loadOnboardingState: () => Promise<void>;
  setStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  setSmsPermission: (granted: boolean) => Promise<void>;
  setDetectedCount: (count: number) => void;
  resetOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isOnboardingComplete: false,
  hasSmsPermission: false,
  isLoading: true,
  currentStep: 0,
  detectedSubscriptionsCount: 0,

  loadOnboardingState: async () => {
    try {
      const [onboardingComplete, smsPermission] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
        AsyncStorage.getItem(SMS_PERMISSION_KEY),
      ]);

      set({
        isOnboardingComplete: onboardingComplete === 'true',
        hasSmsPermission: smsPermission === 'true',
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
      set({ isLoading: false });
    }
  },

  setStep: (step) => {
    set({ currentStep: step });
  },

  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      set({ isOnboardingComplete: true });
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  },

  setSmsPermission: async (granted) => {
    try {
      await AsyncStorage.setItem(SMS_PERMISSION_KEY, granted.toString());
      set({ hasSmsPermission: granted });
    } catch (error) {
      console.error('Failed to save SMS permission state:', error);
    }
  },

  setDetectedCount: (count) => {
    set({ detectedSubscriptionsCount: count });
  },

  resetOnboarding: async () => {
    try {
      await AsyncStorage.multiRemove([ONBOARDING_COMPLETE_KEY, SMS_PERMISSION_KEY]);
      set({
        isOnboardingComplete: false,
        hasSmsPermission: false,
        currentStep: 0,
        detectedSubscriptionsCount: 0,
      });
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  },
}));
