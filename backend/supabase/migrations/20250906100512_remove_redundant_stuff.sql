-- Migration: Remove redundant billing data sources
-- ================================================
-- This migration removes unused tables to simplify the billing architecture:
-- 1. credit_grants - Not used in production
-- 2. billing_subscriptions - Replaced by credit_accounts.stripe_subscription_id
--
-- IMPORTANT: Run this migration AFTER verifying all users have credit_accounts entries

BEGIN;

DROP TABLE IF EXISTS credit_grants CASCADE;

DO $$
DECLARE
    v_column_name TEXT;
BEGIN
    -- Determine which column name to use (user_id or account_id)
    SELECT column_name INTO v_column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'credit_accounts'
    AND column_name IN ('user_id', 'account_id')
    LIMIT 1;

    IF v_column_name = 'user_id' THEN
        CREATE INDEX IF NOT EXISTS idx_credit_accounts_user_id ON credit_accounts(user_id);
    ELSIF v_column_name = 'account_id' THEN
        CREATE INDEX IF NOT EXISTS idx_credit_accounts_account_id ON credit_accounts(account_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_credit_accounts_tier ON credit_accounts(tier);
CREATE INDEX IF NOT EXISTS idx_credit_accounts_stripe_subscription_id ON credit_accounts(stripe_subscription_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_accounts' 
        AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE credit_accounts 
        ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_accounts' 
        AND column_name = 'billing_cycle_anchor'
    ) THEN
        ALTER TABLE credit_accounts 
        ADD COLUMN billing_cycle_anchor TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_accounts' 
        AND column_name = 'next_credit_grant'
    ) THEN
        ALTER TABLE credit_accounts 
        ADD COLUMN next_credit_grant TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_accounts' 
        AND column_name = 'last_grant_date'
    ) THEN
        ALTER TABLE credit_accounts 
        ADD COLUMN last_grant_date TIMESTAMPTZ;
    END IF;
END $$;

COMMIT; 