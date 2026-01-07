import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addMonths, format } from 'date-fns';
import {
  Tv,
  Music,
  Zap,
  Shield,
  Wallet,
  TrendingUp,
  Phone,
  GraduationCap,
  Dumbbell,
  Cloud,
  Gamepad2,
  Newspaper,
  MoreHorizontal,
  Calendar,
  Bell,
  FileText,
  Check,
  IndianRupee,
} from 'lucide-react-native';

import { useSubscriptionStore } from '@/src/stores/subscriptionStore';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  Spacing,
  BorderRadius,
  SubkoColors,
  Gradients,
  CategoryColors,
} from '@/constants/Theme';
import type { SubscriptionCategory, SubscriptionFrequency } from '@/src/types';

const CATEGORY_ICONS: Record<SubscriptionCategory, React.ReactNode> = {
  ott: <Tv size={18} />,
  music: <Music size={18} />,
  utilities: <Zap size={18} />,
  insurance: <Shield size={18} />,
  emi: <Wallet size={18} />,
  investment: <TrendingUp size={18} />,
  telecom: <Phone size={18} />,
  education: <GraduationCap size={18} />,
  fitness: <Dumbbell size={18} />,
  cloud: <Cloud size={18} />,
  gaming: <Gamepad2 size={18} />,
  news: <Newspaper size={18} />,
  other: <MoreHorizontal size={18} />,
};

const CATEGORIES: { value: SubscriptionCategory; label: string }[] = [
  { value: 'ott', label: 'OTT' },
  { value: 'music', label: 'Music' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'emi', label: 'EMI' },
  { value: 'investment', label: 'Investment' },
  { value: 'education', label: 'Education' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'news', label: 'News' },
  { value: 'other', label: 'Other' },
];

const FREQUENCIES: { value: SubscriptionFrequency; label: string; short: string }[] = [
  { value: 'monthly', label: 'Monthly', short: '/mo' },
  { value: 'yearly', label: 'Yearly', short: '/yr' },
  { value: 'weekly', label: 'Weekly', short: '/wk' },
  { value: 'quarterly', label: 'Quarterly', short: '/qt' },
  { value: 'daily', label: 'Daily', short: '/day' },
];

const REMINDER_DAYS = [1, 2, 3, 5, 7];

