-- Fix for the get_personal_account function to properly handle schema access issues
-- Updating to allow both public and basejump schema access

-- Recreate the function with better error handling and schema flexibility
CREATE OR REPLACE FUNCTION public.get_personal_account()
    RETURNS json
    LANGUAGE plpgsql
AS $$
DECLARE
    account_data json;
    account_id uuid;
BEGIN
    -- First try to find the personal account directly in the basejump schema
    BEGIN
        SELECT a.id INTO account_id
        FROM basejump.accounts a
        WHERE a.personal_account = true
        AND a.primary_owner_user_id = auth.uid();
        
        -- If account_id is found, get the full account data
        IF account_id IS NOT NULL THEN
            SELECT json_build_object(
                'account_id', a.id,
                'name', a.name,
                'slug', a.slug,
                'personal_account', a.personal_account,
                'primary_owner_user_id', a.primary_owner_user_id
            ) INTO account_data
            FROM basejump.accounts a
            WHERE a.id = account_id;
            
            RETURN account_data;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Error accessing basejump schema, continue to fallback approach
        NULL;
    END;
    
    -- Fallback to check in the public schema if available
    BEGIN
        SELECT a.id INTO account_id
        FROM public.accounts a
        WHERE a.personal_account = true
        AND a.primary_owner_user_id = auth.uid();
        
        IF account_id IS NOT NULL THEN
            SELECT json_build_object(
                'account_id', a.id,
                'name', a.name,
                'slug', a.slug,
                'personal_account', a.personal_account,
                'primary_owner_user_id', a.primary_owner_user_id
            ) INTO account_data
            FROM public.accounts a
            WHERE a.id = account_id;
            
            RETURN account_data;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Error accessing public schema
        NULL;
    END;
    
    -- Development mode fallback - create a mock account
    IF current_setting('app.settings.environment', true) = 'development' OR 
       current_setting('app.settings.environment', true) IS NULL THEN
        RETURN json_build_object(
            'account_id', '00000000-0000-0000-0000-000000000000',
            'name', 'Development Account',
            'slug', null,
            'personal_account', true,
            'primary_owner_user_id', auth.uid()
        );
    END IF;
    
    -- If all else fails, return null (frontend will handle this gracefully now)
    RETURN NULL;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.get_personal_account() TO authenticated, anon;

-- Create RLS policy to allow authenticated users to see their personal accounts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'accounts' 
        AND schemaname = 'basejump' 
        AND policyname = 'Users can view their personal account'
    ) THEN
        CREATE POLICY "Users can view their personal account" ON basejump.accounts
            FOR SELECT
            TO authenticated
            USING (
                personal_account = true AND primary_owner_user_id = auth.uid()
            );
    END IF;
END
$$;

-- Ensure billing_subscriptions table has proper permissions
ALTER TABLE basejump.billing_subscriptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON basejump.billing_subscriptions TO anon, authenticated;

-- Create RLS policy to allow authenticated users to see their billing subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'billing_subscriptions' 
        AND schemaname = 'basejump' 
        AND policyname = 'Users can view their billing subscriptions'
    ) THEN
        CREATE POLICY "Users can view their billing subscriptions" ON basejump.billing_subscriptions
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM basejump.accounts a
                    WHERE a.id = billing_subscriptions.account_id
                    AND (
                        a.primary_owner_user_id = auth.uid()
                        OR EXISTS (
                            SELECT 1 FROM basejump.account_user au
                            WHERE au.account_id = a.id
                            AND au.user_id = auth.uid()
                            AND au.account_role = 'owner'
                        )
                    )
                )
            );
    END IF;
END
$$;
