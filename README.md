# Subko

A mobile app to track all your UPI AutoPay subscriptions, view upcoming debits, and get reminders before money is deducted.

## Features

- **Auto-detect subscriptions** - Scans SMS messages to find UPI mandates (Android)
- **NPCI Portal integration** - View official mandates via embedded portal
- **Debit reminders** - Get notified before upcoming payments
- **Spending analytics** - Track monthly/yearly spend by category
- **Manual entry** - Add subscriptions manually with full details
- **Pause/Resume** - Temporarily disable reminders for any subscription
- **Dark mode** - Full dark/light theme support

## Tech Stack

- **React Native** with Expo SDK 54
- **TypeScript** for type safety
- **expo-router** for file-based navigation
- **Zustand** for state management
- **expo-sqlite** for local database
- **expo-notifications** for push reminders
- **react-hook-form + zod** for form validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for development) or EAS CLI (for builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/subko.git
cd subko

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

Press `a` in the terminal to open on Android emulator, or scan the QR code with Expo Go.

## Project Structure

```
├── app/                    # Screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Dashboard
│   │   ├── subscriptions.tsx
│   │   ├── analytics.tsx
│   │   └── settings.tsx
│   ├── subscription/      # Subscription management
│   │   ├── add.tsx
│   │   ├── [id].tsx
│   │   └── edit/[id].tsx
│   └── onboarding/        # First-launch flow
├── src/
│   ├── stores/            # Zustand state management
│   ├── services/          # Database, notifications, background tasks
│   ├── features/          # SMS parser
│   └── types/             # TypeScript interfaces
├── constants/             # Theme, colors, design tokens
└── assets/               # Images, fonts
```

## How It Works

### SMS Detection (Android only)

The app scans your SMS inbox for UPI-related messages containing:
- Mandate creation notifications
- Debit/charge confirmations
- Mandate cancellation alerts

It extracts merchant name, amount, frequency, and UPI app from the message patterns.

### Notifications

Reminders are scheduled based on:
- `nextDebitDate` - When the payment is due
- `reminderDaysBefore` - How many days before to notify (default: 1)

Notifications work only in development/production builds, not in Expo Go.

### Data Storage

All data is stored locally on your device:
- **SQLite** - Subscriptions and debit history
- **AsyncStorage** - Onboarding state and preferences

No data is uploaded to any server.

## Building for Production

### Setup EAS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure
```

### Build APK (Android)

```bash
# Preview build (APK for testing)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

### Build iOS

```bash
eas build --platform ios --profile production
```

## Permissions

### Android
- `READ_SMS` - To scan for UPI mandate messages
- `RECEIVE_SMS` - For background mandate detection
- `POST_NOTIFICATIONS` - For debit reminders

### iOS
- SMS access not available (use manual entry or NPCI portal)
- Push notification permission for reminders

## Limitations

- **Expo Go**: Push notifications and SMS reading don't work. Use a development build for full functionality.
- **iOS**: Cannot read SMS messages due to Apple restrictions. Use manual entry or NPCI portal.

## License

MIT

## Privacy

Subko stores all data locally on your device. SMS messages are only scanned for UPI keywords and are never uploaded anywhere. See [Privacy Policy](#) for details.
