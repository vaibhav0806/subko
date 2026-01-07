# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Subko is a React Native/Expo app for tracking UPI AutoPay subscriptions in India. It detects mandates via SMS parsing, sends debit reminders, and provides spending analytics.

## Development Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npx tsc --noEmit       # Type check without emitting
eas build --platform android --profile preview  # Build APK for testing
```

## Architecture

### Tech Stack
- **Framework**: Expo 54 + React Native 0.81 + TypeScript
- **Navigation**: expo-router (file-based routing)
- **State**: Zustand stores with SQLite persistence
- **Forms**: react-hook-form + zod validation
- **UI**: lucide-react-native icons, expo-linear-gradient, react-native-reanimated

### Key Directories
- `app/` - Expo Router pages (file-based routing)
- `src/stores/` - Zustand stores (subscriptionStore, onboardingStore)
- `src/services/database/` - SQLite CRUD operations
- `src/services/notifications/` - Push notification scheduling
- `src/features/sms-parser/` - SMS parsing and mandate detection
- `constants/Theme.ts` - Design system (colors, spacing, typography)

### Data Flow
1. **Stores initialize** in `app/_layout.tsx` on mount
2. **subscriptionStore** loads from SQLite, provides computed stats
3. **onboardingStore** persists to AsyncStorage, gates main app access
4. **Notifications** reschedule when subscriptions change

### Database Schema (SQLite)
- `subscriptions` - Core subscription data with status, amounts, dates
- `debit_history` - Transaction log per subscription
- `sms_patterns` - Regex patterns for SMS detection (seeded on init)

## Important Patterns

### Expo Go Limitations
Push notifications and real SMS reading don't work in Expo Go. The codebase checks `Constants.appOwnership === 'expo'` and provides graceful fallbacks:
- Notifications silently skip in Expo Go
- SMS parser returns mock data for testing

### Subscription Types
```typescript
type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'cancelled';
type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type SubscriptionCategory = 'ott' | 'music' | 'utilities' | 'insurance' | 'emi' |
                            'investment' | 'telecom' | 'education' | 'fitness' |
                            'cloud' | 'gaming' | 'news' | 'other';
```

### Store Actions
- `addSubscription()` - Generates UUID, persists to SQLite, updates state
- `editSubscription()` - Updates existing, triggers notification reschedule
- `getStats()` - Computed: totalActive, monthlySpend, byCategory, upcomingDebits

## Design System

Brand color is Emerald Green (#10B981). Use constants from `Theme.ts`:
- `SubkoColors.primary[500]` - Main brand color
- `CategoryColors[category]` - Per-category colors
- `StatusColors[status]` - Status indicator colors
- `Spacing`, `BorderRadius`, `Gradients` - Layout tokens
