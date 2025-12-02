-- Grant execute permissions with full function signature to avoid ambiguity
-- Only grant if function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'atomic_add_credits'
        AND n.nspname = 'public'
        AND pg_get_function_identity_arguments(p.oid) = 'p_account_id uuid, p_amount numeric, p_is_expiring boolean, p_description text, p_expires_at timestamp with time zone, p_type text, p_stripe_event_id text, p_idempotency_key text'
    ) THEN
        GRANT EXECUTE ON FUNCTION atomic_add_credits(
            UUID, NUMERIC, BOOLEAN, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT
        ) TO service_role;
        RAISE NOTICE 'Granted EXECUTE on atomic_add_credits function';
    ELSE
        RAISE NOTICE 'Skipping GRANT for atomic_add_credits - function does not exist';
    END IF;
END $$;