const schema = z.object({
  merchantName: z.string().min(1, 'Name is required'),
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddSubscriptionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const addSubscription = useSubscriptionStore((state) => state.addSubscription);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Additional form state
  const [nextDebitDate, setNextDebitDate] = useState(addMonths(new Date(), 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(1);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      merchantName: '',
      amount: '',
      category: 'ott',
      frequency: 'monthly',
      notes: '',
    },
  });

  const watchedCategory = watch('category') as SubscriptionCategory;
  const watchedAmount = watch('amount');
  const watchedFrequency = watch('frequency');

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onSubmit = async (data: FormData) => {
    handlePress();
    setIsSubmitting(true);
    try {
      await addSubscription({
        merchantName: data.merchantName,
        amount: parseFloat(data.amount),
        currency: 'INR',
        category: data.category as SubscriptionCategory,
        frequency: data.frequency as SubscriptionFrequency,
        status: 'active',
        startDate: new Date().toISOString(),
        nextDebitDate: nextDebitDate.toISOString(),
        source: 'manual',
        reminderEnabled,
        reminderDaysBefore: reminderDays,
        notes: data.notes || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to add subscription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryColor = CategoryColors[watchedCategory] || SubkoColors.primary[500];

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getFrequencyShort = () => {
    const freq = FREQUENCIES.find(f => f.value === watchedFrequency);
    return freq?.short || '/mo';
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Subscription',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Preview Card */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <LinearGradient
              colors={[categoryColor, categoryColor + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewCard}
            >
              <View style={styles.previewIcon}>
                {React.cloneElement(CATEGORY_ICONS[watchedCategory] as React.ReactElement, {
                  color: '#fff',
                  size: 24,
                })}
              </View>
              <Text style={styles.previewAmount}>
                {watchedAmount ? formatCurrency(watchedAmount) : '₹0'}
                <Text style={styles.previewFrequency}>{getFrequencyShort()}</Text>
              </Text>
              <Text style={styles.previewLabel}>Preview</Text>
            </LinearGradient>
          </Animated.View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Field */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Info</Text>

              <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  Subscription Name
                </Text>
                <Controller
                  control={control}
                  name="merchantName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g., Netflix, Spotify, Jio"
                      placeholderTextColor={colors.textMuted}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="words"
                    />
                  )}
                />
              </View>
              {errors.merchantName && (
                <Text style={styles.error}>{errors.merchantName.message}</Text>
              )}

              {/* Amount Field */}
              <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  Amount (INR)
                </Text>
                <View style={styles.amountRow}>
                  <IndianRupee size={20} color={colors.textMuted} />
                  <Controller
                    control={control}
                    name="amount"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, styles.amountInput, { color: colors.text }]}
                        placeholder="199"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
              </View>
              {errors.amount && (
                <Text style={styles.error}>{errors.amount.message}</Text>
              )}
            </Animated.View>

            {/* Frequency */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing Cycle</Text>
              <Controller
                control={control}
                name="frequency"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.frequencyGrid}>
                    {FREQUENCIES.map((freq) => {
                      const isSelected = value === freq.value;
                      return (
                        <Pressable
                          key={freq.value}
                          onPress={() => {
                            handlePress();
                            onChange(freq.value);
                          }}
                          style={[
                            styles.frequencyButton,
                            {
                              backgroundColor: isSelected
                                ? SubkoColors.primary[500]
                                : colors.card,
                              borderWidth: isSelected ? 0 : 1,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.frequencyText,
                              { color: isSelected ? '#fff' : colors.text },
                            ]}
                          >
                            {freq.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </Animated.View>

            {/* Category */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = value === cat.value;
                      const catColor = CategoryColors[cat.value];
                      return (
                        <Pressable
                          key={cat.value}
                          onPress={() => {
                            handlePress();
                            onChange(cat.value);
                          }}
                          style={[
                            styles.categoryButton,
                            {
                              backgroundColor: isSelected
                                ? catColor + '20'
                                : colors.card,
                              borderWidth: isSelected ? 1.5 : 1,
                              borderColor: isSelected ? catColor : colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.categoryIcon,
                              { backgroundColor: isSelected ? catColor + '30' : 'transparent' },
                            ]}
                          >
                            {React.cloneElement(
                              CATEGORY_ICONS[cat.value] as React.ReactElement,
                              { color: isSelected ? catColor : colors.textMuted }
                            )}
                          </View>
                          <Text
                            style={[
                              styles.categoryText,
                              { color: isSelected ? catColor : colors.text },
                            ]}
                          >
                            {cat.label}
                          </Text>
                          {isSelected && (
                            <View style={[styles.categoryCheck, { backgroundColor: catColor }]}>
                              <Check size={10} color="#fff" strokeWidth={3} />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </Animated.View>

            {/* Next Debit Date */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Next Debit</Text>
              <Pressable
                onPress={() => {
                  handlePress();
                  setShowDatePicker(true);
                }}
                style={[styles.dateButton, { backgroundColor: colors.card }]}
              >
                <Calendar size={20} color={SubkoColors.primary[500]} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {format(nextDebitDate, 'EEEE, dd MMMM yyyy')}
                </Text>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={nextDebitDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setNextDebitDate(date);
                  }}
                />
              )}
            </Animated.View>

            {/* Reminders */}
            <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Reminders</Text>
              <View style={[styles.reminderCard, { backgroundColor: colors.card }]}>
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderLeft}>
                    <View
                      style={[
                        styles.reminderIcon,
                        { backgroundColor: reminderEnabled ? SubkoColors.primary[500] + '20' : colors.border },
                      ]}
                    >
                      <Bell
                        size={18}
                        color={reminderEnabled ? SubkoColors.primary[500] : colors.textMuted}
                      />
                    </View>
                    <View>
                      <Text style={[styles.reminderTitle, { color: colors.text }]}>
                        Payment Reminder
                      </Text>
                      <Text style={[styles.reminderSubtitle, { color: colors.textMuted }]}>
                        Get notified before debit
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={(value) => {
                      handlePress();
                      setReminderEnabled(value);
                    }}
                    trackColor={{
                      false: isDark ? '#333' : '#ddd',
                      true: SubkoColors.primary[500] + '60',
                    }}
                    thumbColor={reminderEnabled ? SubkoColors.primary[500] : '#fff'}
                  />
                </View>

                {reminderEnabled && (
                  <View style={styles.reminderDaysContainer}>
                    <Text style={[styles.reminderDaysLabel, { color: colors.textMuted }]}>
                      Remind me
                    </Text>
                    <View style={styles.reminderDaysRow}>
                      {REMINDER_DAYS.map((days) => {
                        const isSelected = reminderDays === days;
                        return (
                          <Pressable
                            key={days}
                            onPress={() => {
                              handlePress();
                              setReminderDays(days);
                            }}
                            style={[
                              styles.reminderDayButton,
                              {
                                backgroundColor: isSelected
                                  ? SubkoColors.primary[500]
                                  : 'transparent',
                                borderColor: isSelected
                                  ? SubkoColors.primary[500]
                                  : colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.reminderDayText,
                                { color: isSelected ? '#fff' : colors.text },
                              ]}
                            >
                              {days}d
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={[styles.reminderDaysHint, { color: colors.textMuted }]}>
                      days before payment
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Notes */}
            <Animated.View entering={FadeInDown.delay(700)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (Optional)</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                <View style={styles.notesHeader}>
                  <FileText size={16} color={colors.textMuted} />
                  <Text style={[styles.inputLabel, { color: colors.textMuted, marginLeft: 8 }]}>
                    Additional notes
                  </Text>
                </View>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.textArea, { color: colors.text }]}
                      placeholder="Add any notes about this subscription..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.delay(800)} style={styles.submitContainer}>
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <LinearGradient
                  colors={isSubmitting ? ['#666', '#555'] : Gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButton}
                >
                  {isSubmitting ? (
                    <Text style={styles.submitButtonText}>Adding...</Text>
                  ) : (
                    <>
                      <Check size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Add Subscription</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Preview Card
  previewCard: {
    margin: Spacing.base,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  previewFrequency: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  previewLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Form
  form: {
    paddingHorizontal: Spacing.base,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    opacity: 0.6,
  },

  // Input
  inputContainer: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -4,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  // Frequency
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  frequencyButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Category
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },

  // Date
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Reminders
  reminderCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  reminderSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  reminderDaysContainer: {
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  reminderDaysLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  reminderDaysRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reminderDayButton: {
    width: 44,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reminderDaysHint: {
    fontSize: 12,
    marginTop: Spacing.sm,
  },

  // Submit
  submitContainer: {
    marginTop: Spacing.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
