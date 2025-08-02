-- Check if the Suna default agent functions exist
-- Run this in your Supabase SQL editor or psql

-- Method 1: Check if the functions exist in pg_proc
SELECT 
    proname as function_name,
    prosrc as function_body_preview
FROM pg_proc 
WHERE proname IN (
    'find_suna_default_agent_for_account',
    'get_all_suna_default_agents', 
    'count_suna_agents_by_version',
    'get_suna_default_agent_stats',
    'find_suna_agents_needing_update'
)
ORDER BY proname;

-- Method 2: Try to call one of the functions (will error if it doesn't exist)
-- Replace 'your-account-id-here' with an actual UUID from your accounts table
-- SELECT * FROM find_suna_default_agent_for_account('your-account-id-here');

-- Method 3: Check the information_schema for routines
SELECT 
    routine_name,
    routine_type,
    created
FROM information_schema.routines 
WHERE routine_name IN (
    'find_suna_default_agent_for_account',
    'get_all_suna_default_agents',
    'count_suna_agents_by_version', 
    'get_suna_default_agent_stats',
    'find_suna_agents_needing_update'
)
ORDER BY routine_name;

-- Method 4: Check if migration was recorded (if you track migrations)
-- SELECT * FROM schema_migrations WHERE version = '20250722034729';
