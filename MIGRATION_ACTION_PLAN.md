# Supabase Migration Action Plan - 21 Migrations

## 🎯 Executive Summary

**Total Migrations**: 21 (Steps 0-20)  
**Risk Assessment**: 6 HIGH RISK, 2 MEDIUM RISK, 13 SAFE  
**Data Loss**: Permanent deletion of unused features, all critical data preserved  
**Backup Strategy**: 3 migrations create backup tables before destructive operations  

---

## 📋 Complete Migration List (Execution Order)

### Step 0: 🟢 SAFE - Credential Profiles Foundation
**File**: `20250618000000_credential_profiles.sql`  
**Purpose**: Creates secure MCP credential profile system  
**Data Impact**: ✅ Creates new table, migrates existing credentials if present  
**Safety**: Very safe - additive only

### Step 1: 🟢 SAFE - Workflow System Creation
**File**: `20250705161610_agent_workflows.sql`  
**Purpose**: Creates complete agent workflow execution system  
**Data Impact**: ✅ Creates 4 new tables, enums, policies  
**Safety**: Safe - pure table creation

### Step 2: 🟢 SAFE - Workflow System Fixes
**File**: `20250705164211_fix_agent_workflows.sql`  
**Purpose**: Fixes foreign key constraints and policies  
**Data Impact**: ✅ Constraint improvements, no data changes  
**Safety**: Safe - structural improvements

### Step 3: 🟢 SAFE - Workflow Step Enhancement
**File**: `20250706130554_simplify_workflow_steps.sql`  
**Purpose**: Adds 'instruction' to workflow step enum  
**Data Impact**: ✅ Additive enum modification  
**Safety**: Safe - enum expansion

### Step 4: 🟢 SAFE - Agent Metadata System
**File**: `20250722031718_agent_metadata.sql`  
**Purpose**: Adds comprehensive metadata system to agents  
**Data Impact**: ✅ Adds metadata JSONB column, creates helper functions  
**Safety**: Safe - additive column and functions

### Step 5: 🟢 SAFE - Suna Default Agent Management
**File**: `20250722034729_default_agent.sql`  
**Purpose**: Creates Suna default agent management functions  
**Data Impact**: ✅ Creates management functions only  
**Safety**: Safe - function creation only

### Step 6: 🟢 SAFE - System Prompt Flexibility
**File**: `20250723055703_nullable_system_prompt.sql`  
**Purpose**: Makes system_prompt nullable for Suna agents  
**Data Impact**: ✅ Relaxes constraint, updates Suna agents to NULL  
**Safety**: Safe - constraint relaxation

### Step 7: 🟢 SAFE - Workflow Policy Cleanup
**File**: `20250723093053_fix_workflow_policy_conflicts.sql`  
**Purpose**: Removes conflicting workflow policies  
**Data Impact**: ✅ Drops conflicting policies and triggers  
**Safety**: Safe - cleanup operation

### Step 8: 🔴 HIGH RISK - Agent Table Cleanup
**File**: `20250723175911_cleanup_agents_table.sql`  
**Purpose**: Removes deprecated columns from agents table  
**Data Impact**: 
- ✅ **BACKUP CREATED**: `agents_backup_cleanup_20250729`
- ❌ **DELETED**: `marketplace_published_at`, `download_count`, `config` columns
- 📊 **RECOVERABLE**: All data preserved in backup table  
**Safety**: High risk but mitigated by backup

### Step 9: 🟢 SAFE - Avatar System Restoration
**File**: `20250723181204_restore_avatar_columns.sql`  
**Purpose**: Restores avatar columns to agents table  
**Data Impact**: 
- ✅ **ADDED**: `avatar` and `avatar_color` columns
- 🔄 **MIGRATED**: Data from JSON metadata to dedicated columns
- 📊 **NO DATA LOSS**: Additive migration  
**Safety**: Safe - additive with data preservation

### Step 10: 🔴 HIGH RISK - Device/Recording Cleanup
**File**: `20250726174310_rem-devices-tables-responses_col.sql`  
**Purpose**: Removes unused device and recording features  
**Data Impact**: 
- ⚠️ **NO BACKUP CREATED**
- ❌ **PERMANENTLY DELETED**: `recordings` table, `devices` table, `agent_runs.responses` column
- 🚫 **NO RECOVERY**: Data cannot be recovered
- 📝 **RATIONALE**: Unused/deprecated features  
**Safety**: High risk - permanent data loss for unused features

