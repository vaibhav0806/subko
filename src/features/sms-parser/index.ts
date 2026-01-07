import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { MANDATE_PATTERNS, MANDATE_KEYWORDS, UPI_SENDERS, MERCHANT_MAPPINGS } from './patterns';
import type { SMS, ParsedMandate, SmsParserResult } from './types';

// Check if we're running in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo' || !NativeModules.SmsReader;

/**
 * Check if running in Expo Go (for UI to show appropriate messages)
 */
export function isRunningInExpoGo(): boolean {
  return isExpoGo;
}

/**
 * Request SMS read permission on Android
 */
export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission Required',
        message:
          'UPI Subs needs access to read your SMS messages to automatically detect UPI AutoPay subscriptions. Your data stays on your device.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Grant Access',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('SMS permission error:', err);
    return false;
  }
}

/**
 * Check if SMS permission is granted
 */
export async function checkSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const result = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    return result;
  } catch {
    return false;
  }
}

/**
 * Parse SMS body to extract mandate information
 */
export function parseSmsBody(sms: SMS): ParsedMandate | null {
  const body = sms.body;

  // Check if SMS contains mandate-related keywords
  const hasKeyword = MANDATE_KEYWORDS.some((keyword) =>
    body.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasKeyword) {
    return null;
  }

  // Try mandate creation patterns
  for (const pattern of MANDATE_PATTERNS.created) {
    const match = body.match(pattern);
    if (match) {
      const [, amountOrMerchant, merchantOrAmount] = match;
      const amount = parseAmount(amountOrMerchant) || parseAmount(merchantOrAmount);
      const merchant = cleanMerchantName(
        isNaN(Number(amountOrMerchant.replace(/,/g, '')))
          ? amountOrMerchant
          : merchantOrAmount
      );

      if (amount && merchant) {
        return {
          merchantName: merchant,
          amount,
          frequency: detectFrequency(body),
          type: 'created',
          bankAccount: extractBankAccount(body),
          upiApp: detectUpiApp(sms.address, body),
          date: new Date(sms.date),
          originalSms: body,
        };
      }
    }
  }

  // Try debit patterns
  for (const pattern of MANDATE_PATTERNS.debited) {
    const match = body.match(pattern);
    if (match) {
      const [, amount, bankAcc, merchant] = match;
      const parsedAmount = parseAmount(amount);
      const merchantName = cleanMerchantName(merchant || '');

      if (parsedAmount && merchantName) {
        return {
          merchantName,
          amount: parsedAmount,
          frequency: 'monthly', // Default, hard to detect from debit SMS
          type: 'debited',
          bankAccount: bankAcc,
          upiApp: detectUpiApp(sms.address, body),
          date: new Date(sms.date),
          originalSms: body,
        };
      }
    }
  }

  // Try revocation patterns
  for (const pattern of MANDATE_PATTERNS.revoked) {
    const match = body.match(pattern);
    if (match) {
      const [, merchant] = match;
      return {
        merchantName: cleanMerchantName(merchant),
        amount: 0,
        frequency: 'monthly',
        type: 'revoked',
        date: new Date(sms.date),
        originalSms: body,
      };
    }
  }

  return null;
}

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  const cleaned = amountStr.replace(/[,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Clean and normalize merchant name
 */
function cleanMerchantName(name: string): string {
  const cleaned = name.trim().toUpperCase().replace(/\s+/g, ' ');
  return MERCHANT_MAPPINGS[cleaned] || name.trim();
}

/**
 * Detect payment frequency from SMS body
 */
function detectFrequency(body: string): ParsedMandate['frequency'] {
  const lower = body.toLowerCase();
  if (lower.includes('/year') || lower.includes('yearly') || lower.includes('annual')) {
    return 'yearly';
  }
  if (lower.includes('/week') || lower.includes('weekly')) {
    return 'weekly';
  }
  if (lower.includes('/quarter') || lower.includes('quarterly')) {
    return 'quarterly';
  }
  if (lower.includes('/day') || lower.includes('daily')) {
    return 'daily';
  }
  return 'monthly'; // Default
}

/**
 * Extract bank account last digits
 */
function extractBankAccount(body: string): string | undefined {
  const match = body.match(/(?:a\/c|account|ac)\s*(?:no\.?)?\s*(?:xx|x+)?(\d{4})/i);
  return match ? match[1] : undefined;
}

/**
 * Detect UPI app from sender or body
 */
function detectUpiApp(sender: string, body: string): string | undefined {
  const combined = `${sender} ${body}`.toLowerCase();

  if (combined.includes('phonepe') || combined.includes('phonpe')) return 'PhonePe';
  if (combined.includes('gpay') || combined.includes('google pay')) return 'Google Pay';
  if (combined.includes('paytm')) return 'Paytm';
  if (combined.includes('amazon pay')) return 'Amazon Pay';
  if (combined.includes('bhim')) return 'BHIM';
  if (combined.includes('cred')) return 'CRED';

  return undefined;
}

/**
 * Read SMS messages from device (Android only)
 * Returns mock data in Expo Go, real data with native module
 */
export async function readSmsMessages(maxCount: number = 500): Promise<SMS[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  // In Expo Go or without native module, return mock data for testing
  if (isExpoGo) {
    console.log('Running in Expo Go - returning mock SMS data');
    return getMockSmsData();
  }

  // With native module (EAS Build), read actual SMS
  try {
    const messages = await NativeModules.SmsReader.readSms({
      maxCount,
      // Only read SMS from known bank/UPI senders to improve performance
      senderFilter: UPI_SENDERS,
    });
    return messages;
  } catch (error) {
    console.error('Failed to read SMS:', error);
    return [];
  }
}

/**
 * Scan SMS messages and extract UPI mandates
 */
export async function scanForMandates(): Promise<SmsParserResult> {
  try {
    const messages = await readSmsMessages();
    const mandates: ParsedMandate[] = [];

    for (const sms of messages) {
      const parsed = parseSmsBody(sms);
      if (parsed) {
        mandates.push(parsed);
      }
    }

    // Deduplicate by merchant name (keep most recent)
    const uniqueMandates = deduplicateMandates(mandates);

    return {
      success: true,
      mandates: uniqueMandates,
      totalSmsScanned: messages.length,
    };
  } catch (error) {
    return {
      success: false,
      mandates: [],
      totalSmsScanned: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Deduplicate mandates by merchant, keeping most recent
 */
function deduplicateMandates(mandates: ParsedMandate[]): ParsedMandate[] {
  const byMerchant = new Map<string, ParsedMandate>();

  // Sort by date descending
  const sorted = [...mandates].sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const mandate of sorted) {
    const key = mandate.merchantName.toLowerCase();

    // Skip if revoked
    if (mandate.type === 'revoked') {
      byMerchant.delete(key);
      continue;
    }

    // Keep first (most recent) occurrence
    if (!byMerchant.has(key)) {
      byMerchant.set(key, mandate);
    }
  }

  return Array.from(byMerchant.values());
}

/**
 * Mock SMS data for testing in Expo Go
 */
function getMockSmsData(): SMS[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return [
    {
      id: '1',
      address: 'HDFCBK',
      body: 'UPI Mandate for Rs.199.00 created for NETFLIX on A/C XX4521. Ref: 412345678901. Valid till 31-Dec-25.',
      date: now - 30 * day,
      read: true,
    },
    {
      id: '2',
      address: 'ICICIB',
      body: 'AutoPay registered for Rs.119/month to SPOTIFY via PhonePe. Mandate ID: MAND123456. First debit on 15-Jan.',
      date: now - 45 * day,
      read: true,
    },
    {
      id: '3',
      address: 'SBIINB',
      body: 'Rs.499.00 debited from A/C XX7890 for AMAZON PRIME UPI AutoPay. Ref: 512345678902.',
      date: now - 5 * day,
      read: true,
    },
    {
      id: '4',
      address: 'AXISBK',
      body: 'UPI Mandate for Rs.299.00 created for DISNEY HOTSTAR on A/C XX1234. Next debit: 20-Jan-25.',
      date: now - 60 * day,
      read: true,
    },
    {
      id: '5',
      address: 'KOTAKB',
      body: 'Recurring payment of Rs.79 set up for YOUTUBE PREMIUM via Google Pay. Monthly auto-debit enabled.',
      date: now - 90 * day,
      read: true,
    },
    {
      id: '6',
      address: 'HDFCBK',
      body: 'Auto debit of Rs.199 for NETFLIX processed successfully. Balance: Rs.45,231.00',
      date: now - 2 * day,
      read: true,
    },
    {
      id: '7',
      address: 'PHONPE',
      body: 'UPI AutoPay of Rs.299 successful for CULTFIT membership. Next debit: 07-Feb-25.',
      date: now - 7 * day,
      read: true,
    },
  ];
}

export type { SMS, ParsedMandate, SmsParserResult };
