-- Migration: Enable realtime updates for projects table
-- This migration enables realtime subscriptions for the projects table

-- Enable realtime for projects table (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'projects'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE projects';
        RAISE NOTICE 'Added projects table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'Projects table already in supabase_realtime publication - skipping';
    END IF;
END $$;