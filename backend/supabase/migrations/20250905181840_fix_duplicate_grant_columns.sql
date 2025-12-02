BEGIN;

DO $$
BEGIN
    -- Only update if last_grant_at column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'credit_accounts'
        AND column_name = 'last_grant_at'
    ) THEN
        UPDATE credit_accounts
        SET last_grant_date = last_grant_at
        WHERE last_grant_date IS NULL AND last_grant_at IS NOT NULL;
    END IF;
END $$;

ALTER TABLE credit_accounts
DROP COLUMN IF EXISTS last_grant_at;

ALTER TABLE credit_accounts 
ADD COLUMN IF NOT EXISTS last_grant_date TIMESTAMPTZ;

DROP INDEX IF EXISTS idx_credit_accounts_last_grant;
CREATE INDEX IF NOT EXISTS idx_credit_accounts_last_grant ON credit_accounts(last_grant_date);

CREATE OR REPLACE FUNCTION grant_tier_credits(
    p_user_id UUID,
    p_tier TEXT,
    p_amount DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
    v_balance DECIMAL;
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
        SELECT balance INTO v_balance
        FROM credit_accounts
        WHERE user_id = p_user_id
        FOR UPDATE;

        IF NOT FOUND THEN
            INSERT INTO credit_accounts (user_id, balance, tier, last_grant_date)
            VALUES (p_user_id, p_amount, p_tier, NOW());
        ELSE
            UPDATE credit_accounts
            SET
                balance = balance + p_amount,
                tier = p_tier,
                last_grant_date = NOW(),
                updated_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
    ELSIF v_column_name = 'account_id' THEN
        SELECT balance INTO v_balance
        FROM credit_accounts
        WHERE account_id = p_user_id
        FOR UPDATE;

        IF NOT FOUND THEN
            INSERT INTO credit_accounts (account_id, balance, tier, last_grant_date)
            VALUES (p_user_id, p_amount, p_tier, NOW());
        ELSE
            UPDATE credit_accounts
            SET
                balance = balance + p_amount,
                tier = p_tier,
                last_grant_date = NOW(),
                updated_at = NOW()
            WHERE account_id = p_user_id;
        END IF;
    END IF;

    -- Check if credit_grants table exists before inserting
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'credit_grants'
    ) THEN
        IF v_column_name = 'user_id' THEN
            INSERT INTO credit_grants (user_id, amount, tier, granted_at)
            VALUES (p_user_id, p_amount, p_tier, NOW());
        ELSIF v_column_name = 'account_id' THEN
            INSERT INTO credit_grants (account_id, amount, tier, granted_at)
            VALUES (p_user_id, p_amount, p_tier, NOW());
        END IF;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN credit_accounts.last_grant_date IS 'Timestamp of the last credit grant to this account';

COMMIT; 