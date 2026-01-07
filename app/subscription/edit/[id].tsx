import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useSubscriptionStore } from '@/src/stores/subscriptionStore';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Spacing, BorderRadius, SubkoColors } from '@/constants/Theme';
import type { SubscriptionCategory, SubscriptionFrequency, Subscription } from '@/src/types';

const CATEGORIES: { value: SubscriptionCategory; label: string }[] = [
  { value: 'ott', label: 'OTT' },
  { value: 'music', label: 'Music' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'emi', label: 'EMI' },
  { value: 'investment', label: 'Investment' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'education', label: 'Education' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'news', label: 'News' },
  { value: 'other', label: 'Other' },
];

const FREQUENCIES: { value: SubscriptionFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'daily', label: 'Daily' },
];

const REMINDER_DAYS = [1, 2, 3, 5, 7];

const schema = z.object({
  merchantName: z.string().min(1, 'Name is required'),
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  notes: z.string().optional(),
  reminderEnabled: z.boolean(),
  reminderDaysBefore: z.number(),
});

type FormData = z.infer<typeof schema>;

function calculateNextDebitDate(currentDate: Date, frequency: SubscriptionFrequency): Date {
  switch (frequency) {
    case 'daily':
      return addDays(currentDate, 1);
    case 'weekly':
      return addWeeks(currentDate, 1);
    case 'monthly':
      return addMonths(currentDate, 1);
    case 'quarterly':
      return addMonths(currentDate, 3);
    case 'yearly':
      return addYears(currentDate, 1);
    default:
      return addMonths(currentDate, 1);
  }
}

export default function EditSubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const editSubscription = useSubscriptionStore((state) => state.editSubscription);

  const subscription = subscriptions.find((s) => s.id === id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextDebitDate, setNextDebitDate] = useState<Date>(
    subscription?.nextDebitDate ? parseISO(subscription.nextDebitDate) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      merchantName: subscription?.merchantName || '',
      amount: subscription?.amount?.toString() || '',
      category: subscription?.category || 'other',
      frequency: subscription?.frequency || 'monthly',
      notes: subscription?.notes || '',
      reminderEnabled: subscription?.reminderEnabled ?? true,
      reminderDaysBefore: subscription?.reminderDaysBefore ?? 1,
    },
  });

  const reminderEnabled = watch('reminderEnabled');
  const currentFrequency = watch('frequency');

  // Update next debit date when frequency changes
  useEffect(() => {
    if (subscription?.lastDebitDate) {
      const newNextDate = calculateNextDebitDate(
        parseISO(subscription.lastDebitDate),
        currentFrequency as SubscriptionFrequency
      );
      setNextDebitDate(newNextDate);
    }
  }, [currentFrequency]);

  if (!subscription) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Subscription not found</Text>
      </View>
    );
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const updatedSubscription: Subscription = {
        ...subscription,
        merchantName: data.merchantName,
        amount: parseFloat(data.amount),
        category: data.category as SubscriptionCategory,
        frequency: data.frequency as SubscriptionFrequency,
        notes: data.notes || undefined,
        nextDebitDate: nextDebitDate.toISOString(),
        reminderEnabled: data.reminderEnabled,
        reminderDaysBefore: data.reminderDaysBefore,
        updatedAt: new Date().toISOString(),
      };

      await editSubscription(updatedSubscription);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update subscription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNextDebitDate(selectedDate);
    }
  };

  const SelectButton = ({
    selected,
    label,
    onPress,
    compact = false,
  }: {
    selected: boolean;
    label: string;
    onPress: () => void;
    compact?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectButton,
        compact && styles.selectButtonCompact,
        {
          backgroundColor: selected
            ? colors.tint
            : colorScheme === 'dark'
            ? colors.card
            : '#E5E5E5',
          borderWidth: selected ? 0 : 1,
          borderColor: colorScheme === 'dark' ? colors.border : '#D4D4D4',
        },
      ]}
    >
      <Text
        style={[
          styles.selectButtonText,
          compact && styles.selectButtonTextCompact,
          { color: selected ? '#fff' : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        {/* Merchant Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Subscription Name *</Text>
          <Controller
            control={control}
            name="merchantName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., Netflix, Spotify"
                placeholderTextColor={colors.textMuted}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.merchantName && (
            <Text style={styles.error}>{errors.merchantName.message}</Text>
          )}
        </View>

        {/* Amount */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Amount (INR) *</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., 199"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.amount && <Text style={styles.error}>{errors.amount.message}</Text>}
        </View>

        {/* Frequency */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Frequency *</Text>
          <Controller
            control={control}
            name="frequency"
            render={({ field: { onChange, value } }) => (
              <View style={styles.selectContainer}>
                {FREQUENCIES.map((freq) => (
                  <SelectButton
                    key={freq.value}
                    selected={value === freq.value}
                    label={freq.label}
                    onPress={() => onChange(freq.value)}
                  />
                ))}
              </View>
            )}
          />
        </View>

        {/* Next Debit Date */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Next Debit Date</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.dateButtonText, { color: colors.text }]}>
              {format(nextDebitDate, 'dd MMMM yyyy')}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={nextDebitDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <View style={styles.selectContainer}>
                {CATEGORIES.map((cat) => (
                  <SelectButton
                    key={cat.value}
                    selected={value === cat.value}
                    label={cat.label}
                    onPress={() => onChange(cat.value)}
                    compact
                  />
                ))}
              </View>
            )}
          />
        </View>

        {/* Reminder Settings */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.reminderHeader}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
              Reminder
            </Text>
            <Controller
              control={control}
              name="reminderEnabled"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{
                    false: colorScheme === 'dark' ? '#333' : '#D4D4D4',
                    true: SubkoColors.primary[400],
                  }}
                  thumbColor={value ? SubkoColors.primary[500] : '#f4f3f4'}
                />
              )}
            />
          </View>

          {reminderEnabled && (
            <View style={styles.reminderDays}>
              <Text style={[styles.reminderLabel, { color: colors.textSecondary }]}>
                Remind me before
              </Text>
              <Controller
                control={control}
                name="reminderDaysBefore"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.reminderDaysContainer}>
                    {REMINDER_DAYS.map((days) => (
                      <Pressable
                        key={days}
                        onPress={() => onChange(days)}
                        style={[
                          styles.reminderDayButton,
                          {
                            backgroundColor:
                              value === days
                                ? colors.tint
                                : colorScheme === 'dark'
                                ? '#262626'
                                : '#E5E5E5',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.reminderDayText,
                            { color: value === days ? '#fff' : colors.text },
                          ]}
                        >
                          {days}d
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              />
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Any additional notes..."
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

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          style={[
            styles.submitButton,
            { backgroundColor: colors.tint, opacity: isSubmitting ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: SubkoColors.error,
    fontSize: 13,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  selectButtonCompact: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectButtonTextCompact: {
    fontSize: 13,
  },
  dateButton: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
  card: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderDays: {
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  reminderLabel: {
    fontSize: 14,
  },
  reminderDaysContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reminderDayButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
