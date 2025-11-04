BEGIN;

-- Update the trigger function to properly grant $2.00 credits on signup
CREATE OR REPLACE FUNCTION initialize_free_tier_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_initial_credits DECIMAL := 2.00;
    v_rowcount INT;
BEGIN
    IF NEW.personal_account = TRUE THEN
        -- Create credit account with $2.00 initial balance
        INSERT INTO public.credit_accounts (
            account_id,
            balance,
            non_expiring_credits,
            expiring_credits,
            tier,
            trial_status,
            last_grant_date
        ) VALUES (
            NEW.id,
            v_initial_credits,
            v_initial_credits,
            0.00,
            'none',  -- Start as 'none', will be updated to 'free' when Stripe subscription is created
            'none',
            NOW()
        )
        ON CONFLICT (account_id) DO UPDATE SET
            balance = v_initial_credits,
            non_expiring_credits = v_initial_credits,
            last_grant_date = NOW();

        GET DIAGNOSTICS v_rowcount = ROW_COUNT;
        
        IF v_rowcount > 0 THEN
            -- Create ledger entry for the initial credit grant
            INSERT INTO public.credit_ledger (
                account_id,
                amount,
                balance_after,
                type,
                description
            ) VALUES (
                NEW.id,
                v_initial_credits,
                v_initial_credits,
                'tier_grant',
                'Welcome to Machine! Free tier initial credits'
            );
            
            RAISE LOG 'Created credit account for new user % with $% initial credits', NEW.id, v_initial_credits;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in initialize_free_tier_credits for account %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger exists and is active
DROP TRIGGER IF EXISTS auto_create_free_tier_on_account ON basejump.accounts;

CREATE TRIGGER auto_create_free_tier_on_account
    AFTER INSERT ON basejump.accounts
    FOR EACH ROW
    EXECUTE FUNCTION initialize_free_tier_credits();

COMMIT;
