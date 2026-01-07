import { SubkoColors, Theme } from './Theme';

// Brand tint color
const tintColor = SubkoColors.primary[500]; // #10B981 Emerald

export default {
  light: {
    text: Theme.light.text,
    textSecondary: Theme.light.textSecondary,
    textMuted: Theme.light.textMuted,
    background: Theme.light.background,
    backgroundSecondary: Theme.light.backgroundSecondary,
    card: Theme.light.card,
    cardHover: Theme.light.cardHover,
    border: Theme.light.border,
    borderLight: Theme.light.borderLight,
    tint: tintColor,
    tintLight: Theme.light.tintLight,
    tabIconDefault: SubkoColors.neutral[400],
    tabIconSelected: tintColor,
  },
  dark: {
    text: Theme.dark.text,
    textSecondary: Theme.dark.textSecondary,
    textMuted: Theme.dark.textMuted,
    background: Theme.dark.background,
    backgroundSecondary: Theme.dark.backgroundSecondary,
    card: Theme.dark.card,
    cardHover: Theme.dark.cardHover,
    border: Theme.dark.border,
    borderLight: Theme.dark.borderLight,
    tint: tintColor,
    tintLight: Theme.dark.tintLight,
    tabIconDefault: SubkoColors.neutral[600],
    tabIconSelected: tintColor,
  },
};
