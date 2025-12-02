CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    active_thread_id TEXT,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    platform TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_active_thread ON user_presence(user_id, active_thread_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

CREATE OR REPLACE FUNCTION update_user_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_presence_updated_at ON user_presence;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'user_presence_updated_at'
    ) THEN
        CREATE TRIGGER user_presence_updated_at
        BEFORE UPDATE ON user_presence
    FOR EACH ROW
        EXECUTE FUNCTION update_user_presence_timestamp();
    END IF;
END $$;

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own presence" ON user_presence;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_presence' 
        AND policyname = 'Users can manage own presence'
    ) THEN
        CREATE POLICY "Users can manage own presence" ON user_presence FOR ALL
    USING (auth.uid() = user_id);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
    UPDATE user_presence
    SET active_thread_id = NULL
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;
