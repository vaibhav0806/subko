import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import {
  Calendar,
  CreditCard,
  Bell,
  Pause,
  Play,
  Trash2,
  Edit3,
  ExternalLink,
  Clock,
  TrendingUp,
  Smartphone,
  Hash,
  FileText,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
} from 'lucide-react-native';
import { format, parseISO, differenceInDays } from 'date-fns';

import { useSubscriptionStore } from '@/src/stores/subscriptionStore';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  Spacing,
  BorderRadius,
  SubkoColors,
  Gradients,
  CategoryColors,
  StatusColors,
} from '@/constants/Theme';
import type { SubscriptionCategory, SubscriptionStatus } from '@/src/types';

const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  ott: 'OTT & Streaming',
  music: 'Music',
  utilities: 'Utilities',
  insurance: 'Insurance',
  emi: 'EMI & Loans',
  investment: 'Investment',
  telecom: 'Telecom',
  education: 'Education',
  fitness: 'Fitness',
  cloud: 'Cloud Storage',
  gaming: 'Gaming',
  news: 'News & Media',
  other: 'Other',
};

const FREQUENCY_MULTIPLIER: Record<string, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const pauseSubscription = useSubscriptionStore((state) => state.pauseSubscription);
  const resumeSubscription = useSubscriptionStore((state) => state.resumeSubscription);
  const removeSubscription = useSubscriptionStore((state) => state.removeSubscription);

  const subscription = subscriptions.find((s) => s.id === id);

  if (!subscription) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <AlertCircle size={48} color={colors.textMuted} />
        <Text style={[styles.notFoundText, { color: colors.text }]}>
          Subscription not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.backButtonText, { color: colors.tint }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePauseResume = async () => {
    handlePress();
    if (subscription.status === 'active') {
      Alert.alert(
        'Pause Subscription',
        'This will pause reminders for this subscription. You can resume anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pause',
            onPress: () => pauseSubscription(subscription.id),
          },
        ]
      );
    } else if (subscription.status === 'paused') {
      resumeSubscription(subscription.id);
    }
  };

  const handleDelete = () => {
    handlePress();
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to delete "${subscription.merchantName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeSubscription(subscription.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    handlePress();
    router.push(`/subscription/edit/${subscription.id}`);
  };

  const daysUntilDebit = subscription.nextDebitDate
    ? differenceInDays(parseISO(subscription.nextDebitDate), new Date())
    : null;

  const yearlyAmount = subscription.amount * (FREQUENCY_MULTIPLIER[subscription.frequency] || 1);

  const categoryColor = CategoryColors[subscription.category] || SubkoColors.primary[500];
  const statusColor = StatusColors[subscription.status] || SubkoColors.neutral[500];

  const getStatusIcon = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 size={14} color={statusColor} />;
      case 'paused':
        return <PauseCircle size={14} color={statusColor} />;
      case 'cancelled':
        return <XCircle size={14} color={statusColor} />;
      default:
        return <AlertCircle size={14} color={statusColor} />;
    }
  };

  const getDebitLabel = () => {
    if (daysUntilDebit === null) return null;
    if (daysUntilDebit === 0) return { text: 'Today', urgent: true };
    if (daysUntilDebit === 1) return { text: 'Tomorrow', urgent: true };
    if (daysUntilDebit < 0) return { text: 'Overdue', urgent: true };
    if (daysUntilDebit <= 7) return { text: `${daysUntilDebit} days`, urgent: true };
    return { text: `${daysUntilDebit} days`, urgent: false };
  };

  const debitLabel = getDebitLabel();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />

        {/* Gradient Header */}
        <LinearGradient
          colors={[categoryColor, categoryColor + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Navigation Bar */}
          <Animated.View entering={FadeIn.delay(100)} style={styles.navBar}>
            <Pressable
              onPress={() => {
                handlePress();
                router.back();
              }}
              style={styles.navButton}
            >
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
            <Pressable onPress={handleEdit} style={styles.navButton}>
              <Edit3 size={20} color="#fff" />
            </Pressable>
          </Animated.View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <Animated.View entering={ZoomIn.delay(200)} style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(subscription.merchantName)}</Text>
              </View>
            </Animated.View>

            <Animated.Text
              entering={FadeInUp.delay(300)}
              style={styles.merchantName}
              numberOfLines={2}
            >
              {subscription.merchantName}
            </Animated.Text>

            <Animated.View entering={FadeInUp.delay(400)} style={styles.statusBadge}>
              {getStatusIcon(subscription.status)}
              <Text style={styles.statusText}>{subscription.status}</Text>
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(500)} style={styles.amount}>
              {formatCurrency(subscription.amount)}
              <Text style={styles.frequency}>/{subscription.frequency}</Text>
            </Animated.Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Stats */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.statsRow}>
            {/* Next Debit Card */}
            {subscription.status === 'active' && debitLabel && (
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <View style={[styles.statIconContainer, { backgroundColor: debitLabel.urgent ? '#ef444420' : SubkoColors.primary[500] + '20' }]}>
                  <Clock size={18} color={debitLabel.urgent ? '#ef4444' : SubkoColors.primary[500]} />
                </View>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Next Debit</Text>
                <Text style={[styles.statValue, { color: debitLabel.urgent ? '#ef4444' : colors.text }]}>
                  {debitLabel.text}
                </Text>
              </View>
            )}

            {/* Yearly Cost Card */}
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconContainer, { backgroundColor: SubkoColors.primary[500] + '20' }]}>
                <TrendingUp size={18} color={SubkoColors.primary[500]} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Yearly Cost</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(yearlyAmount)}
              </Text>
            </View>
          </Animated.View>

          {/* Details Section */}
          <Animated.View entering={FadeInDown.delay(700)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
            <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
              <DetailRow
                icon={<CreditCard size={18} color={categoryColor} />}
                label="Category"
                value={CATEGORY_LABELS[subscription.category]}
                colors={colors}
                categoryColor={categoryColor}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <DetailRow
                icon={<Calendar size={18} color={colors.textMuted} />}
                label="Started"
                value={format(parseISO(subscription.startDate), 'dd MMM yyyy')}
                colors={colors}
              />
              {subscription.nextDebitDate && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <DetailRow
                    icon={<Clock size={18} color={colors.textMuted} />}
                    label="Next Debit"
                    value={format(parseISO(subscription.nextDebitDate), 'dd MMM yyyy')}
                    colors={colors}
                  />
                </>
              )}
              {subscription.upiApp && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <DetailRow
                    icon={<Smartphone size={18} color={colors.textMuted} />}
                    label="UPI App"
                    value={subscription.upiApp}
                    colors={colors}
                  />
                </>
              )}
              {subscription.bankAccount && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <DetailRow
                    icon={<Hash size={18} color={colors.textMuted} />}
                    label="Bank Account"
                    value={subscription.bankAccount}
                    colors={colors}
                  />
                </>
              )}
            </View>
          </Animated.View>

          {/* Reminders Section */}
          <Animated.View entering={FadeInDown.delay(800)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reminders</Text>
            <View style={[styles.reminderCard, { backgroundColor: colors.card }]}>
              <View style={styles.reminderContent}>
                <View style={[styles.reminderIconContainer, { backgroundColor: subscription.reminderEnabled ? SubkoColors.primary[500] + '20' : colors.border }]}>
                  <Bell size={20} color={subscription.reminderEnabled ? SubkoColors.primary[500] : colors.textMuted} />
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={[styles.reminderTitle, { color: colors.text }]}>
                    {subscription.reminderEnabled ? 'Reminders Enabled' : 'Reminders Disabled'}
                  </Text>
                  <Text style={[styles.reminderSubtitle, { color: colors.textMuted }]}>
                    {subscription.reminderEnabled
                      ? `You'll be notified ${subscription.reminderDaysBefore} day${subscription.reminderDaysBefore > 1 ? 's' : ''} before debit`
                      : 'Enable reminders to get notified before debits'
                    }
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Notes Section */}
          {subscription.notes && (
            <Animated.View entering={FadeInDown.delay(900)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <View style={[styles.notesCard, { backgroundColor: colors.card }]}>
                <FileText size={18} color={colors.textMuted} style={{ marginRight: Spacing.sm }} />
                <Text style={[styles.notesText, { color: colors.text }]}>
                  {subscription.notes}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Actions Section */}
          <Animated.View entering={FadeInDown.delay(1000)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
            <View style={styles.actionsRow}>
              {(subscription.status === 'active' || subscription.status === 'paused') && (
                <Pressable
                  onPress={handlePauseResume}
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: subscription.status === 'active'
                        ? '#f59e0b15'
                        : '#22c55e15',
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {subscription.status === 'active' ? (
                    <Pause size={20} color="#f59e0b" />
                  ) : (
                    <Play size={20} color="#22c55e" />
                  )}
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: subscription.status === 'active' ? '#f59e0b' : '#22c55e' },
                    ]}
                  >
                    {subscription.status === 'active' ? 'Pause' : 'Resume'}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: '#ef444415', opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Trash2 size={20} color="#ef4444" />
                <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Source Info */}
          <Animated.View entering={FadeIn.delay(1100)} style={styles.sourceInfo}>
            <Text style={[styles.sourceText, { color: colors.textMuted }]}>
              Added via {subscription.source === 'sms' ? 'SMS scan' : subscription.source} on{' '}
              {format(parseISO(subscription.createdAt), 'dd MMM yyyy')}
            </Text>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
  );
}

// Detail Row Component
function DetailRow({
  icon,
  label,
  value,
  colors,
  categoryColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colors: any;
  categoryColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        {icon}
        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      </View>
      {categoryColor ? (
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
          <Text style={[styles.detailValue, { color: categoryColor }]}>{value}</Text>
        </View>
      ) : (
        <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: Spacing.md,
  },
  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  merchantName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.md,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  frequency: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
    marginTop: -Spacing.lg,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.base,
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

  // Details Card
  detailsCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },

  // Reminder Card
  reminderCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  reminderSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Notes Card
  notesCard: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'flex-start',
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Source Info
  sourceInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  sourceText: {
    fontSize: 12,
  },
});
