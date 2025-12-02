BEGIN;

ALTER TABLE credit_ledger 
DROP CONSTRAINT IF EXISTS credit_ledger_type_check;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'credit_ledger_type_check'
    ) THEN
        ALTER TABLE credit_ledger
            ADD CONSTRAINT credit_ledger_type_check CHECK (type IN ('admin_grant', 'tier_grant', 'tier_upgrade', 'purchase', 'usage', 'refund', 'adjustment', 'expiration'));
    END IF;
END $$;

COMMIT; 