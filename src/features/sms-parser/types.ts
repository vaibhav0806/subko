export interface SMS {
  id: string;
  address: string;  // Sender
  body: string;
  date: number;     // Timestamp
  read: boolean;
}

export interface ParsedMandate {
  merchantName: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'daily' | 'one_time';
  type: 'created' | 'debited' | 'revoked';
  bankAccount?: string;
  upiApp?: string;
  date: Date;
  originalSms: string;
}

export interface SmsParserResult {
  success: boolean;
  mandates: ParsedMandate[];
  totalSmsScanned: number;
  error?: string;
}
