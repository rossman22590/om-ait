DROP POLICY IF EXISTS "Give read only access to internal users" ON threads;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'threads' 
        AND policyname = 'Give read only access to internal users'
    ) THEN
        CREATE POLICY "Give read only access to internal users" ON threads
FOR SELECT
USING (
    ((auth.jwt() ->> 'email'::text) ~~ '%@kortix.ai'::text)
);
    END IF;
END $$;


DROP POLICY IF EXISTS "Give read only access to internal users" ON messages;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'messages' 
        AND policyname = 'Give read only access to internal users'
    ) THEN
        CREATE POLICY "Give read only access to internal users" ON messages
FOR SELECT
USING (
    ((auth.jwt() ->> 'email'::text) ~~ '%@kortix.ai'::text)
);
    END IF;
END $$;


DROP POLICY IF EXISTS "Give read only access to internal users" ON projects;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'projects' 
        AND policyname = 'Give read only access to internal users'
    ) THEN
        CREATE POLICY "Give read only access to internal users" ON projects
FOR SELECT
USING (
    ((auth.jwt() ->> 'email'::text) ~~ '%@kortix.ai'::text)
);
    END IF;
END $$;
