-- Rollback: Restore FK constraints that were removed to fix Supabase replication lag issues
-- Only run this if you need to restore the original FK behavior

-- Restore messages -> threads FK with CASCADE delete
ALTER TABLE messages
ADD CONSTRAINT messages_thread_id_fkey
FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE;

-- Restore credit_usage -> threads FK with SET NULL on delete
ALTER TABLE credit_usage
ADD CONSTRAINT credit_usage_thread_id_fkey
FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE SET NULL;

-- Note: If you restore these FKs, you may experience the same replication lag errors.
-- Only restore if you've switched to Supabase direct connection (not pooler) or resolved the lag issue.