### Step 11: 🔴 HIGH RISK - Old Workflow System Removal
**File**: `20250726180605_remove_old_workflow_sys.sql`  
**Purpose**: Removes deprecated workflow execution system  
**Data Impact**: 
- ⚠️ **NO BACKUP CREATED**
- ❌ **PERMANENTLY DELETED**: `workflow_step_executions`, `workflow_executions`, `workflow_steps` tables
- ❌ **PERMANENTLY DELETED**: Related enums and indexes
- 🔄 **SYSTEM REPLACEMENT**: New workflow system replaces functionality
- 🚫 **NO RECOVERY**: Historical execution data lost  
**Safety**: High risk - loses old workflow history (replaced by new system)

### Step 12: 🔴 HIGH RISK - Knowledge Base Cleanup
**File**: `20250726184725_cleanup_schema_1.sql`  
**Purpose**: Removes unused knowledge base and trigger features  
**Data Impact**: 
- ⚠️ **NO BACKUP CREATED**
- ❌ **PERMANENTLY DELETED**: `knowledge_base_usage_log`, `knowledge_base_entries`, `trigger_events`, `custom_trigger_providers`
- 🚫 **NO RECOVERY**: Data cannot be recovered
- 📝 **RATIONALE**: Unused features  
**Safety**: High risk - permanent data loss for unused features

### Step 13: 🔴 HIGH RISK - Thread-Agent Decoupling
**File**: `20250726200404_remove_agent_cols_from_threads.sql`  
**Purpose**: Makes threads agent-agnostic  
**Data Impact**: 
- ⚠️ **NO BACKUP CREATED**
- ❌ **PERMANENTLY DELETED**: `agent_id` and `agent_version_id` columns from threads
- 🔄 **ARCHITECTURE CHANGE**: Moves to per-message agent tracking
- 🚫 **NO RECOVERY**: Thread-agent associations lost  
**Safety**: High risk - loses thread-agent relationship history

### Step 14: 🟡 MEDIUM RISK - Agent Fields to Metadata
**File**: `20250726223759_move_agent_fields_to_metadata.sql`  
**Purpose**: Moves agent fields from columns to JSON metadata  
**Data Impact**: 
- 🔄 **MIGRATED**: `agent_id` and `agent_version_id` to JSON metadata
- ❌ **DELETED**: Original columns after migration
- ℹ️ **REVERSIBLE**: Next migration reverses this change
- 📊 **NO DATA LOSS**: All data preserved in JSON format  
**Safety**: Medium risk - data transformation, but reversible

### Step 15: 🟡 MEDIUM RISK - Reverse Agent Fields Migration
**File**: `20250726224819_reverse_move_agent_fields_to_metadata.sql`  
**Purpose**: Reverses previous migration  
**Data Impact**: 
- ➕ **RESTORED**: `agent_id` and `agent_version_id` columns
- 🔄 **MIGRATED**: Data from JSON back to dedicated columns
- ❌ **REMOVED**: Agent fields from metadata JSON
- ℹ️ **RESTORATION**: Restores state from before Step 14  
**Safety**: Medium risk - reverses previous migration

### Step 16: 🟢 SAFE - Template Config Migration
**File**: `20250728193819_fix_templates.sql`  
**Purpose**: Migrates agent templates to unified config structure  
**Data Impact**: 
- ✅ **BACKUP CREATED**: `agent_templates_backup`
- 🔄 **MIGRATED**: Multiple columns to unified `config` JSON
- ❌ **DELETED**: Original columns after migration
- 🛡️ **SANITIZED**: Config data cleaned during migration
- 📊 **RECOVERABLE**: All data preserved in backup  
**Safety**: Safe - creates backup, well-structured migration

### Step 17: 🔴 HIGH RISK - Final Agent Cleanup
**File**: `20250729094718_cleanup_agents_table.sql`  
**Purpose**: Final cleanup of agents table deprecated columns  
**Data Impact**: 
- ✅ **BACKUP CREATED**: `agents_backup_cleanup_20250729`
- ❌ **PERMANENTLY DELETED**: `marketplace_published_at`, `download_count`, `config` columns
- 📊 **RECOVERABLE**: All data preserved in backup table
- ℹ️ **FINAL CLEANUP**: Completes agent table modernization  
**Safety**: High risk but mitigated by backup

### Step 18: 🟢 SAFE - AgentPress Tools Sanitization
**File**: `20250729105030_fix_agentpress_tools_sanitization.sql`  
**Purpose**: Creates function to sanitize AgentPress tools config  
**Data Impact**: ✅ Creates temporary sanitization function  
**Safety**: Safe - utility function creation

