-- Grant execute permissions with full function signature to avoid ambiguity
-- Latest signature includes daily_credits support (10 parameters)
-- Only grant if function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'atomic_grant_renewal_credits'
        AND n.nspname = 'public'
        AND pg_get_function_identity_arguments(p.oid) = 'p_account_id uuid, p_period_start bigint, p_period_end bigint, p_credits numeric, p_processed_by text, p_invoice_id text, p_stripe_event_id text, p_provider text, p_product_id text, p_daily_credits text'
    ) THEN
        GRANT EXECUTE ON FUNCTION atomic_grant_renewal_credits(
            UUID, BIGINT, BIGINT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
        ) TO service_role;
        RAISE NOTICE 'Granted EXECUTE on atomic_grant_renewal_credits function';
    ELSE
        RAISE NOTICE 'Skipping GRANT for atomic_grant_renewal_credits - function does not exist or has different signature';
    END IF;
END $$;

