-- Grant execute permissions with full function signature to avoid ambiguity
-- Only grant if function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'atomic_reset_expiring_credits'
        AND n.nspname = 'public'
        AND pg_get_function_identity_arguments(p.oid) = 'p_account_id uuid, p_new_credits numeric, p_description text, p_stripe_event_id text'
    ) THEN
        GRANT EXECUTE ON FUNCTION atomic_reset_expiring_credits(UUID, NUMERIC, TEXT, TEXT) TO service_role;
        RAISE NOTICE 'Granted EXECUTE on atomic_reset_expiring_credits function';
    ELSE
        RAISE NOTICE 'Skipping GRANT for atomic_reset_expiring_credits - function does not exist';
    END IF;
END $$;
