import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SEED_SMS_PATTERNS_SQL } from './schema';
import type { Subscription, DebitHistory } from '../../types';

const DB_NAME = 'upisubs.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  if (db) return;

  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.execAsync(CREATE_TABLES_SQL);

  // Seed SMS patterns
  await db.execAsync(SEED_SMS_PATTERNS_SQL);
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

// Subscription CRUD operations

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>('SELECT * FROM subscriptions ORDER BY next_debit_date ASC');
  return rows.map(mapRowToSubscription);
}

export async function getActiveSubscriptions(): Promise<Subscription[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM subscriptions WHERE status = ? ORDER BY next_debit_date ASC',
    ['active']
  );
  return rows.map(mapRowToSubscription);
}

export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM subscriptions WHERE id = ?',
    [id]
  );
  return row ? mapRowToSubscription(row) : null;
}

export async function insertSubscription(subscription: Subscription): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO subscriptions (
      id, merchant_name, merchant_logo, amount, currency, frequency, category, status,
      upi_app, bank_account, mandate_id,
      start_date, next_debit_date, last_debit_date, end_date,
      source, sms_pattern,
      reminder_enabled, reminder_days_before,
      notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      subscription.id,
      subscription.merchantName,
      subscription.merchantLogo ?? null,
      subscription.amount,
      subscription.currency,
      subscription.frequency,
      subscription.category,
      subscription.status,
      subscription.upiApp ?? null,
      subscription.bankAccount ?? null,
      subscription.mandateId ?? null,
      subscription.startDate,
      subscription.nextDebitDate ?? null,
      subscription.lastDebitDate ?? null,
      subscription.endDate ?? null,
      subscription.source,
      subscription.smsPattern ?? null,
      subscription.reminderEnabled ? 1 : 0,
      subscription.reminderDaysBefore,
      subscription.notes ?? null,
      subscription.createdAt,
      subscription.updatedAt,
    ]
  );
}

export async function updateSubscription(subscription: Subscription): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE subscriptions SET
      merchant_name = ?, merchant_logo = ?, amount = ?, currency = ?,
      frequency = ?, category = ?, status = ?,
      upi_app = ?, bank_account = ?, mandate_id = ?,
      start_date = ?, next_debit_date = ?, last_debit_date = ?, end_date = ?,
      source = ?, sms_pattern = ?,
      reminder_enabled = ?, reminder_days_before = ?,
      notes = ?, updated_at = ?
    WHERE id = ?`,
    [
      subscription.merchantName,
      subscription.merchantLogo ?? null,
      subscription.amount,
      subscription.currency,
      subscription.frequency,
      subscription.category,
      subscription.status,
      subscription.upiApp ?? null,
      subscription.bankAccount ?? null,
      subscription.mandateId ?? null,
      subscription.startDate,
      subscription.nextDebitDate ?? null,
      subscription.lastDebitDate ?? null,
      subscription.endDate ?? null,
      subscription.source,
      subscription.smsPattern ?? null,
      subscription.reminderEnabled ? 1 : 0,
      subscription.reminderDaysBefore,
      subscription.notes ?? null,
      new Date().toISOString(),
      subscription.id,
    ]
  );
}

export async function deleteSubscription(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM subscriptions WHERE id = ?', [id]);
}

// Debit history operations

export async function getDebitHistory(subscriptionId: string): Promise<DebitHistory[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM debit_history WHERE subscription_id = ? ORDER BY date DESC',
    [subscriptionId]
  );
  return rows.map(mapRowToDebitHistory);
}

export async function insertDebitHistory(debit: DebitHistory): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO debit_history (id, subscription_id, amount, date, status, sms_body, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      debit.id,
      debit.subscriptionId,
      debit.amount,
      debit.date,
      debit.status,
      debit.smsBody ?? null,
      new Date().toISOString(),
    ]
  );
}

// Helper functions

function mapRowToSubscription(row: any): Subscription {
  return {
    id: row.id,
    merchantName: row.merchant_name,
    merchantLogo: row.merchant_logo,
    amount: row.amount,
    currency: row.currency,
    frequency: row.frequency,
    category: row.category,
    status: row.status,
    upiApp: row.upi_app,
    bankAccount: row.bank_account,
    mandateId: row.mandate_id,
    startDate: row.start_date,
    nextDebitDate: row.next_debit_date,
    lastDebitDate: row.last_debit_date,
    endDate: row.end_date,
    source: row.source,
    smsPattern: row.sms_pattern,
    reminderEnabled: row.reminder_enabled === 1,
    reminderDaysBefore: row.reminder_days_before,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToDebitHistory(row: any): DebitHistory {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    amount: row.amount,
    date: row.date,
    status: row.status,
    smsBody: row.sms_body,
  };
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  // Delete in order to respect foreign key constraints
  await database.execAsync('DELETE FROM debit_history;');
  await database.execAsync('DELETE FROM subscriptions;');
  // Keep sms_patterns table as it's seed data
}
