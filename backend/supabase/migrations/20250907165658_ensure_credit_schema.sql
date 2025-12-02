ALTER TABLE credit_accounts 
ADD COLUMN IF NOT EXISTS expiring_credits DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (expiring_credits >= 0),
ADD COLUMN IF NOT EXISTS non_expiring_credits DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (non_expiring_credits >= 0);

ALTER TABLE credit_ledger
ADD COLUMN IF NOT EXISTS is_expiring BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

DO $$
DECLARE
    v_column_name TEXT;
    v_sql TEXT;
BEGIN
    -- Determine which column name to use (user_id or account_id)
    SELECT column_name INTO v_column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'credit_ledger'
    AND column_name IN ('user_id', 'account_id')
    LIMIT 1;

    IF v_column_name = 'user_id' THEN
        v_sql := 'CREATE INDEX IF NOT EXISTS idx_credit_ledger_expiry ON credit_ledger(user_id, is_expiring, expires_at)';
    ELSIF v_column_name = 'account_id' THEN
        v_sql := 'CREATE INDEX IF NOT EXISTS idx_credit_ledger_expiry ON credit_ledger(account_id, is_expiring, expires_at)';
    END IF;

    IF v_sql IS NOT NULL THEN
        EXECUTE v_sql;
    END IF;
END $$;

DO $$
DECLARE
    v_column_name TEXT;
    v_sql TEXT;
BEGIN
    -- Drop existing view
    DROP VIEW IF EXISTS credit_breakdown;

    -- Determine which column name to use (user_id or account_id)
    SELECT column_name INTO v_column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'credit_accounts'
    AND column_name IN ('user_id', 'account_id')
    LIMIT 1;

    IF v_column_name = 'user_id' THEN
        v_sql := 'CREATE OR REPLACE VIEW credit_breakdown AS
        SELECT
            ca.user_id,
            ca.tier,
            ca.expiring_credits,
            ca.non_expiring_credits,
            ca.balance as total_balance,
            ca.expiring_credits + ca.non_expiring_credits as calculated_total,
            ca.updated_at,
            ca.next_credit_grant,
            CASE
                WHEN ca.expiring_credits > 0 AND ca.non_expiring_credits > 0 THEN ''mixed''
                WHEN ca.expiring_credits > 0 THEN ''expiring_only''
                WHEN ca.non_expiring_credits > 0 THEN ''non_expiring_only''
                ELSE ''no_credits''
            END as credit_type
        FROM credit_accounts ca';
    ELSIF v_column_name = 'account_id' THEN
        v_sql := 'CREATE OR REPLACE VIEW credit_breakdown AS
        SELECT
            ca.account_id,
            ca.tier,
            ca.expiring_credits,
            ca.non_expiring_credits,
            ca.balance as total_balance,
            ca.expiring_credits + ca.non_expiring_credits as calculated_total,
            ca.updated_at,
            ca.next_credit_grant,
            CASE
                WHEN ca.expiring_credits > 0 AND ca.non_expiring_credits > 0 THEN ''mixed''
                WHEN ca.expiring_credits > 0 THEN ''expiring_only''
                WHEN ca.non_expiring_credits > 0 THEN ''non_expiring_only''
                ELSE ''no_credits''
            END as credit_type
        FROM credit_accounts ca';
    END IF;

    IF v_sql IS NOT NULL THEN
        EXECUTE v_sql;
    END IF;
END $$;

GRANT SELECT ON credit_breakdown TO authenticated;

COMMENT ON COLUMN credit_accounts.expiring_credits IS 'Credits from subscription plans that expire at billing cycle end';
COMMENT ON COLUMN credit_accounts.non_expiring_credits IS 'Credits from topup purchases that never expire';
COMMENT ON COLUMN credit_ledger.is_expiring IS 'Whether this credit transaction involves expiring credits';
COMMENT ON COLUMN credit_ledger.expires_at IS 'When these credits expire (NULL for non-expiring)'; 