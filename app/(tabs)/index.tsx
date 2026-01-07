import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  Plus,
  Bell,
  ChevronRight,
  CreditCard,
  Calendar,
  TrendingUp,
  Wallet,
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

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const getStats = useSubscriptionStore((state) => state.getStats);
  const loadSubscriptions = useSubscriptionStore((state) => state.loadSubscriptions);
  const isLoading = useSubscriptionStore((state) => state.isLoading);

  const stats = getStats();
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');

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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadSubscriptions}
          tintColor={colors.tint}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Welcome to Subko
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Your Subscriptions
          </Text>
        </View>
        <Link href="/subscription/add" asChild>
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
              styles.addButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Plus size={22} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        </Link>
      </View>

      {/* Hero Stats Card */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)}>
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroIconContainer}>
              <Wallet size={24} color="#fff" />
            </View>
            <Text style={styles.heroLabel}>Total Monthly Spend</Text>
          </View>
          <Text style={styles.heroAmount}>
            {formatCurrency(stats.totalMonthlySpend)}
          </Text>
          <View style={styles.heroFooter}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.totalActive}</Text>
              <Text style={styles.heroStatLabel}>Active</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {formatCurrency(stats.totalYearlySpend)}
              </Text>
              <Text style={styles.heroStatLabel}>Yearly</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Quick Stats */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={styles.quickStats}
      >
        <View
          style={[
            styles.quickStatCard,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={[styles.quickStatIcon, { backgroundColor: SubkoColors.info + '15' }]}>
            <CreditCard size={18} color={SubkoColors.info} />
          </View>
          <Text style={[styles.quickStatValue, { color: colors.text }]}>
            {stats.totalActive}
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
            Active
          </Text>
        </View>

        <View
          style={[
            styles.quickStatCard,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={[styles.quickStatIcon, { backgroundColor: SubkoColors.warning + '15' }]}>
            <Calendar size={18} color={SubkoColors.warning} />
          </View>
          <Text style={[styles.quickStatValue, { color: colors.text }]}>
            {stats.upcomingDebits.length}
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
            This week
          </Text>
        </View>

        <View
          style={[
            styles.quickStatCard,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={[styles.quickStatIcon, { backgroundColor: SubkoColors.success + '15' }]}>
            <TrendingUp size={18} color={SubkoColors.success} />
          </View>
          <Text style={[styles.quickStatValue, { color: colors.text }]}>
            {Object.values(stats.byCategory).filter((v) => v > 0).length}
          </Text>
          <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
            Categories
          </Text>
        </View>
      </Animated.View>

      {/* Upcoming Debits */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(300)}
        style={styles.section}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Upcoming Debits
        </Text>
        {stats.upcomingDebits.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.tint + '15' }]}>
              <Bell size={28} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No upcoming debits
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No payments scheduled for this week
            </Text>
          </View>
        ) : (
          <View style={styles.upcomingList}>
            {stats.upcomingDebits.slice(0, 3).map(({ subscription, daysUntil }, index) => (
              <Animated.View
                key={subscription.id}
                entering={FadeInRight.duration(400).delay(index * 100)}
              >
                <Link href={`/subscription/${subscription.id}`} asChild>
                  <Pressable
                    onPress={handlePress}
                    style={({ pressed }) => [
                      styles.upcomingCard,
                      { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: CategoryColors[subscription.category] + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          { color: CategoryColors[subscription.category] },
                        ]}
                      >
                        {getInitials(subscription.merchantName)}
                      </Text>
                    </View>
                    <View style={styles.upcomingInfo}>
                      <Text style={[styles.merchantName, { color: colors.text }]}>
                        {subscription.merchantName}
                      </Text>
                      <View style={styles.upcomingMeta}>
                        <View
                          style={[
                            styles.daysBadge,
                            {
                              backgroundColor:
                                daysUntil === 0
                                  ? SubkoColors.error + '15'
                                  : daysUntil <= 2
                                  ? SubkoColors.warning + '15'
                                  : colors.tint + '15',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.daysBadgeText,
                              {
                                color:
                                  daysUntil === 0
                                    ? SubkoColors.error
                                    : daysUntil <= 2
                                    ? SubkoColors.warning
                                    : colors.tint,
                              },
                            ]}
                          >
                            {daysUntil === 0
                              ? 'Today'
                              : daysUntil === 1
                              ? 'Tomorrow'
                              : `${daysUntil} days`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.upcomingAmount}>
                      <Text style={[styles.amount, { color: colors.text }]}>
                        {formatCurrency(subscription.amount)}
                      </Text>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </View>
                  </Pressable>
                </Link>
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Recent Subscriptions */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(400)}
        style={styles.section}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Subscriptions
          </Text>
          <Link href="/(tabs)/subscriptions" asChild>
            <Pressable onPress={handlePress}>
              <Text style={[styles.seeAll, { color: colors.tint }]}>See all</Text>
            </Pressable>
          </Link>
        </View>
        {activeSubscriptions.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.tint + '15' }]}>
              <CreditCard size={28} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No subscriptions yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add your first subscription to start tracking
            </Text>
            <Link href="/subscription/add" asChild>
              <Pressable
                onPress={handlePress}
                style={[styles.emptyButton, { borderColor: colors.tint }]}
              >
                <Plus size={16} color={colors.tint} />
                <Text style={[styles.emptyButtonText, { color: colors.tint }]}>
                  Add Subscription
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <View style={styles.subscriptionList}>
            {activeSubscriptions.slice(0, 5).map((subscription, index) => (
              <Animated.View
                key={subscription.id}
                entering={FadeInRight.duration(400).delay(index * 80)}
              >
                <Link href={`/subscription/${subscription.id}`} asChild>
                  <Pressable
                    onPress={handlePress}
                    style={({ pressed }) => [
                      styles.subscriptionCard,
                      { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: CategoryColors[subscription.category] + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          { color: CategoryColors[subscription.category] },
                        ]}
                      >
                        {getInitials(subscription.merchantName)}
                      </Text>
                    </View>
                    <View style={styles.subscriptionInfo}>
                      <Text style={[styles.merchantName, { color: colors.text }]}>
                        {subscription.merchantName}
                      </Text>
                      <Text style={[styles.subscriptionMeta, { color: colors.textSecondary }]}>
                        {subscription.frequency.charAt(0).toUpperCase() +
                          subscription.frequency.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.subscriptionAmount}>
                      <Text style={[styles.amount, { color: colors.text }]}>
                        {formatCurrency(subscription.amount)}
                      </Text>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </View>
                  </Pressable>
                </Link>
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>

      <View style={{ height: Spacing['3xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  addButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  heroIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.lg,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroStat: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.lg,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  heroStatLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  quickStatCard: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  quickStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  upcomingList: {
    gap: Spacing.sm,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
  },
  upcomingInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  upcomingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  daysBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  daysBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  upcomingAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  subscriptionList: {
    gap: Spacing.sm,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  subscriptionAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
