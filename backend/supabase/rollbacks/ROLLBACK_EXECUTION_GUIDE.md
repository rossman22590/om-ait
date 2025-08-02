# 🔄 Supabase Migration Rollback Guide

## ⚠️ **CRITICAL WARNINGS**

### **Data Loss Warnings**
Some rollbacks **CANNOT** fully restore data that was permanently deleted:

- **🔴 HIGH RISK - PERMANENT DATA LOSS:**
  - `rollback_20250726174310_rem-devices-tables-responses_col.sql` - recordings, devices tables
  - `rollback_20250726180605_remove_old_workflow_sys.sql` - old workflow execution history
  - `rollback_20250726184725_cleanup_schema_1.sql` - knowledge base data
  - `rollback_20250726200404_remove_agent_cols_from_threads.sql` - agent association history

- **🟡 MEDIUM RISK - BACKUP DEPENDENT:**
  - `rollback_20250723175911_cleanup_agents_table.sql` - requires backup table
  - `rollback_20250728193819_fix_templates.sql` - requires backup table
  - `rollback_20250729094718_cleanup_agents_table.sql` - requires backup table

## 📋 **Rollback Execution Order**

**⚠️ IMPORTANT: Execute rollbacks in REVERSE order of the original migrations!**

### **Reverse Execution Order (21 rollbacks):**

```sql
-- Step 20 (SAFE)
\i rollback_20250729120000_api_keys.sql

-- Step 19 (SAFE)
\i rollback_20250729110000_fix_pipedream_qualified_names.sql

-- Step 18 (SAFE)
\i rollback_20250729105030_fix_agentpress_tools_sanitization.sql

-- Step 17 (BACKUP DEPENDENT)
\i rollback_20250729094718_cleanup_agents_table.sql

-- Step 16 (BACKUP DEPENDENT)
\i rollback_20250728193819_fix_templates.sql

-- Step 15 (SAFE - reverses data migration)
\i rollback_20250726224819_reverse_move_agent_fields_to_metadata.sql

-- Step 14 (SAFE - reverses data migration)
\i rollback_20250726223759_move_agent_fields_to_metadata.sql

-- Step 13 (PERMANENT DATA LOSS)
\i rollback_20250726200404_remove_agent_cols_from_threads.sql

-- Step 12 (PERMANENT DATA LOSS)
\i rollback_20250726184725_cleanup_schema_1.sql

-- Step 11 (PERMANENT DATA LOSS)
\i rollback_20250726180605_remove_old_workflow_sys.sql

-- Step 10 (PERMANENT DATA LOSS)
\i rollback_20250726174310_rem-devices-tables-responses_col.sql

-- Step 9 (SAFE)
\i rollback_20250723181204_restore_avatar_columns.sql

-- Step 8 (BACKUP DEPENDENT)
\i rollback_20250723175911_cleanup_agents_table.sql

-- Step 7 (SAFE)
\i rollback_20250723093053_fix_workflow_policy_conflicts.sql

-- Step 6 (SAFE)
\i rollback_20250723055703_nullable_system_prompt.sql

-- Step 5 (SAFE)
\i rollback_20250722034729_default_agent.sql

-- Step 4 (SAFE)
\i rollback_20250722031718_agent_metadata.sql

-- Step 3 (COMPLEX - enum modification)
\i rollback_20250706130554_simplify_workflow_steps.sql

-- Step 2 (SAFE)
\i rollback_20250705164211_fix_agent_workflows.sql

-- Step 1 (SAFE)
\i rollback_20250705161610_agent_workflows.sql

-- Step 0 (SAFE)
\i rollback_20250618000000_credential_profiles.sql
```

## 🛡️ **Pre-Rollback Checklist**

1. **✅ Create Full Database Backup**
   ```sql
   -- Create a complete backup before any rollbacks
   pg_dump your_database > pre_rollback_backup.sql
   ```

2. **✅ Verify Backup Tables Exist**
   ```sql
   -- Check for required backup tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN (
       'agents_backup_cleanup_20250729',
       'agent_templates_backup_20250728'
   );
   ```

3. **✅ Document Current State**
   - Record which migrations are currently applied
   - Note any custom changes made after migrations
   - Document critical data that must be preserved

## 🎯 **Selective Rollback Strategy**

### **Option 1: Full Rollback (All 21)**
- Use when completely reverting to pre-migration state
- **WARNING:** Will result in significant data loss

### **Option 2: Partial Rollback (Safe Only)**
- Roll back only SAFE migrations (Steps 20, 19, 18, 9, 7, 6, 5, 4, 2, 1, 0)
- Preserves all data while removing safe features

### **Option 3: Targeted Rollback**
- Roll back specific problematic migrations only
- Requires careful dependency analysis

## 🔍 **Post-Rollback Verification**

1. **Check Database Integrity**
   ```sql
   -- Verify no broken foreign keys
   SELECT conname, conrelid::regclass, confrelid::regclass 
   FROM pg_constraint 
   WHERE contype = 'f' AND NOT EXISTS (
       SELECT 1 FROM pg_class WHERE oid = confrelid
   );
   ```

2. **Verify Critical Data**
   ```sql
   -- Check agents table
   SELECT COUNT(*) FROM agents;
   
   -- Check threads table
   SELECT COUNT(*) FROM threads;
   
   -- Check workflows (if not rolled back)
   SELECT COUNT(*) FROM agent_workflows;
   ```

3. **Test Application Functionality**
   - Test agent creation and management
   - Test workflow execution (if applicable)
   - Test authentication and authorization

## 🚨 **Emergency Recovery**

If rollbacks fail or cause issues:

1. **Restore from Pre-Rollback Backup**
   ```sql
   psql your_database < pre_rollback_backup.sql
   ```

2. **Contact Support**
   - Provide rollback logs
   - Include error messages
   - Describe current database state

## 📝 **Rollback Log Template**

```
ROLLBACK EXECUTION LOG
=====================
Date: ___________
Database: ___________
Executed by: ___________

Pre-rollback backup: [ ] Created [ ] Verified
Backup tables verified: [ ] Yes [ ] No

Rollbacks executed:
[ ] Step 20: API keys
[ ] Step 19: Pipedream names
[ ] Step 18: AgentPress sanitization
...

Issues encountered:
- 
- 

Final verification:
[ ] Database integrity check passed
[ ] Critical data verified
[ ] Application functionality tested

Status: [ ] SUCCESS [ ] PARTIAL [ ] FAILED
```

---

**⚠️ Remember: Some data loss is irreversible. Always backup before rollback!**
