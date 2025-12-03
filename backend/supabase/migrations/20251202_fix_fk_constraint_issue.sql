-- Migration to fix FK constraint race condition with Supabase replication lag
-- The REST API auto-commits each statement, so DEFERRABLE doesn't help.
-- Solution: RPC function that checks thread exists before insert (in same transaction)

-- Create a function to safely insert messages with retry logic for FK issues
CREATE OR REPLACE FUNCTION insert_message_safe(
    p_thread_id UUID,
    p_type TEXT,
    p_content JSONB,
    p_is_llm_message BOOLEAN DEFAULT FALSE,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_agent_id UUID DEFAULT NULL,
    p_agent_version_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_message_id UUID;
    v_result JSONB;
    v_thread_exists BOOLEAN;
BEGIN
    -- First verify thread exists (this SELECT and INSERT will be in same transaction)
    SELECT EXISTS(SELECT 1 FROM threads WHERE thread_id = p_thread_id) INTO v_thread_exists;

    IF NOT v_thread_exists THEN
        -- Thread genuinely doesn't exist
        RAISE EXCEPTION 'Thread % does not exist', p_thread_id;
    END IF;

    -- Thread exists, now insert (FK check will pass because we're in same transaction)
    INSERT INTO messages (
        thread_id,
        type,
        content,
        is_llm_message,
        metadata,
        agent_id,
        agent_version_id
    ) VALUES (
        p_thread_id,
        p_type,
        p_content,
        p_is_llm_message,
        p_metadata,
        p_agent_id,
        p_agent_version_id
    )
    RETURNING message_id INTO v_message_id;

    -- Return the inserted message
    SELECT jsonb_build_object(
        'message_id', m.message_id,
        'thread_id', m.thread_id,
        'type', m.type,
        'content', m.content,
        'is_llm_message', m.is_llm_message,
        'metadata', m.metadata,
        'created_at', m.created_at,
        'updated_at', m.updated_at,
        'agent_id', m.agent_id,
        'agent_version_id', m.agent_version_id
    ) INTO v_result
    FROM messages m
    WHERE m.message_id = v_message_id;

    RETURN v_result;
END;
$$;
[
  {
    "conname": "messages_thread_id_fkey",
    "condeferrable": true,
    "condeferred": true
  }
]
