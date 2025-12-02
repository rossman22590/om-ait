-- Enable Realtime for vapi_calls table
ALTER PUBLICATION supabase_realtime ADD TABLE vapi_calls;

-- Add RLS policies for vapi_calls
ALTER TABLE vapi_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see calls from their own threads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vapi_calls' 
        AND policyname = 'Users can view their own calls'
    ) THEN
        CREATE POLICY "Users can view their own calls" ON vapi_calls
FOR SELECT
USING (
  thread_id IN (
    SELECT thread_id
    FROM threads
    WHERE account_id = auth.uid()
  )
);
    END IF;
END $$;

-- Policy: System can insert call records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vapi_calls' 
        AND policyname = 'System can insert calls'
    ) THEN
        CREATE POLICY "System can insert calls" ON vapi_calls
FOR INSERT
WITH CHECK (true);
    END IF;
END $$;

-- Policy: System can update call records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vapi_calls' 
        AND policyname = 'System can update calls'
    ) THEN
        CREATE POLICY "System can update calls" ON vapi_calls
FOR UPDATE
USING (true);
    END IF;
END $$;

COMMENT ON POLICY "Users can view their own calls" ON vapi_calls IS 'Allow users to see calls associated with their threads';
COMMENT ON POLICY "System can insert calls" ON vapi_calls IS 'Allow system to create call records';
COMMENT ON POLICY "System can update calls" ON vapi_calls IS 'Allow system to update call status and transcripts';

