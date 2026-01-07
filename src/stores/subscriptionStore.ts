import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllSubscriptions,
  getActiveSubscriptions,
  insertSubscription,
  updateSubscription,
  deleteSubscription,
  initDatabase,
} from '../services/database';
import type { Subscription, SubscriptionCategory, SubscriptionStats } from '../types';
import { addMonths, addWeeks, addDays, addYears, differenceInDays, parseISO } from 'date-fns';

interface SubscriptionState {
  subscriptions: Subscription[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  loadSubscriptions: () => Promise<void>;
  addSubscription: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editSubscription: (subscription: Subscription) => Promise<void>;
  removeSubscription: (id: string) => Promise<void>;
  pauseSubscription: (id: string) => Promise<void>;
  resumeSubscription: (id: string) => Promise<void>;
  resetStore: () => void;

  // Computed
  getStats: () => SubscriptionStats;
  getUpcomingDebits: (days: number) => Subscription[];
  getByCategory: (category: SubscriptionCategory) => Subscription[];
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true, error: null });
    try {
      await initDatabase();
      await get().loadSubscriptions();
      set({ isInitialized: true });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const subscriptions = await getAllSubscriptions();
      set({ subscriptions });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addSubscription: async (data) => {
    const now = new Date().toISOString();
    const subscription: Subscription = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await insertSubscription(subscription);
      set((state) => ({
        subscriptions: [...state.subscriptions, subscription],
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  editSubscription: async (subscription) => {
    const updated = {
      ...subscription,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateSubscription(updated);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === subscription.id ? updated : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  removeSubscription: async (id) => {
    try {
      await deleteSubscription(id);
      set((state) => ({
        subscriptions: state.subscriptions.filter((s) => s.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  pauseSubscription: async (id) => {
    const subscription = get().subscriptions.find((s) => s.id === id);
    if (!subscription) return;

    await get().editSubscription({
      ...subscription,
      status: 'paused',
    });
  },

  resumeSubscription: async (id) => {
    const subscription = get().subscriptions.find((s) => s.id === id);
    if (!subscription) return;

    await get().editSubscription({
      ...subscription,
      status: 'active',
    });
  },

  resetStore: () => {
    set({
      subscriptions: [],
      isLoading: false,
      error: null,
    });
  },

  getStats: () => {
    const subscriptions = get().subscriptions;
    const active = subscriptions.filter((s) => s.status === 'active');

    const byCategory: Record<SubscriptionCategory, number> = {
      ott: 0,
      music: 0,
      utilities: 0,
      insurance: 0,
      emi: 0,
      investment: 0,
      telecom: 0,
      education: 0,
      fitness: 0,
      cloud: 0,
      gaming: 0,
      news: 0,
      other: 0,
    };

    let totalMonthly = 0;

    active.forEach((sub) => {
      byCategory[sub.category] += sub.amount;

      // Normalize to monthly
      switch (sub.frequency) {
        case 'daily':
          totalMonthly += sub.amount * 30;
          break;
        case 'weekly':
          totalMonthly += sub.amount * 4;
          break;
        case 'monthly':
          totalMonthly += sub.amount;
          break;
        case 'quarterly':
          totalMonthly += sub.amount / 3;
          break;
        case 'yearly':
          totalMonthly += sub.amount / 12;
          break;
        default:
          totalMonthly += sub.amount;
      }
    });

    const today = new Date();
    const upcomingDebits = active
      .filter((sub) => sub.nextDebitDate)
      .map((sub) => ({
        subscription: sub,
        daysUntil: differenceInDays(parseISO(sub.nextDebitDate!), today),
      }))
      .filter((item) => item.daysUntil >= 0 && item.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return {
      totalActive: active.length,
      totalMonthlySpend: Math.round(totalMonthly),
      totalYearlySpend: Math.round(totalMonthly * 12),
      byCategory,
      upcomingDebits,
    };
  },

  getUpcomingDebits: (days) => {
    const subscriptions = get().subscriptions;
    const today = new Date();

    return subscriptions
      .filter((sub) => sub.status === 'active' && sub.nextDebitDate)
      .filter((sub) => {
        const daysUntil = differenceInDays(parseISO(sub.nextDebitDate!), today);
        return daysUntil >= 0 && daysUntil <= days;
      })
      .sort((a, b) =>
        differenceInDays(parseISO(a.nextDebitDate!), parseISO(b.nextDebitDate!))
      );
  },

  getByCategory: (category) => {
    return get().subscriptions.filter(
      (s) => s.category === category && s.status === 'active'
    );
  },
}));

// Helper to calculate next debit date
export function calculateNextDebitDate(
  lastDate: Date,
  frequency: Subscription['frequency']
): Date {
  switch (frequency) {
    case 'daily':
      return addDays(lastDate, 1);
    case 'weekly':
      return addWeeks(lastDate, 1);
    case 'monthly':
      return addMonths(lastDate, 1);
    case 'quarterly':
      return addMonths(lastDate, 3);
    case 'yearly':
      return addYears(lastDate, 1);
    default:
      return lastDate;
  }
}
