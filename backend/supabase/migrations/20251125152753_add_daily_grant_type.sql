BEGIN;

ALTER TABLE credit_ledger 
DROP CONSTRAINT IF EXISTS credit_ledger_type_check;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'credit_ledger_type_check'
    ) THEN
        ALTER TABLE credit_ledger
            ADD CONSTRAINT credit_ledger_type_check CHECK (type IN (
    'tier_grant', 'purchase', 'admin_grant', 'promotional',
    'usage', 'refund', 'adjustment', 'expired', 'tier_upgrade', 'daily_grant'
));
    END IF;
END $$;

COMMENT ON CONSTRAINT credit_ledger_type_check ON credit_ledger IS 'Allowed credit ledger types including daily_grant for daily credit refreshes';

COMMIT;
