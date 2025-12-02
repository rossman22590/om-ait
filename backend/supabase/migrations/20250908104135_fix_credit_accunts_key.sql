ALTER TABLE credit_accounts 
DROP CONSTRAINT IF EXISTS credit_accounts_user_id_fkey;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'credit_accounts_account_id_fkey'
    ) THEN
        ALTER TABLE credit_accounts
            ADD CONSTRAINT credit_accounts_account_id_fkey FOREIGN KEY (account_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;
    END IF;
END $$; 