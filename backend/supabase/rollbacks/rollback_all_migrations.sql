-- MASTER ROLLBACK SCRIPT
-- This script rolls back all migrations in reverse chronological order
-- WARNING: This will cause significant data loss and should only be used in emergency situations

BEGIN;

-- 14. Rollback 20250708123910_cleanup_db.sql
-- WARNING: This is a complex rollback with potential data loss
\i rollback_20250708123910_cleanup_db.sql

-- 13. Rollback 20250708034613_add_steps_to_workflows.sql
\i rollback_20250708034613_add_steps_to_workflows.sql

-- 12. Rollback 20250707140000_add_agent_run_metadata.sql
\i rollback_20250707140000_add_agent_run_metadata.sql

-- 11. Rollback 20250706130555_set_instruction_default.sql
\i rollback_20250706130555_set_instruction_default.sql

-- 10. Rollback 20250706130554_simplify_workflow_steps.sql
-- WARNING: This rollback is complex and commented out for safety
-- \i rollback_20250706130554_simplify_workflow_steps.sql

-- 9. Rollback 20250705164211_fix_agent_workflows.sql
\i rollback_20250705164211_fix_agent_workflows.sql

-- 8. Rollback 20250705161610_agent_workflows.sql
\i rollback_20250705161610_agent_workflows.sql

-- 7. Rollback 20250705155923_rollback_workflows.sql
-- This recreates the old workflow system (empty structures)
\i rollback_20250705155923_rollback_workflows.sql

-- 6. Rollback 20250701083536_agent_kb_files.sql
\i rollback_20250701083536_agent_kb_files.sql

-- 5. Rollback 20250701082739_agent_knowledge_base.sql
\i rollback_20250701082739_agent_knowledge_base.sql

-- 4. Rollback 20250630070510_agent_triggers.sql
\i rollback_20250630070510_agent_triggers.sql

-- 3. Rollback 20250626114642_kortix_team_agents.sql
\i rollback_20250626114642_kortix_team_agents.sql

-- 2. Rollback 20250626092143_agent_agnostic_thread.sql
\i rollback_20250626092143_agent_agnostic_thread.sql

-- 1. Rollback 20250601000000_add_thread_metadata.sql
\i rollback_20250601000000_add_thread_metadata.sql

COMMIT;

-- IMPORTANT NOTES:
-- 1. This rollback will cause significant data loss
-- 2. Some rollbacks (especially enum changes) are complex and may fail
-- 3. Always backup your database before running any rollbacks
-- 4. Test in a staging environment first
-- 5. Some migrations like 20250708123910_cleanup_db.sql have complex rollbacks that may not fully restore original state 