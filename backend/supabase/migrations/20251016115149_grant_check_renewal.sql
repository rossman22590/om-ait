-- Grant execute permissions with full function signature to avoid ambiguity
-- Only grant if function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'check_renewal_already_processed'
        AND n.nspname = 'public'
        AND pg_get_function_identity_arguments(p.oid) = 'p_account_id uuid, p_period_start bigint'
    ) THEN
        GRANT EXECUTE ON FUNCTION check_renewal_already_processed(UUID, BIGINT) TO service_role;
        RAISE NOTICE 'Granted EXECUTE on check_renewal_already_processed function';
    ELSE
        RAISE NOTICE 'Skipping GRANT for check_renewal_already_processed - function does not exist';
    END IF;
END $$;

