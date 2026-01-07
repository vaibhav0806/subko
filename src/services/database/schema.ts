export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY NOT NULL,
    merchant_name TEXT NOT NULL,
    merchant_logo TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    frequency TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',

    upi_app TEXT,
    bank_account TEXT,
    mandate_id TEXT,

    start_date TEXT NOT NULL,
    next_debit_date TEXT,
    last_debit_date TEXT,
    end_date TEXT,

    source TEXT NOT NULL DEFAULT 'manual',
    sms_pattern TEXT,

    reminder_enabled INTEGER DEFAULT 1,
    reminder_days_before INTEGER DEFAULT 1,

    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS debit_history (
    id TEXT PRIMARY KEY NOT NULL,
    subscription_id TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    sms_body TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sms_patterns (
    id TEXT PRIMARY KEY NOT NULL,
    pattern TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    merchant_name TEXT,
    enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_next_debit ON subscriptions(next_debit_date);
  CREATE INDEX IF NOT EXISTS idx_debit_history_subscription ON debit_history(subscription_id);
`;

export const SEED_SMS_PATTERNS_SQL = `
  INSERT OR IGNORE INTO sms_patterns (id, pattern, pattern_type, merchant_name, enabled, created_at) VALUES
    ('pat_1', '(?i)mandate.*created.*Rs\\.?\\s*([\\d,]+)', 'mandate_created', NULL, 1, datetime('now')),
    ('pat_2', '(?i)autopay.*registered.*Rs\\.?\\s*([\\d,]+)', 'mandate_created', NULL, 1, datetime('now')),
    ('pat_3', '(?i)Rs\\.?\\s*([\\d,]+).*debited.*autopay', 'debit', NULL, 1, datetime('now')),
    ('pat_4', '(?i)autopay.*Rs\\.?\\s*([\\d,]+).*successful', 'debit', NULL, 1, datetime('now')),
    ('pat_5', '(?i)mandate.*revoked', 'mandate_revoked', NULL, 1, datetime('now')),
    ('pat_6', '(?i)autopay.*cancelled', 'mandate_revoked', NULL, 1, datetime('now'));
`;
