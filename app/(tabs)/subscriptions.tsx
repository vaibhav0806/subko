import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Plus, ChevronRight, CreditCard, Search } from 'lucide-react-native';

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
import type { SubscriptionCategory, SubscriptionStatus, Subscription } from '@/src/types';

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

type FilterType = 'all' | SubscriptionStatus;

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function SubscriptionsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const loadSubscriptions = useSubscriptionStore((state) => state.loadSubscriptions);
  const isLoading = useSubscriptionStore((state) => state.isLoading);

  const [filter, setFilter] = useState<FilterType>('all');

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

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

  const getStatusColor = (status: SubscriptionStatus) => {
    return StatusColors[status] || SubkoColors.neutral[500];
  };

  const renderSubscriptionCard = ({ item, index }: { item: Subscription; index: number }) => (
    <Animated.View entering={FadeInRight.duration(300).delay(index * 50)}>
      <Link href={`/subscription/${item.id}`} asChild>
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
              { backgroundColor: CategoryColors[item.category] + '20' },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: CategoryColors[item.category] },
              ]}
            >
              {getInitials(item.merchantName)}
            </Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text
                style={[styles.merchantName, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.merchantName}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + '15' },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <View style={styles.cardMeta}>
              <Text style={[styles.category, { color: colors.textSecondary }]}>
                {CATEGORY_LABELS[item.category]}
              </Text>
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
              <Text style={[styles.frequency, { color: colors.textSecondary }]}>
                {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
              </Text>
              {item.nextDebitDate && item.status === 'active' && (
                <>
                  <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
                  <Text style={[styles.nextDebit, { color: colors.textSecondary }]}>
                    {new Date(item.nextDebitDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.amount, { color: colors.text }]}>
              {formatCurrency(item.amount)}
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Bar */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTERS.map((f) => {
            const isSelected = filter === f.value;
            const count =
              f.value === 'all'
                ? subscriptions.length
                : subscriptions.filter((s) => s.status === f.value).length;

            return (
              <Pressable
                key={f.value}
                onPress={() => {
                  handlePress();
                  setFilter(f.value);
                }}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: isSelected
                      ? colors.tint
                      : colors.card,
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    { color: isSelected ? '#fff' : colors.text },
                  ]}
                >
                  {f.label}
                </Text>
                <View
                  style={[
                    styles.filterCount,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255,255,255,0.2)'
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      { color: isSelected ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Subscriptions List */}
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadSubscriptions}
            tintColor={colors.tint}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <CreditCard size={32} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {filter === 'all'
                ? 'No subscriptions yet'
                : `No ${filter} subscriptions`}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filter === 'all'
                ? 'Add your first subscription to start tracking'
                : 'Subscriptions with this status will appear here'}
            </Text>
            {filter === 'all' && (
              <Link href="/subscription/add" asChild>
                <Pressable
                  onPress={handlePress}
                  style={[styles.emptyButton, { borderColor: colors.tint }]}
                >
                  <View style={styles.emptyButtonContent}>
                    <Plus size={16} color={colors.tint} />
                    <Text style={[styles.emptyButtonText, { color: colors.tint }]}>
                      Add Subscription
                    </Text>
                  </View>
                </Pressable>
              </Link>
            )}
          </View>
        }
        renderItem={renderSubscriptionCard}
      />

      {/* FAB */}
      <Link href="/subscription/add" asChild>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.fab,
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterWrapper: {
    paddingVertical: Spacing.md,
  },
  filterContainer: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.base,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterCount: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 100,
    gap: Spacing.sm,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  category: {
    fontSize: 13,
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: 8,
  },
  frequency: {
    fontSize: 13,
  },
  nextDebit: {
    fontSize: 13,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.xl,
  },
  emptyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: BorderRadius.full,
    shadowColor: SubkoColors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
