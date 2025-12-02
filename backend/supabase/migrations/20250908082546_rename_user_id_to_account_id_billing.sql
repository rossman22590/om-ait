DO $$
BEGIN
    -- Rename user_id to account_id in credit_accounts if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'credit_accounts'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE credit_accounts RENAME COLUMN user_id TO account_id;
    END IF;

    -- Rename user_id to account_id in credit_ledger if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'credit_ledger'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE credit_ledger RENAME COLUMN user_id TO account_id;
    END IF;

    -- Rename user_id to account_id in credit_purchases if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'credit_purchases'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE credit_purchases RENAME COLUMN user_id TO account_id;
    END IF;

    -- Rename user_id to account_id in credit_balance if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'credit_balance'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE credit_balance RENAME COLUMN user_id TO account_id;
    END IF;

    -- Rename user_id to account_id in credit_usage if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'credit_usage'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE credit_usage RENAME COLUMN user_id TO account_id;
    END IF;
END $$;

DROP INDEX IF EXISTS idx_credit_ledger_user_id;
CREATE INDEX IF NOT EXISTS idx_credit_ledger_account_id ON credit_ledger(account_id, created_at DESC);

DROP INDEX IF EXISTS idx_credit_purchases_user_id;
CREATE INDEX IF NOT EXISTS idx_credit_purchases_account_id ON credit_purchases(account_id);

DROP INDEX IF EXISTS idx_credit_accounts_user_id;
CREATE INDEX IF NOT EXISTS idx_credit_accounts_account_id ON credit_accounts(account_id);

DROP INDEX IF EXISTS idx_credit_balance_user_id;
CREATE INDEX IF NOT EXISTS idx_credit_balance_account_id ON credit_balance(account_id);

DROP INDEX IF EXISTS idx_credit_usage_user_id;
CREATE INDEX IF NOT EXISTS idx_credit_usage_account_id ON credit_usage(account_id);
