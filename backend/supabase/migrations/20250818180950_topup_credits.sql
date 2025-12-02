CREATE TABLE IF NOT EXISTS public.credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_dollars DECIMAL(10, 2) NOT NULL CHECK (amount_dollars > 0),
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    CONSTRAINT credit_purchases_amount_positive CHECK (amount_dollars > 0)
);

CREATE TABLE IF NOT EXISTS public.credit_balance (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_dollars DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (balance_dollars >= 0),
    total_purchased DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_purchased >= 0),
    total_used DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_used >= 0),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.credit_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_dollars DECIMAL(10, 2) NOT NULL CHECK (amount_dollars > 0),
    thread_id UUID REFERENCES public.threads(thread_id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.messages(message_id) ON DELETE SET NULL,
    description TEXT,
    usage_type TEXT DEFAULT 'token_overage' CHECK (usage_type IN ('token_overage', 'manual_deduction', 'adjustment')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_tier TEXT,
    metadata JSONB DEFAULT '{}'
);
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_purchases' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON public.credit_purchases(user_id)';
        RAISE NOTICE 'Created idx_credit_purchases_user_id index';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_purchases' 
        AND column_name = 'account_id'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_credit_purchases_account_id ON public.credit_purchases(account_id)';
        RAISE NOTICE 'Created idx_credit_purchases_account_id index (user_id column renamed)';
    ELSE
        RAISE NOTICE 'Skipping credit_purchases user_id/account_id index - no suitable column found';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON public.credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at ON public.credit_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_stripe_payment_intent ON public.credit_purchases(stripe_payment_intent_id);

-- Create credit_usage indexes (conditional based on column existence)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_usage' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON public.credit_usage(user_id)';
        RAISE NOTICE 'Created idx_credit_usage_user_id index';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_usage' 
        AND column_name = 'account_id'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_credit_usage_account_id ON public.credit_usage(account_id)';
        RAISE NOTICE 'Created idx_credit_usage_account_id index (user_id column renamed)';
    ELSE
        RAISE NOTICE 'Skipping credit_usage user_id/account_id index - no suitable column found';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON public.credit_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_usage_thread_id ON public.credit_usage(thread_id);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own credit purchases" ON public.credit_purchases;
DROP POLICY IF EXISTS "Service role can manage all credit purchases" ON public.credit_purchases;
DROP POLICY IF EXISTS "Users can view their own credit balance" ON public.credit_balance;
DROP POLICY IF EXISTS "Service role can manage all credit balances" ON public.credit_balance;
DROP POLICY IF EXISTS "Users can view their own credit usage" ON public.credit_usage;
DROP POLICY IF EXISTS "Service role can manage all credit usage" ON public.credit_usage;

-- Create policies that can handle both user_id and account_id columns
DO $$
BEGIN
    -- Check if user_id exists and create policy accordingly
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_purchases' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'credit_purchases' 
        AND policyname = 'Users can view their own credit purchases'
    ) THEN
        CREATE POLICY "Users can view their own credit purchases" ON public.credit_purchases
        FOR SELECT USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Created credit_purchases policy for user_id column';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_purchases' 
        AND column_name = 'account_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'credit_purchases' 
        AND policyname = 'Users can view their own credit purchases with account_id'
    ) THEN
        CREATE POLICY "Users can view their own credit purchases with account_id" ON public.credit_purchases
        FOR SELECT USING (auth.uid() = account_id);
        
        RAISE NOTICE 'Created credit_purchases policy for account_id column (user_id renamed)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'credit_purchases' 
        AND policyname = 'Service role can manage all credit purchases'
    ) THEN
        CREATE POLICY "Service role can manage all credit purchases" ON public.credit_purchases
    FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Create credit_balance policies (handle both user_id and account_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_balance' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'credit_balance' 
        AND policyname = 'Users can view their own credit balance'
    ) THEN
        CREATE POLICY "Users can view their own credit balance" ON public.credit_balance
        FOR SELECT USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Created credit_balance policy for user_id column';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_balance' 
        AND column_name = 'account_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'credit_balance' 
        AND policyname = 'Users can view their own credit balance with account_id'
    ) THEN
        CREATE POLICY "Users can view their own credit balance with account_id" ON public.credit_balance
        FOR SELECT USING (auth.uid() = account_id);
        
        RAISE NOTICE 'Created credit_balance policy for account_id column (user_id renamed)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'credit_balance' 
        AND policyname = 'Service role can manage all credit balances'
    ) THEN
        CREATE POLICY "Service role can manage all credit balances" ON public.credit_balance
    FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Create credit_usage policies (handle both user_id and account_id)
