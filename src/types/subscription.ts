export type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'cancelled';

export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one_time';

export type SubscriptionCategory =
  | 'ott'           // Netflix, Prime, Hotstar
  | 'music'         // Spotify, Apple Music
  | 'utilities'     // Electricity, Water, Gas
  | 'insurance'     // Health, Life, Vehicle
  | 'emi'           // Loan EMIs
  | 'investment'    // SIP, Mutual Funds
  | 'telecom'       // Mobile, Broadband
  | 'education'     // Courses, Learning apps
  | 'fitness'       // Gym, Cult, etc
  | 'cloud'         // iCloud, Google One
  | 'gaming'        // PlayStation, Xbox
  | 'news'          // News subscriptions
  | 'other';

export interface Subscription {
  id: string;
  merchantName: string;
  merchantLogo?: string;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  category: SubscriptionCategory;
  status: SubscriptionStatus;

  // UPI specific
  upiApp?: string;           // PhonePe, GPay, Paytm
  bankAccount?: string;      // Last 4 digits
  mandateId?: string;        // UPI mandate reference

  // Dates
  startDate: string;         // ISO date
  nextDebitDate?: string;    // ISO date
  lastDebitDate?: string;    // ISO date
  endDate?: string;          // ISO date (for fixed term)

  // Detection
  source: 'manual' | 'sms' | 'notification';
  smsPattern?: string;       // Original SMS for debugging

  // Reminders
  reminderEnabled: boolean;
  reminderDaysBefore: number;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebitHistory {
  id: string;
  subscriptionId: string;
  amount: number;
  date: string;
  status: 'success' | 'failed' | 'pending';
  smsBody?: string;
}

export interface SubscriptionStats {
  totalActive: number;
  totalMonthlySpend: number;
  totalYearlySpend: number;
  byCategory: Record<SubscriptionCategory, number>;
  upcomingDebits: {
    subscription: Subscription;
    daysUntil: number;
  }[];
}
