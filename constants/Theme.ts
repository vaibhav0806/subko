import type { SubscriptionCategory } from '@/src/types';

// Subko Brand Colors
export const SubkoColors = {
  // Primary brand color - Emerald Green
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Main brand color
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Accent color - Indigo (for CTAs, highlights)
  accent: {
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
  },

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutral palette
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
};

// Theme configuration for light and dark modes
export const Theme = {
  light: {
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    card: '#F1F5F9',
    cardHover: '#E2E8F0',

    // Text
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',

    // Borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // Brand
    tint: SubkoColors.primary[500],
    tintLight: SubkoColors.primary[50],

    // Status bar
    statusBar: 'dark' as const,
  },
  dark: {
    // Backgrounds
    background: '#0F0F0F',
    backgroundSecondary: '#171717',
    card: '#1A1A1A',
    cardHover: '#262626',

    // Text
    text: '#FAFAFA',
    textSecondary: '#A3A3A3',
    textMuted: '#525252',

    // Borders
    border: '#2D2D2D',
    borderLight: '#1F1F1F',

    // Brand
    tint: SubkoColors.primary[500],
    tintLight: SubkoColors.primary[900],

    // Status bar
    statusBar: 'light' as const,
  },
};

// Category colors - vibrant and distinct
export const CategoryColors: Record<SubscriptionCategory, string> = {
  ott: '#F43F5E',       // Rose - streaming
  music: '#8B5CF6',     // Violet - music
  utilities: '#F97316', // Orange - utilities
  insurance: '#10B981', // Emerald - insurance
  emi: '#EF4444',       // Red - EMI/loans
  investment: '#3B82F6', // Blue - investments
  telecom: '#06B6D4',   // Cyan - telecom
  education: '#6366F1', // Indigo - education
  fitness: '#84CC16',   // Lime - fitness
  cloud: '#64748B',     // Slate - cloud services
  gaming: '#EC4899',    // Pink - gaming
  news: '#78716C',      // Stone - news
  other: '#94A3B8',     // Slate light - other
};

// Category icons (lucide icon names)
export const CategoryIcons: Record<SubscriptionCategory, string> = {
  ott: 'Play',
  music: 'Music',
  utilities: 'Zap',
  insurance: 'Shield',
  emi: 'CreditCard',
  investment: 'TrendingUp',
  telecom: 'Phone',
  education: 'GraduationCap',
  fitness: 'Dumbbell',
  cloud: 'Cloud',
  gaming: 'Gamepad2',
  news: 'Newspaper',
  other: 'MoreHorizontal',
};

// Status colors
export const StatusColors = {
  active: SubkoColors.primary[500],
  paused: SubkoColors.warning,
  expired: SubkoColors.neutral[500],
  cancelled: SubkoColors.error,
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border radius scale
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// Typography scale
export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Shadow presets
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Gradient presets for LinearGradient
export const Gradients = {
  primary: ['#10B981', '#059669'] as const,
  primaryLight: ['#34D399', '#10B981'] as const,
  accent: ['#6366F1', '#4F46E5'] as const,
  dark: ['#1A1A1A', '#0F0F0F'] as const,
  success: ['#10B981', '#047857'] as const,
  warning: ['#F59E0B', '#D97706'] as const,
  error: ['#EF4444', '#DC2626'] as const,
};

// Animation durations
export const Animations = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// Helper to get theme colors based on color scheme
export function getTheme(colorScheme: 'light' | 'dark' | null | undefined) {
  return Theme[colorScheme ?? 'light'];
}

// Export default theme accessor
export default {
  ...Theme,
  colors: SubkoColors,
  category: CategoryColors,
  categoryIcons: CategoryIcons,
  status: StatusColors,
  spacing: Spacing,
  radius: BorderRadius,
  typography: Typography,
  shadows: Shadows,
  gradients: Gradients,
  animations: Animations,
  getTheme,
};
