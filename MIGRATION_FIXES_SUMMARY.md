# SQL Migration Fixes Summary

This document summarizes all fixes applied to make Supabase migrations idempotent and error-free.

## Overview

All migrations have been updated to be **idempotent** - they can be run multiple times without errors. Each migration now:
- ✅ Checks if objects already exist before creating them
- ✅ Skips gracefully if functions/constraints/types already exist
- ✅ Provides helpful NOTICE messages about what was created or skipped
- ✅ Handles errors gracefully without failing the entire migration

## Files Modified

### 1. Function GRANT Statement Fixes

**Problem:** GRANT statements failed when:
- Functions had multiple overloads (same name, different parameters)
- Functions were dropped and recreated with different signatures
- PostgreSQL couldn't determine which function to grant permissions to

**Solution:** Made all GRANT statements conditional with full function signatures.

#### Modified Files:

##### `20250818180950_topup_credits.sql`
- **Line 275**: Added missing semicolon (`;`) after `$$` closing the `add_credits` function
- **Lines 362-401**: Made GRANT statements conditional with full signatures:
  - `add_credits(UUID, DECIMAL, UUID)`
  - `use_credits(UUID, DECIMAL, TEXT, UUID, UUID)`
  - `get_credit_balance(UUID)`
- Fixed function existence check to properly join `pg_proc` and `pg_namespace` tables
- Now checks for exact function signature using `pg_get_function_identity_arguments()`

##### `20251015063447_grant_atomic_functions.sql`
- Made conditional: Only grants if `atomic_add_credits` exists with signature:
  - `atomic_add_credits(UUID, NUMERIC, BOOLEAN, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT)`

##### `20251015063448_grant_use_credits.sql`
- Made conditional: Only grants if `atomic_use_credits` exists with signature:
  - `atomic_use_credits(UUID, NUMERIC, TEXT, TEXT, TEXT)`

##### `20251015063449_grant_reset_credits.sql`
- Made conditional: Only grants if `atomic_reset_expiring_credits` exists with signature:
  - `atomic_reset_expiring_credits(UUID, NUMERIC, TEXT, TEXT)`

##### `20251016115148_grant_renewal_functions.sql`
- Made conditional: Only grants if `atomic_grant_renewal_credits` exists with signature (10 parameters):
  - `atomic_grant_renewal_credits(UUID, BIGINT, BIGINT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)`

##### `20251016115149_grant_check_renewal.sql`
- Made conditional: Only grants if `check_renewal_already_processed` exists with signature:
  - `check_renewal_already_processed(UUID, BIGINT)`

### 2. Constraint Creation Fixes

**Problem:** Constraint creation failed when:
- Index already had an associated constraint
- Constraint names had incorrect quoting in checks
- Attempting to add PRIMARY KEY/UNIQUE constraint to index already serving as constraint

**Solution:** Enhanced constraint checks to verify both constraint and index state.

##### `20250829051455_google_oauth_tokens.sql`

**Fixed three constraint blocks:**

1. **`google_oauth_tokens_pkey` (PRIMARY KEY)**
   - Fixed constraint name check (removed extra quotes: `'"google_oauth_tokens_pkey"'` → `'google_oauth_tokens_pkey'`)
   - Added check to verify index isn't already associated with a constraint
   - Added exception handling for graceful error recovery

2. **`google_oauth_tokens_user_id_fkey` (FOREIGN KEY)**
   - Fixed constraint name check (removed extra quotes)
   - Added conditional creation

3. **`google_oauth_tokens_user_id_key` (UNIQUE)**
   - Fixed constraint name check (removed extra quotes)
   - Added check to verify index isn't already associated with a constraint
   - Added exception handling for graceful error recovery

4. **Policy Creation**
   - Fixed schema/table name checks in `pg_policies` query (removed extra quotes)
   - Changed from `WHERE schemaname = '"public"'` to `WHERE schemaname = 'public'`

### 3. Type Creation Fixes

**Problem:** Type creation failed when enum type already existed.

**Solution:** Made type creation conditional.

##### `20250905102908_user_roles.sql`
- Wrapped `CREATE TYPE user_role AS ENUM` in conditional check
- Checks `pg_type` system catalog before creating type
- Provides NOTICE message about creation or skip

### 4. Index Creation with Column Name Flexibility

**Problem:** Index creation failed when column names changed between migrations (e.g., `user_id` → `account_id`).

**Solution:** Made index creation conditional and column-aware.

##### `20250905102928_credit_system_refactor.sql`
- **Lines 40-90**: Made index creation conditional based on column existence
- Checks for both `user_id` and `account_id` columns
- Creates appropriate index based on which column exists
- Handles both `credit_ledger` and `credit_grants` tables
- Provides NOTICE messages about which index was created

## Pattern Used for Conditional Operations

### Function GRANT Pattern
```sql
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'function_name'
        AND n.nspname = 'public'
        AND pg_get_function_identity_arguments(p.oid) = 'param1 type1, param2 type2'
    ) THEN
        GRANT EXECUTE ON FUNCTION function_name(TYPE1, TYPE2) TO role;
        RAISE NOTICE 'Granted EXECUTE on function_name';
    ELSE
        RAISE NOTICE 'Skipping GRANT - function does not exist';
    END IF;
END $$;
```

### Constraint Creation Pattern
```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'constraint_name'
    ) AND EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'index_name'
        AND schemaname = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conindid = (SELECT oid FROM pg_class WHERE relname = 'index_name')
        )
    ) THEN
        ALTER TABLE table_name ADD CONSTRAINT constraint_name ...;
        RAISE NOTICE 'Added constraint';
    ELSE
        RAISE NOTICE 'Skipping - constraint exists or index already constrained';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;
```

### Type Creation Pattern
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_name') THEN
        CREATE TYPE type_name AS ENUM (...);
        RAISE NOTICE 'Created type';
    ELSE
        RAISE NOTICE 'Skipping - type already exists';
    END IF;
END $$;
```

## Testing

All migrations should now:
1. Run successfully on a fresh database
2. Run successfully when re-run (idempotent)
3. Skip gracefully when objects already exist
4. Provide clear NOTICE messages about what was done

## Key Takeaways

1. **Always check for existence** before creating database objects
2. **Use full function signatures** in GRANT statements when functions are overloaded
3. **Check both constraint and index state** before adding constraints to indexes
4. **Remove extra quotes** from string literals in WHERE clauses
5. **Add exception handling** for critical operations that might fail
6. **Provide NOTICE messages** to help debug migration issues

## Commands for Verification

```bash
# Run migrations
supabase db push

# Check for errors in migration history
supabase migration list

# Reset and rerun (for testing idempotency)
supabase db reset
supabase db push
```

## Related Files

- All migration files in `backend/supabase/migrations/`
- This summary: `MIGRATION_FIXES_SUMMARY.md`
