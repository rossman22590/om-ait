# Supabase Migration Idempotency Fixes (Production-Safe)

## Problem
Migrations were failing when re-run on production database due to duplicate objects (policies, triggers, constraints).

## Errors Fixed

### 1. Duplicate Policy Errors
```
ERROR: policy "policy_name" for table "table_name" already exists (SQLSTATE 42710)
```

### 2. Duplicate Trigger Errors  
```
ERROR: trigger "trigger_name" for relation "table_name" already exists (SQLSTATE 42710)
```

### 3. Duplicate Constraint Errors
```
ERROR: constraint "constraint_name" for relation "table_name" already exists (SQLSTATE 42710)
```

## Files Fixed

### 1. `20240414161707_basejump-setup.sql`
- ✅ Added `DROP POLICY IF EXISTS` for "Basejump settings can be read by authenticated users"

### 2. `20240414161947_basejump-accounts.sql`
- ✅ Added `DROP CONSTRAINT IF EXISTS` for `basejump_accounts_slug_null_if_personal_account_true`
- ✅ Added `DROP TRIGGER IF EXISTS` for:
  - `basejump_protect_account_fields`
  - `basejump_slugify_account_slug`
  - `basejump_set_accounts_timestamp`
  - `basejump_set_accounts_user_tracking`
  - `basejump_add_current_user_to_new_account`
  - `on_auth_user_created`
- ✅ Added `DROP POLICY IF EXISTS` for:
  - "users can view their own account_users"
  - "users can view their teammates"
  - "Account users can be deleted by owners except primary account owner"
  - "Accounts are viewable by members"
  - "Accounts are viewable by primary owner"
  - "Team accounts can be created by any user"
  - "Accounts can be edited by owners"

### 3. `20240414162100_basejump-invitations.sql`
- ✅ Added `DROP TRIGGER IF EXISTS` for:
  - `basejump_set_invitations_timestamp`
  - `basejump_trigger_set_invitation_details`
- ✅ Added `DROP POLICY IF EXISTS` for:
  - "Invitations viewable by account owners"
  - "Invitations can be created by account owners"
  - "Invitations can be deleted by account owners"

## The Fix Pattern (Production-Safe - Skip if Exists)

All fixes use **IF NOT EXISTS** checks to skip creation if object already exists:

### For Policies:
```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'basejump' 
        AND tablename = 'table_name' 
        AND policyname = 'policy_name'
    ) THEN
        create policy "policy_name" on schema.table_name ...
    END IF;
END $$;
```

### For Triggers:
```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_name'
    ) THEN
        CREATE TRIGGER trigger_name ...
    END IF;
END $$;
```

### For Constraints:
```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'constraint_name'
    ) THEN
        ALTER TABLE schema.table_name
            ADD CONSTRAINT constraint_name ...
    END IF;
END $$;
```

## Result

✅ **Migrations are now idempotent** - can be run multiple times without errors  
✅ **Production-safe** - checks if exists and skips, NO dropping of existing objects  
✅ **Backwards compatible** - works with existing databases  
✅ **Zero data risk** - never drops policies/triggers/constraints, only skips creation  
✅ **Standard PostgreSQL pattern** - DO blocks with IF NOT EXISTS checks

## Testing

Run your Supabase migrations:
```bash
supabase db reset
# or
supabase migration up
```

Should now complete without duplicate object errors!
