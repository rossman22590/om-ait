-- Atomic function to create thread and message in a single transaction
-- This fixes FK constraint violations caused by Supabase REST API eventual consistency
-- Root cause: Thread insert returns success but data isn't immediately visible for FK check
-- Solution: Use a stored procedure that runs both inserts in the same database transaction

CREATE OR REPLACE FUNCTION create_thread_with_message(
    p_thread_id UUID,
    p_project_id UUID,
    p_account_id UUID,
    p_message_id UUID DEFAULT NULL,
    p_message_content JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_thread_result JSONB;
    v_message_result JSONB;
BEGIN
    -- Create the thread
    INSERT INTO threads (thread_id, project_id, account_id, created_at)
    VALUES (p_thread_id, p_project_id, p_account_id, NOW())
    RETURNING jsonb_build_object(
        'thread_id', thread_id,
        'project_id', project_id,
        'account_id', account_id,
        'created_at', created_at
    ) INTO v_thread_result;

    -- If message content is provided, create the message in the same transaction
    IF p_message_id IS NOT NULL AND p_message_content IS NOT NULL THEN
        INSERT INTO messages (message_id, thread_id, type, is_llm_message, content, created_at)
        VALUES (
            p_message_id,
            p_thread_id,
            'user',
            TRUE,
            p_message_content,
            NOW()
        )
        RETURNING jsonb_build_object(
            'message_id', message_id,
            'thread_id', thread_id,
            'type', type,
            'created_at', created_at
        ) INTO v_message_result;

        RETURN jsonb_build_object(
            'thread', v_thread_result,
            'message', v_message_result
        );
    END IF;

    RETURN jsonb_build_object(
        'thread', v_thread_result,
        'message', NULL
    );
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION create_thread_with_message(UUID, UUID, UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_thread_with_message(UUID, UUID, UUID, UUID, JSONB) TO service_role;

COMMENT ON FUNCTION create_thread_with_message IS 'Atomically creates a thread and optionally a user message in a single database transaction. This prevents FK constraint violations caused by eventual consistency in the REST API.';
