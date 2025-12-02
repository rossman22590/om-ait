BEGIN;

ALTER TABLE credit_accounts 
DROP CONSTRAINT IF EXISTS credit_accounts_trial_status_check;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'credit_accounts_trial_status_check'
    ) THEN
        ALTER TABLE credit_accounts
            ADD CONSTRAINT credit_accounts_trial_status_check CHECK (trial_status IN ('none', 'active', 'expired', 'converted', 'cancelled'));
    END IF;
END $$;

COMMIT; 
