import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  CreditCard,
  Bell,
  MessageSquare,
  Shield,
  ChevronRight,
  CheckCircle2,
  Scan,
  Globe,
  Smartphone,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Lock,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
} from 'react-native-reanimated';

import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { useSubscriptionStore } from '@/src/stores/subscriptionStore';
import {
  requestSmsPermission,
  scanForMandates,
  isRunningInExpoGo,
} from '@/src/features/sms-parser';
import type { ParsedMandate } from '@/src/features/sms-parser/types';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  Spacing,
  BorderRadius,
  SubkoColors,
  Gradients,
} from '@/constants/Theme';
import { addMonths } from 'date-fns';

const { width, height } = Dimensions.get('window');

type OnboardingStep = 'welcome' | 'permission' | 'scanning' | 'results' | 'npci';

const STEPS: OnboardingStep[] = ['welcome', 'permission', 'scanning', 'results', 'npci'];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [detectedMandates, setDetectedMandates] = useState<ParsedMandate[]>([]);
  const [isExpoGo] = useState(isRunningInExpoGo());

  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const setSmsPermission = useOnboardingStore((s) => s.setSmsPermission);
  const addSubscription = useSubscriptionStore((s) => s.addSubscription);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRequestPermission = async () => {
    handlePress();
    if (Platform.OS !== 'android') {
      setStep('npci');
      return;
    }

    if (isExpoGo) {
      Alert.alert(
        'Demo Mode',
        'Running in Expo Go - SMS permission is not available. We\'ll load demo data to show you how the app works.\n\nBuild with EAS for real SMS scanning.',
        [
          {
            text: 'Load Demo Data',
            onPress: () => {
              setStep('scanning');
              performScan();
            },
          },
          {
            text: 'Skip to NPCI Portal',
            onPress: () => setStep('npci'),
          },
        ]
      );
      return;
    }

    const granted = await requestSmsPermission();
    await setSmsPermission(granted);

    if (granted) {
      setStep('scanning');
      performScan();
    } else {
      setStep('npci');
    }
  };

  const performScan = async () => {
    const result = await scanForMandates();

    if (result.success && result.mandates.length > 0) {
      setDetectedMandates(result.mandates);
      setStep('results');
    } else {
      setDetectedMandates([]);
      setStep('results');
    }
  };

  const handleImportMandates = async () => {
    let imported = 0;

    for (const mandate of detectedMandates) {
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
          console.error('Failed to import mandate:', e);
        }
      }
    }

    return imported;
  };

  const handleComplete = async () => {
    handlePress();
    if (detectedMandates.length > 0) {
      await handleImportMandates();
    }
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleSkipToManual = async () => {
    handlePress();
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleOpenNpci = () => {
    handlePress();
    router.push('/npci-portal');
  };

  // Calculate progress
  const currentStepIndex = STEPS.indexOf(step);
  const progressSteps = ['welcome', 'permission', 'results'];
  const progressIndex = progressSteps.indexOf(step);
  const showProgress = progressIndex >= 0;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Progress Indicator */}
      {showProgress && step !== 'scanning' && (
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.progressContainer}
        >
          {progressSteps.map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                {
                  backgroundColor: i <= progressIndex
                    ? SubkoColors.primary[500]
                    : isDark ? '#333' : '#ddd',
                  width: i === progressIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {step === 'welcome' && (
        <WelcomeStep
          colors={colors}
          isDark={isDark}
          onNext={() => {
            handlePress();
            setStep('permission');
          }}
        />
      )}

      {step === 'permission' && (
        <PermissionStep
          colors={colors}
          isDark={isDark}
          isExpoGo={isExpoGo}
          onGrant={handleRequestPermission}
          onSkip={() => {
            handlePress();
            setStep('npci');
          }}
        />
      )}

      {step === 'scanning' && (
        <ScanningStep colors={colors} isDark={isDark} isExpoGo={isExpoGo} />
      )}

      {step === 'results' && (
        <ResultsStep
          colors={colors}
          isDark={isDark}
          mandates={detectedMandates}
          isExpoGo={isExpoGo}
          onComplete={handleComplete}
          onOpenNpci={handleOpenNpci}
        />
      )}

      {step === 'npci' && (
        <NpciStep
          colors={colors}
          isDark={isDark}
          onOpenNpci={handleOpenNpci}
          onSkip={handleSkipToManual}
        />
      )}
    </View>
  );
}

// Welcome Step Component
function WelcomeStep({
  colors,
  isDark,
  onNext,
}: {
  colors: any;
  isDark: boolean;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <Animated.View entering={ZoomIn.delay(200)} style={styles.logoContainer}>
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>S</Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(400)} style={styles.heroTitle}>
          Subko
        </Animated.Text>

        <Animated.Text entering={FadeInUp.delay(500)} style={styles.heroSubtitle}>
          Track UPI Subscriptions
        </Animated.Text>
      </LinearGradient>

      {/* Content */}
      <View style={styles.contentSection}>
        <Animated.Text
          entering={FadeInUp.delay(600)}
          style={[styles.welcomeHeading, { color: colors.text }]}
        >
          Never miss a{'\n'}recurring payment
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(700)}
          style={[styles.welcomeDescription, { color: colors.textSecondary }]}
        >
          Get reminders before debits and see exactly where your money goes.
        </Animated.Text>

        {/* Feature Pills */}
        <Animated.View entering={FadeInUp.delay(800)} style={styles.featurePills}>
          <FeaturePill
            icon={<Scan size={16} color={SubkoColors.primary[500]} />}
            text="Auto-detect"
            isDark={isDark}
          />
          <FeaturePill
            icon={<Bell size={16} color={SubkoColors.primary[500]} />}
            text="Reminders"
            isDark={isDark}
          />
          <FeaturePill
            icon={<TrendingUp size={16} color={SubkoColors.primary[500]} />}
            text="Analytics"
            isDark={isDark}
          />
        </Animated.View>

        {/* Privacy Note */}
        <Animated.View
          entering={FadeInUp.delay(900)}
          style={[styles.privacyNote, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
        >
          <Lock size={14} color={colors.textMuted} />
          <Text style={[styles.privacyNoteText, { color: colors.textMuted }]}>
            Your data stays on your device
          </Text>
        </Animated.View>
      </View>

      {/* CTA Button */}
      <Animated.View entering={FadeInUp.delay(1000)} style={styles.ctaContainer}>
        <Pressable onPress={onNext}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <ArrowRight size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Feature Pill Component
function FeaturePill({
  icon,
  text,
  isDark
}: {
  icon: React.ReactNode;
  text: string;
  isDark: boolean;
}) {
  return (
    <View style={[
      styles.featurePill,
      { backgroundColor: isDark ? '#1a1a1a' : '#f0fdf4' }
    ]}>
      {icon}
      <Text style={[
        styles.featurePillText,
        { color: isDark ? '#fff' : SubkoColors.primary[700] }
      ]}>
        {text}
      </Text>
    </View>
  );
}

// Permission Step Component
function PermissionStep({
  colors,
  isDark,
  isExpoGo,
  onGrant,
  onSkip,
}: {
  colors: any;
  isDark: boolean;
  isExpoGo: boolean;
  onGrant: () => void;
  onSkip: () => void;
}) {
  const isAndroid = Platform.OS === 'android';

  return (
    <Animated.View entering={SlideInRight.duration(400)} style={styles.stepContainer}>
      {/* Icon Header */}
      <View style={styles.stepHeader}>
        <Animated.View
          entering={ZoomIn.delay(200)}
          style={[styles.stepIconContainer, { backgroundColor: '#22c55e20' }]}
        >
          <MessageSquare size={40} color="#22c55e" />
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(300)}
          style={[styles.stepTitle, { color: colors.text }]}
        >
          {isAndroid ? 'Scan Your SMS' : 'SMS Not Available'}
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(400)}
          style={[styles.stepDescription, { color: colors.textSecondary }]}
        >
          {isAndroid
            ? isExpoGo
              ? 'In Expo Go, we\'ll show demo data. Build with EAS to scan your real SMS.'
              : 'We scan your SMS to find UPI AutoPay mandates. Your messages never leave your device.'
            : 'iOS doesn\'t allow SMS reading. Use the NPCI portal or add subscriptions manually.'
          }
        </Animated.Text>
      </View>

      {/* Info Cards */}
      <View style={styles.stepContent}>
        {isExpoGo && isAndroid && (
          <Animated.View
            entering={FadeInUp.delay(500)}
            style={[styles.infoCard, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b30' }]}
          >
            <Smartphone size={20} color="#f59e0b" />
            <View style={styles.infoCardContent}>
              <Text style={[styles.infoCardTitle, { color: '#f59e0b' }]}>
                Demo Mode
              </Text>
              <Text style={[styles.infoCardText, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                Running in Expo Go - sample data will be shown
              </Text>
            </View>
          </Animated.View>
        )}

        {!isExpoGo && isAndroid && (
          <Animated.View
            entering={FadeInUp.delay(500)}
            style={[styles.infoCard, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', borderColor: isDark ? '#333' : '#e2e8f0' }]}
          >
            <Shield size={20} color={SubkoColors.primary[500]} />
            <View style={styles.infoCardContent}>
              <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                Privacy First
              </Text>
              <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
                We only scan for bank SMS with mandate keywords. Nothing is uploaded.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* What we look for */}
        <Animated.View
          entering={FadeInUp.delay(600)}
          style={[styles.lookForCard, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }]}
        >
          <Text style={[styles.lookForTitle, { color: colors.textMuted }]}>
            WE LOOK FOR
          </Text>
          <View style={styles.lookForItems}>
            <Text style={[styles.lookForItem, { color: colors.text }]}>• Mandate created alerts</Text>
            <Text style={[styles.lookForItem, { color: colors.text }]}>• AutoPay debit notifications</Text>
            <Text style={[styles.lookForItem, { color: colors.text }]}>• Subscription confirmations</Text>
          </View>
        </Animated.View>
      </View>

      {/* Buttons */}
      <View style={styles.ctaContainer}>
        <Pressable onPress={onGrant}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {isAndroid
                ? isExpoGo ? 'Load Demo Data' : 'Allow SMS Access'
                : 'Continue'
              }
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onSkip} style={styles.secondaryButton}>
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
            Skip to NPCI Portal
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// Scanning Step Component
function ScanningStep({
  colors,
  isDark,
  isExpoGo
}: {
  colors: any;
  isDark: boolean;
  isExpoGo: boolean;
}) {
  return (
    <View style={styles.scanningContainer}>
      <Animated.View entering={ZoomIn} style={styles.scanningAnimation}>
        <LinearGradient
          colors={Gradients.primary}
          style={styles.scanningCircle}
        >
          <Scan size={48} color="#fff" />
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)} style={styles.scanningTextContainer}>
        <ActivityIndicator size="small" color={SubkoColors.primary[500]} style={{ marginBottom: 16 }} />
        <Text style={[styles.scanningTitle, { color: colors.text }]}>
          {isExpoGo ? 'Loading Demo Data' : 'Scanning Messages'}
        </Text>
        <Text style={[styles.scanningSubtitle, { color: colors.textSecondary }]}>
          {isExpoGo
            ? 'Preparing sample subscriptions...'
            : 'Looking for UPI AutoPay mandates...'
          }
        </Text>
      </Animated.View>
    </View>
  );
}

// Results Step Component
function ResultsStep({
  colors,
  isDark,
  mandates,
  isExpoGo,
  onComplete,
  onOpenNpci,
}: {
  colors: any;
  isDark: boolean;
  mandates: ParsedMandate[];
  isExpoGo: boolean;
  onComplete: () => void;
  onOpenNpci: () => void;
}) {
  const hasResults = mandates.length > 0;

  return (
    <Animated.View entering={SlideInRight.duration(400)} style={styles.stepContainer}>
      {/* Header */}
      <View style={styles.stepHeader}>
        <Animated.View
          entering={ZoomIn.delay(200)}
          style={[
            styles.stepIconContainer,
            { backgroundColor: hasResults ? '#22c55e20' : '#f59e0b20' }
          ]}
        >
          {hasResults ? (
            <Sparkles size={40} color="#22c55e" />
          ) : (
            <CheckCircle2 size={40} color="#f59e0b" />
          )}
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(300)}
          style={[styles.stepTitle, { color: colors.text }]}
        >
          {hasResults
            ? `Found ${mandates.length} Subscription${mandates.length > 1 ? 's' : ''}!`
            : 'No Subscriptions Found'
          }
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(400)}
          style={[styles.stepDescription, { color: colors.textSecondary }]}
        >
          {hasResults
            ? isExpoGo
              ? 'These are demo subscriptions to show you how Subko works.'
              : 'We detected these active UPI AutoPay mandates from your SMS.'
            : 'We couldn\'t find any UPI mandates. Try the NPCI portal or add manually.'
          }
        </Animated.Text>
      </View>

      {/* Results List */}
      <View style={styles.stepContent}>
        {isExpoGo && hasResults && (
          <Animated.View
            entering={FadeInUp.delay(450)}
            style={[styles.demoBadge, { backgroundColor: '#3b82f620' }]}
          >
            <Smartphone size={14} color="#3b82f6" />
            <Text style={[styles.demoBadgeText, { color: '#3b82f6' }]}>
              Demo Data
            </Text>
          </Animated.View>
        )}

        {hasResults && (
          <Animated.View entering={FadeInUp.delay(500)} style={styles.resultsList}>
            {mandates.slice(0, 4).map((mandate, index) => (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(550 + index * 100)}
                style={[
                  styles.resultItem,
                  { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }
                ]}
              >
                <View style={[styles.resultAvatar, { backgroundColor: SubkoColors.primary[500] + '20' }]}>
                  <Text style={[styles.resultAvatarText, { color: SubkoColors.primary[500] }]}>
                    {mandate.merchantName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
                    {mandate.merchantName}
                  </Text>
                  <Text style={[styles.resultMeta, { color: colors.textMuted }]}>
                    {mandate.frequency}
                  </Text>
                </View>
                <Text style={[styles.resultAmount, { color: SubkoColors.primary[500] }]}>
                  ₹{mandate.amount.toLocaleString('en-IN')}
                </Text>
              </Animated.View>
            ))}
            {mandates.length > 4 && (
              <Text style={[styles.moreText, { color: colors.textMuted }]}>
                +{mandates.length - 4} more
              </Text>
            )}
          </Animated.View>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.ctaContainer}>
        <Pressable onPress={onComplete}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {hasResults ? 'Import & Continue' : 'Continue to App'}
            </Text>
            <ArrowRight size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        {!hasResults && (
          <Pressable onPress={onOpenNpci} style={styles.secondaryButton}>
            <Globe size={18} color={SubkoColors.primary[500]} />
            <Text style={[styles.secondaryButtonText, { color: SubkoColors.primary[500], marginLeft: 8 }]}>
              Check NPCI Portal
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// NPCI Step Component
function NpciStep({
  colors,
  isDark,
  onOpenNpci,
  onSkip,
}: {
  colors: any;
  isDark: boolean;
  onOpenNpci: () => void;
  onSkip: () => void;
}) {
  return (
    <Animated.View entering={SlideInRight.duration(400)} style={styles.stepContainer}>
      {/* Header */}
      <View style={styles.stepHeader}>
        <Animated.View
          entering={ZoomIn.delay(200)}
          style={[styles.stepIconContainer, { backgroundColor: '#3b82f620' }]}
        >
          <Globe size={40} color="#3b82f6" />
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(300)}
          style={[styles.stepTitle, { color: colors.text }]}
        >
          NPCI Official Portal
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(400)}
          style={[styles.stepDescription, { color: colors.textSecondary }]}
        >
          View all your UPI AutoPay mandates directly from the official NPCI portal.
        </Animated.Text>
      </View>

      {/* Info */}
      <View style={styles.stepContent}>
        <Animated.View
          entering={FadeInUp.delay(500)}
          style={[styles.infoCard, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', borderColor: isDark ? '#333' : '#e2e8f0' }]}
        >
          <Shield size={20} color="#3b82f6" />
          <View style={styles.infoCardContent}>
            <Text style={[styles.infoCardTitle, { color: colors.text }]}>
              Official & Secure
            </Text>
            <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
              This opens upihelp.npci.org.in - the official NPCI website. You'll verify with OTP.
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(600)}
          style={[styles.npciFeatures, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }]}
        >
          <View style={styles.npciFeature}>
            <CheckCircle2 size={16} color={SubkoColors.primary[500]} />
            <Text style={[styles.npciFeatureText, { color: colors.text }]}>
              View all active mandates
            </Text>
          </View>
          <View style={styles.npciFeature}>
            <CheckCircle2 size={16} color={SubkoColors.primary[500]} />
            <Text style={[styles.npciFeatureText, { color: colors.text }]}>
              See mandate limits & dates
            </Text>
          </View>
          <View style={styles.npciFeature}>
            <CheckCircle2 size={16} color={SubkoColors.primary[500]} />
            <Text style={[styles.npciFeatureText, { color: colors.text }]}>
              Works on all platforms
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Buttons */}
      <View style={styles.ctaContainer}>
        <Pressable onPress={onOpenNpci}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Globe size={20} color="#fff" />
            <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>
              Open NPCI Portal
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onSkip} style={styles.secondaryButton}>
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
            Skip & Add Manually
          </Text>
        </Pressable>
      </View>
    </Animated.View>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 60,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
  },

  // Welcome Step Styles
  heroGradient: {
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  welcomeHeading: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: Spacing.md,
  },
  welcomeDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  featurePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  privacyNoteText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Step Styles
  stepHeader: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  stepIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Look For Card
  lookForCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  lookForTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  lookForItems: {
    gap: 6,
  },
  lookForItem: {
    fontSize: 14,
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.base,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: Spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Scanning
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  scanningAnimation: {
    marginBottom: Spacing['2xl'],
  },
  scanningCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningTextContainer: {
    alignItems: 'center',
  },
  scanningTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  scanningSubtitle: {
    fontSize: 14,
  },

  // Results
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.md,
  },
  demoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultsList: {
    gap: Spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  resultAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  moreText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: Spacing.sm,
  },

  // NPCI
  npciFeatures: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  npciFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  npciFeatureText: {
    fontSize: 14,
  },
});
