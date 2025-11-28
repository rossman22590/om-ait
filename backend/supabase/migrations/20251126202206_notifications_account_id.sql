ALTER TABLE notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;
ALTER TABLE notification_settings DROP CONSTRAINT IF EXISTS notification_settings_pkey;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notification_settings' AND column_name='user_id'
    ) THEN
        EXECUTE 'ALTER TABLE notification_settings RENAME COLUMN user_id TO account_id';
    END IF;
END $$;

ALTER TABLE notification_settings ADD PRIMARY KEY (account_id);
ALTER TABLE notification_settings DROP CONSTRAINT IF EXISTS notification_settings_account_id_fkey;
ALTER TABLE notification_settings ADD CONSTRAINT notification_settings_account_id_fkey 
    FOREIGN KEY (account_id) REFERENCES basejump.accounts(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Users can manage own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Account members can manage notification settings" ON notification_settings;
CREATE POLICY "Account members can manage notification settings"
    ON notification_settings FOR ALL
    USING (basejump.has_role_on_account(account_id));

ALTER TABLE device_tokens DROP CONSTRAINT IF EXISTS device_tokens_user_id_fkey;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='device_tokens' AND column_name='user_id'
    ) THEN
        EXECUTE 'ALTER TABLE device_tokens RENAME COLUMN user_id TO account_id';
    END IF;
END $$;

ALTER TABLE device_tokens DROP CONSTRAINT IF EXISTS device_tokens_user_id_device_token_key;
ALTER TABLE device_tokens DROP CONSTRAINT IF EXISTS device_tokens_account_id_device_token_key;
ALTER TABLE device_tokens ADD CONSTRAINT device_tokens_account_id_device_token_key 
    UNIQUE(account_id, device_token);

ALTER TABLE device_tokens DROP CONSTRAINT IF EXISTS device_tokens_account_id_fkey;
ALTER TABLE device_tokens ADD CONSTRAINT device_tokens_account_id_fkey 
    FOREIGN KEY (account_id) REFERENCES basejump.accounts(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_device_tokens_user_id;
CREATE INDEX IF NOT EXISTS idx_device_tokens_account_id ON device_tokens(account_id);

DROP INDEX IF EXISTS idx_device_tokens_active;
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(account_id, is_active) WHERE is_active = true;

DROP POLICY IF EXISTS "Users can manage own device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Account members can manage device tokens" ON device_tokens;
CREATE POLICY "Account members can manage device tokens"
    ON device_tokens FOR ALL
    USING (basejump.has_role_on_account(account_id));