### Step 19: 🟢 SAFE - Pipedream MCP Name Fixes
**File**: `20250729110000_fix_pipedream_qualified_names.sql`  
**Purpose**: Fixes qualified names for Pipedream MCP configurations  
**Data Impact**: 
- 🔄 **UPDATED**: Pipedream MCP qualified names in agent configs
- 🛡️ **SANITIZED**: Ensures consistent naming conventions  
**Safety**: Safe - data sanitization with self-cleanup

### Step 20: 🟢 SAFE - API Keys System
**File**: `20250729120000_api_keys.sql`  
**Purpose**: Creates API keys authentication system  
**Data Impact**: 
- ✅ **CREATED**: `api_keys` table with RLS policies
- ✅ **CREATED**: `api_key_status` enum
- ✅ **ADDED**: Authentication infrastructure  
**Safety**: Safe - creates new authentication system

---

## 🚨 Critical Risk Assessment

### 🔴 HIGH RISK MIGRATIONS (6 total)
**Steps 8, 10, 11, 12, 13, 17**

**Mitigation Strategies**:
- Steps 8, 16, 17: ✅ Backup tables created before destructive operations
- Steps 10, 11, 12, 13: ⚠️ No backups - permanent deletion of unused features
- **Recommendation**: Verify these features are truly unused before proceeding

### 🟡 MEDIUM RISK MIGRATIONS (2 total)
**Steps 14, 15**

**Characteristics**:
- Reversible data transformations
- Step 15 reverses Step 14
- All data preserved through transformation process

### 🟢 SAFE MIGRATIONS (13 total)
**Steps 0, 1, 2, 3, 4, 5, 6, 7, 9, 16, 18, 19, 20**

**Characteristics**:
- Additive operations (new tables, columns, functions)
- Constraint modifications
- Policy updates
- Data sanitization

---

## 📊 Data Movement Summary

### ✅ Data Backups Created
1. **Step 8**: `agents_backup_cleanup_20250729` - before agent column cleanup
2. **Step 16**: `agent_templates_backup` - before template config migration  
3. **Step 17**: `agents_backup_cleanup_20250729` - before final agent cleanup

### 🔄 Data Migrations (Preserved)
1. **Step 0**: Existing credentials → `user_mcp_credential_profiles`
2. **Step 9**: JSON avatar data → dedicated columns (additive)
3. **Step 14**: Agent columns → JSON metadata (reversible)
4. **Step 15**: JSON metadata → agent columns (reverses Step 14)
5. **Step 16**: Template columns → unified JSON config (with backup)
6. **Step 19**: Pipedream MCP name standardization

### ❌ Permanent Data Deletions
1. **Step 10**: `recordings`, `devices` tables + `agent_runs.responses`
2. **Step 11**: Old workflow execution tables and history
3. **Step 12**: Knowledge base and trigger system tables
4. **Step 13**: Thread-agent association columns

---

## 🎯 Execution Strategy

### Pre-Migration Checklist
- [ ] **BACKUP DATABASE** - Full database backup before starting
- [ ] **Verify unused features** - Confirm Steps 10-13 delete truly unused data
- [ ] **Test environment** - Run migrations on staging first if possible
- [ ] **Application downtime** - Plan for potential service interruption

### Execution Approach
1. **Run all 21 migrations in sequence** - Supabase will skip already-applied ones
2. **Monitor after high-risk steps** - Verify data integrity after Steps 8, 10, 11, 12, 13, 17
3. **Test application** - Verify functionality after Steps 8, 14, 15, 17
4. **Keep backup tables** - Don't drop backup tables until system is verified stable

### Recovery Plan
- **Steps 8, 16, 17**: Data can be recovered from backup tables
- **Steps 10, 11, 12, 13**: No recovery possible - permanent deletion
- **Steps 14, 15**: Reversible transformations
- **All other steps**: Safe operations with no data loss

---

## ✅ Final Recommendations

1. **BACKUP FIRST** - Create full database backup before starting
2. **Verify unused features** - Double-check that deleted features are truly unused
3. **Run in sequence** - Execute all 21 migrations in chronological order
4. **Monitor closely** - Watch for errors during high-risk migrations
5. **Test thoroughly** - Verify application functionality after completion
6. **Keep backups** - Retain backup tables until system is verified stable

**This migration sequence will modernize your database architecture while preserving all critical data.** The permanent deletions only affect unused/deprecated features, and all active data is safely migrated or backed up.