DO $$
BEGIN
    -- Check if user_id exists and create policy accordingly
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_usage' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'credit_usage' 
        AND policyname = 'Users can view their own credit usage'
    ) THEN
        CREATE POLICY "Users can view their own credit usage" ON public.credit_usage
        FOR SELECT USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Created credit_usage policy for user_id column';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_usage' 
        AND column_name = 'account_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'credit_usage' 
        AND policyname = 'Users can view their own credit usage with account_id'
    ) THEN
        CREATE POLICY "Users can view their own credit usage with account_id" ON public.credit_usage
        FOR SELECT USING (auth.uid() = account_id);
        
        RAISE NOTICE 'Created credit_usage policy for account_id column (user_id renamed)';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'credit_usage' 
        AND policyname = 'Service role can manage all credit usage'
    ) THEN
        CREATE POLICY "Service role can manage all credit usage" ON public.credit_usage
    FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;


DROP FUNCTION IF EXISTS public.add_credits(UUID, DECIMAL, UUID);
CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id UUID,
    p_amount DECIMAL,
    p_purchase_id UUID DEFAULT NULL
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_balance DECIMAL;
BEGIN
    INSERT INTO public.credit_balance (user_id, balance_dollars, total_purchased)
    VALUES (p_user_id, p_amount, p_amount)
    ON CONFLICT (user_id) DO UPDATE
    SET 
        balance_dollars = credit_balance.balance_dollars + p_amount,
        total_purchased = credit_balance.total_purchased + p_amount,
        last_updated = NOW()
    RETURNING balance_dollars INTO new_balance;
    RETURN new_balance;
END;
$$;

-- Function to delete credit usage older than X days
CREATE OR REPLACE FUNCTION public.delete_old_credit_usage(
    p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM public.credit_usage 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_old;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


DROP FUNCTION IF EXISTS public.use_credits(UUID, DECIMAL, TEXT, UUID, UUID);
CREATE OR REPLACE FUNCTION public.use_credits(
    p_user_id UUID,
    p_amount DECIMAL,
    p_description TEXT DEFAULT NULL,
    p_thread_id UUID DEFAULT NULL,
    p_message_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance DECIMAL;
    success BOOLEAN := FALSE;
BEGIN
    SELECT balance_dollars INTO current_balance
    FROM public.credit_balance
    WHERE user_id = p_user_id
    FOR UPDATE;
    IF current_balance IS NOT NULL AND current_balance >= p_amount THEN
        UPDATE public.credit_balance
        SET 
            balance_dollars = balance_dollars - p_amount,
            total_used = total_used + p_amount,
            last_updated = NOW()
        WHERE user_id = p_user_id;
        INSERT INTO public.credit_usage (
            user_id, 
            amount_dollars, 
            description, 
            thread_id, 
            message_id,
            usage_type
        )
        VALUES (
            p_user_id, 
            p_amount, 
            p_description, 
            p_thread_id, 
            p_message_id,
            'token_overage'
        );
        success := TRUE;
    END IF;
    RETURN success;
END;
$$;


DROP FUNCTION IF EXISTS public.get_credit_balance(UUID);
CREATE OR REPLACE FUNCTION public.get_credit_balance(p_user_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    balance DECIMAL;
BEGIN
    SELECT balance_dollars INTO balance
    FROM public.credit_balance
    WHERE user_id = p_user_id;
    RETURN COALESCE(balance, 0);
END;
$$;

-- Grant permissions (conditional based on function existence)
DO $$
BEGIN
    -- Add credits function permissions if function exists
    -- Need to specify full signature since there are multiple overloads
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'add_credits'
        AND n.nspname = 'public'
        AND pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid, p_amount numeric, p_purchase_id uuid'
    ) THEN
        GRANT EXECUTE ON FUNCTION public.add_credits(UUID, DECIMAL, UUID) TO service_role;
        RAISE NOTICE 'Granted EXECUTE on add_credits(UUID, DECIMAL, UUID) function';
    END IF;

    -- Use credits function permissions if function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'use_credits'
        AND n.nspname = 'public'
        AND pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid, p_amount numeric, p_description text, p_thread_id uuid, p_message_id uuid'
    ) THEN
        GRANT EXECUTE ON FUNCTION public.use_credits(UUID, DECIMAL, TEXT, UUID, UUID) TO service_role;
        RAISE NOTICE 'Granted EXECUTE on use_credits function';
    END IF;

    -- Get credit balance function permissions if function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_credit_balance'
        AND n.nspname = 'public'
        AND pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid'
    ) THEN
        GRANT EXECUTE ON FUNCTION public.get_credit_balance(UUID) TO authenticated, service_role;
        RAISE NOTICE 'Granted EXECUTE on get_credit_balance function';
    END IF;
END $$;

GRANT SELECT ON public.credit_purchases TO authenticated;
GRANT SELECT ON public.credit_balance TO authenticated;
GRANT SELECT ON public.credit_usage TO authenticated;

GRANT ALL ON public.credit_purchases TO service_role;
GRANT ALL ON public.credit_balance TO service_role;
GRANT ALL ON public.credit_usage TO service_role; 