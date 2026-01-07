import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { TrendingUp, PieChart, Calendar, CreditCard } from 'lucide-react-native';

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
import type { SubscriptionCategory } from '@/src/types';

const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  ott: 'OTT',
  music: 'Music',
  utilities: 'Utilities',
  insurance: 'Insurance',
  emi: 'EMI',
  investment: 'Investment',
  telecom: 'Telecom',
  education: 'Education',
  fitness: 'Fitness',
  cloud: 'Cloud',
  gaming: 'Gaming',
  news: 'News',
  other: 'Other',
};

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const getStats = useSubscriptionStore((state) => state.getStats);
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);

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

  // Get categories with spending
  const categorySpending = Object.entries(stats.byCategory)
    .filter(([_, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  const totalSpend = categorySpending.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Cards */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.summaryContainer}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryIcon}>
            <Calendar size={20} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.summaryLabel}>Monthly Spend</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats.totalMonthlySpend)}</Text>
        </LinearGradient>
        <View style={[styles.summaryCard, styles.summaryCardSecondary, { backgroundColor: colors.card }]}>
          <View style={[styles.summaryIcon, { backgroundColor: SubkoColors.success + '15' }]}>
            <TrendingUp size={20} color={SubkoColors.success} />
          </View>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Yearly Spend</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatCurrency(stats.totalYearlySpend)}
          </Text>
        </View>
      </Animated.View>

      {/* Category Breakdown */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={styles.section}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Spending by Category
        </Text>

        {categorySpending.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.tint + '15' }]}>
              <PieChart size={28} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No spending data yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add subscriptions to see category breakdown
            </Text>
          </View>
        ) : (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            {categorySpending.map(([category, amount], index) => {
              const percentage = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
              const categoryColor = CategoryColors[category as SubscriptionCategory];
              return (
                <Animated.View
                  key={category}
                  entering={FadeInRight.duration(400).delay(index * 80)}
                  style={styles.categoryRow}
                >
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: categoryColor },
                      ]}
                    />
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {CATEGORY_LABELS[category as SubscriptionCategory]}
                    </Text>
                  </View>
                  <View style={[styles.categoryBar, { backgroundColor: colors.border }]}>
                    <Animated.View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: categoryColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.categoryAmount, { color: colors.text }]}>
                    {formatCurrency(amount)}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        )}
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(300)}
        style={styles.section}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Stats
        </Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: SubkoColors.info + '15' }]}>
              <CreditCard size={18} color={SubkoColors.info} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {stats.totalActive}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Subscriptions
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: SubkoColors.warning + '15' }]}>
              <PieChart size={18} color={SubkoColors.warning} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {categorySpending.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Categories
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: SubkoColors.success + '15' }]}>
              <TrendingUp size={18} color={SubkoColors.success} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {stats.totalActive > 0
                ? formatCurrency(stats.totalMonthlySpend / stats.totalActive)
                : formatCurrency(0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Avg. per Sub
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: SubkoColors.primary[500] + '15' }]}>
              <Calendar size={18} color={SubkoColors.primary[500]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {formatCurrency(stats.totalMonthlySpend * 12)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Projected Yearly
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Top Subscriptions */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(400)}
        style={styles.section}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Top Subscriptions
        </Text>
        {activeSubscriptions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No active subscriptions
            </Text>
          </View>
        ) : (
          <View style={styles.topSubList}>
            {activeSubscriptions
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)
              .map((sub, index) => (
                <Animated.View
                  key={sub.id}
                  entering={FadeInRight.duration(400).delay(index * 80)}
                  style={[
                    styles.topSubRow,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <View style={[styles.rankBadge, { backgroundColor: colors.tint + '15' }]}>
                    <Text style={[styles.rankText, { color: colors.tint }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.topSubAvatar,
                      { backgroundColor: CategoryColors[sub.category] + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.topSubAvatarText,
                        { color: CategoryColors[sub.category] },
                      ]}
                    >
                      {getInitials(sub.merchantName)}
                    </Text>
                  </View>
                  <View style={styles.topSubInfo}>
                    <Text style={[styles.topSubName, { color: colors.text }]}>
                      {sub.merchantName}
                    </Text>
                    <Text style={[styles.topSubCategory, { color: colors.textSecondary }]}>
                      {CATEGORY_LABELS[sub.category]}
                    </Text>
                  </View>
                  <Text style={[styles.topSubAmount, { color: colors.text }]}>
                    {formatCurrency(sub.amount)}
                  </Text>
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
  summaryContainer: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  summaryCardSecondary: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    padding: Spacing.base,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  emptyCard: {
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  chartCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 95,
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryBar: {
    flex: 1,
    height: 8,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '600',
    width: 70,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statBox: {
    width: (screenWidth - Spacing.base * 2 - Spacing.md) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  topSubList: {
    gap: Spacing.sm,
  },
  topSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topSubAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSubAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  topSubInfo: {
    flex: 1,
  },
  topSubName: {
    fontSize: 15,
    fontWeight: '600',
  },
  topSubCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  topSubAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
});
