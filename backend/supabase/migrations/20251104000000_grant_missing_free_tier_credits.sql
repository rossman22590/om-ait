BEGIN;

-- Grant $2.00 credits to free tier users who have 0 balance
-- This fixes users who signed up before the credit grant was implemented

DO $$
DECLARE
    account_record RECORD;
    v_initial_credits DECIMAL := 2.0;
    v_updated_count INTEGER := 0;
BEGIN
    FOR account_record IN 
        SELECT account_id
        FROM public.credit_accounts
        WHERE tier = 'free'
        AND balance = 0
        AND stripe_subscription_id IS NOT NULL
    LOOP
        -- Update the credit account with initial credits
        UPDATE public.credit_accounts
        SET 
            balance = v_initial_credits,
            non_expiring_credits = v_initial_credits,
            last_grant_date = NOW()
        WHERE account_id = account_record.account_id;
        
        -- Create ledger entry for the credit grant
        INSERT INTO public.credit_ledger (
            account_id,
            amount,
            balance_after,
            type,
            description
        ) VALUES (
            account_record.account_id,
            v_initial_credits,
            v_initial_credits,
            'tier_grant',
            'Welcome to Kortix! Free tier initial credits (retroactive grant)'
        );
        
        v_updated_count := v_updated_count + 1;
        RAISE NOTICE 'Granted % credits to account %', v_initial_credits, account_record.account_id;
    END LOOP;
    
    RAISE NOTICE 'Migration complete: granted credits to % free tier accounts', v_updated_count;
END $$;

COMMIT;
