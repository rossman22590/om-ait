# Migration Rollback Analysis

## Overview
This document provides a comprehensive analysis of all migrations and their corresponding rollback scripts. The migrations are listed in chronological order with safety assessments and rollback complexity.

## Migration Safety Assessment

### ✅ SAFE MIGRATIONS (Additive Only)
These migrations only add new features without modifying existing data:

1. **20250601000000_add_thread_metadata.sql** - Adds JSONB metadata to threads, agent_id to messages
2. **20250626092143_agent_agnostic_thread.sql** - Adds agent tracking columns to messages/agent_runs
3. **20250626114642_kortix_team_agents.sql** - Adds boolean flag to agent_templates
4. **20250630070510_agent_triggers.sql** - Creates new trigger system tables
5. **20250701082739_agent_knowledge_base.sql** - Creates new knowledge base tables
6. **20250701083536_agent_kb_files.sql** - Adds file support to knowledge base
7. **20250705161610_agent_workflows.sql** - Creates new workflow system
8. **20250705164211_fix_agent_workflows.sql** - Fixes foreign keys and policies
9. **20250707140000_add_agent_run_metadata.sql** - Adds metadata to agent_runs
10. **20250708034613_add_steps_to_workflows.sql** - Adds steps column to workflows

### ⚠️ CAUTION REQUIRED
These migrations require special attention:

11. **20250706130554_simplify_workflow_steps.sql** - Adds enum value (cannot be easily rolled back)
12. **20250706130555_set_instruction_default.sql** - Modifies existing data
13. **20250705155923_rollback_workflows.sql** - Destructive (drops old workflow system)
14. **20250708123910_cleanup_db.sql** - Destructive + data consolidation

## Rollback Script Complexity

### Simple Rollbacks (Low Risk)
- `rollback_20250601000000_add_thread_metadata.sql` - Drops columns and indexes
- `rollback_20250626092143_agent_agnostic_thread.sql` - Drops columns and indexes  
- `rollback_20250626114642_kortix_team_agents.sql` - Drops column and index
- `rollback_20250707140000_add_agent_run_metadata.sql` - Drops column and index
- `rollback_20250708034613_add_steps_to_workflows.sql` - Drops column and index

### Moderate Rollbacks (Medium Risk)
- `rollback_20250630070510_agent_triggers.sql` - Drops multiple tables and enum
- `rollback_20250701082739_agent_knowledge_base.sql` - Drops tables and functions
- `rollback_20250701083536_agent_kb_files.sql` - Drops table and columns
- `rollback_20250705161610_agent_workflows.sql` - Drops workflow system
- `rollback_20250705164211_fix_agent_workflows.sql` - Removes fixes (returns to broken state)

### Complex Rollbacks (High Risk)
- `rollback_20250706130554_simplify_workflow_steps.sql` - **ENUM MODIFICATION** (commented out for safety)
- `rollback_20250706130555_set_instruction_default.sql` - Cannot restore modified data
- `rollback_20250705155923_rollback_workflows.sql` - Recreates empty structures only
- `rollback_20250708123910_cleanup_db.sql` - **MOST COMPLEX** - attempts data restoration from JSONB

## Rollback Order (Reverse Chronological)

1. rollback_20250708123910_cleanup_db.sql ⚠️
2. rollback_20250708034613_add_steps_to_workflows.sql ✅
3. rollback_20250707140000_add_agent_run_metadata.sql ✅
4. rollback_20250706130555_set_instruction_default.sql ⚠️
5. rollback_20250706130554_simplify_workflow_steps.sql ❌ (commented out)
6. rollback_20250705164211_fix_agent_workflows.sql ⚠️
7. rollback_20250705161610_agent_workflows.sql ✅
8. rollback_20250705155923_rollback_workflows.sql ⚠️
9. rollback_20250701083536_agent_kb_files.sql ✅
10. rollback_20250701082739_agent_knowledge_base.sql ✅
11. rollback_20250630070510_agent_triggers.sql ✅
12. rollback_20250626114642_kortix_team_agents.sql ✅
13. rollback_20250626092143_agent_agnostic_thread.sql ✅
14. rollback_20250601000000_add_thread_metadata.sql ✅

## Data Loss Warnings

### Inevitable Data Loss
- **20250708123910_cleanup_db.sql rollback**: Attempts to restore from JSONB but some data may be lost
- **20250705155923_rollback_workflows.sql rollback**: Only recreates empty table structures
- **20250706130555_set_instruction_default.sql rollback**: Cannot restore original type values

### Potential Data Loss
- **20250706130554_simplify_workflow_steps.sql rollback**: Would require recreating enum type
- **20250705164211_fix_agent_workflows.sql rollback**: Returns system to broken state

## Recommendations

### Before Running Any Rollbacks
1. **BACKUP DATABASE** - Essential before any rollback operation
2. **Test in staging** - Never run rollbacks directly in production
3. **Document current state** - Know what you're rolling back from
4. **Have migration plan** - Know how to get back to current state

### Rollback Strategy
1. **Individual rollbacks** - Prefer rolling back specific migrations rather than all
2. **Verify dependencies** - Check if other systems depend on rolled-back features
3. **Monitor applications** - Some rollbacks may break application functionality
4. **Plan re-migration** - Have a plan to reapply migrations if needed

### Emergency Procedures
- Use `rollback_all_migrations.sql` only in extreme emergencies
- The master rollback script includes safety comments and warnings
- Some complex rollbacks are commented out for safety

## Files Created
- Individual rollback scripts in `backend/supabase/rollbacks/`
- Master rollback script: `rollback_all_migrations.sql`
- This analysis document: `ROLLBACK_ANALYSIS.md`

## Notes
- PostgreSQL enum modifications are complex and risky
- JSONB data consolidation rollbacks are not perfect
- Always test rollbacks in non-production environments
- Some rollbacks may require manual intervention 