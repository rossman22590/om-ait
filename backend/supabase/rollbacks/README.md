# 🔄 Supabase Migration Rollbacks

This directory contains rollback scripts for all 21 Supabase migrations.

## 📁 **Rollback Scripts**

| Step | Migration | Rollback Script | Risk Level |
|------|-----------|----------------|------------|
| 0 | `20250618000000_credential_profiles.sql` | `rollback_20250618000000_credential_profiles.sql` | 🟢 SAFE |
| 1 | `20250705161610_agent_workflows.sql` | `rollback_20250705161610_agent_workflows.sql` | 🟢 SAFE |
| 2 | `20250705164211_fix_agent_workflows.sql` | `rollback_20250705164211_fix_agent_workflows.sql` | 🟢 SAFE |
| 3 | `20250706130554_simplify_workflow_steps.sql` | `rollback_20250706130554_simplify_workflow_steps.sql` | 🟡 COMPLEX |
| 4 | `20250722031718_agent_metadata.sql` | `rollback_20250722031718_agent_metadata.sql` | 🟢 SAFE |
| 5 | `20250722034729_default_agent.sql` | `rollback_20250722034729_default_agent.sql` | 🟢 SAFE |
| 6 | `20250723055703_nullable_system_prompt.sql` | `rollback_20250723055703_nullable_system_prompt.sql` | 🟢 SAFE |
| 7 | `20250723093053_fix_workflow_policy_conflicts.sql` | `rollback_20250723093053_fix_workflow_policy_conflicts.sql` | 🟢 SAFE |
| 8 | `20250723175911_cleanup_agents_table.sql` | `rollback_20250723175911_cleanup_agents_table.sql` | 🟡 BACKUP DEP |
| 9 | `20250723181204_restore_avatar_columns.sql` | `rollback_20250723181204_restore_avatar_columns.sql` | 🟢 SAFE |
| 10 | `20250726174310_rem-devices-tables-responses_col.sql` | `rollback_20250726174310_rem-devices-tables-responses_col.sql` | 🔴 DATA LOSS |
| 11 | `20250726180605_remove_old_workflow_sys.sql` | `rollback_20250726180605_remove_old_workflow_sys.sql` | 🔴 DATA LOSS |
| 12 | `20250726184725_cleanup_schema_1.sql` | `rollback_20250726184725_cleanup_schema_1.sql` | 🔴 DATA LOSS |
| 13 | `20250726200404_remove_agent_cols_from_threads.sql` | `rollback_20250726200404_remove_agent_cols_from_threads.sql` | 🔴 DATA LOSS |
| 14 | `20250726223759_move_agent_fields_to_metadata.sql` | `rollback_20250726223759_move_agent_fields_to_metadata.sql` | 🟢 SAFE |
| 15 | `20250726224819_reverse_move_agent_fields_to_metadata.sql` | `rollback_20250726224819_reverse_move_agent_fields_to_metadata.sql` | 🟢 SAFE |
| 16 | `20250728193819_fix_templates.sql` | `rollback_20250728193819_fix_templates.sql` | 🟡 BACKUP DEP |
| 17 | `20250729094718_cleanup_agents_table.sql` | `rollback_20250729094718_cleanup_agents_table.sql` | 🟡 BACKUP DEP |
| 18 | `20250729105030_fix_agentpress_tools_sanitization.sql` | `rollback_20250729105030_fix_agentpress_tools_sanitization.sql` | 🟢 SAFE |
| 19 | `20250729110000_fix_pipedream_qualified_names.sql` | `rollback_20250729110000_fix_pipedream_qualified_names.sql` | 🟢 SAFE |
| 20 | `20250729120000_api_keys.sql` | `rollback_20250729120000_api_keys.sql` | 🟢 SAFE |

## 🚨 **Risk Levels**

- **🟢 SAFE**: Can be rolled back without data loss
- **🟡 BACKUP DEP**: Requires backup tables to restore data
- **🟡 COMPLEX**: Complex operations (enum changes, etc.)
- **🔴 DATA LOSS**: Cannot fully restore deleted data

## 📖 **Usage**

1. **Read the execution guide**: `ROLLBACK_EXECUTION_GUIDE.md`
2. **Create database backup** before any rollbacks
3. **Execute in reverse order** (Step 20 → Step 0)
4. **Verify backup tables exist** for BACKUP DEP rollbacks

## ⚠️ **Important Notes**

- **Always backup before rollback**
- **Execute in reverse chronological order**
- **Some data loss is permanent and cannot be recovered**
- **Test thoroughly after rollbacks**

---

**For detailed instructions, see `ROLLBACK_EXECUTION_GUIDE.md`**
