-- Fix for 20250416133920_agentpress_schema.sql policies
-- Add this section to replace all CREATE POLICY statements

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
    -- Project policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'project_select_policy') THEN
        CREATE POLICY project_select_policy ON projects
            FOR SELECT
            USING (
                is_public = TRUE OR
                basejump.has_role_on_account(account_id) = true
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'project_insert_policy') THEN
        CREATE POLICY project_insert_policy ON projects
            FOR INSERT
            WITH CHECK (basejump.has_role_on_account(account_id) = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'project_update_policy') THEN
        CREATE POLICY project_update_policy ON projects
            FOR UPDATE
            USING (basejump.has_role_on_account(account_id) = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'project_delete_policy') THEN
        CREATE POLICY project_delete_policy ON projects
            FOR DELETE
            USING (basejump.has_role_on_account(account_id) = true);
    END IF;

    -- Thread policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'threads' AND policyname = 'thread_select_policy') THEN
        CREATE POLICY thread_select_policy ON threads
            FOR SELECT
            USING (
                basejump.has_role_on_account(account_id) = true OR 
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.project_id = threads.project_id
                    AND (
                        projects.is_public = TRUE OR
                        basejump.has_role_on_account(projects.account_id) = true
                    )
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'threads' AND policyname = 'thread_insert_policy') THEN
        CREATE POLICY thread_insert_policy ON threads
            FOR INSERT
            WITH CHECK (
                basejump.has_role_on_account(account_id) = true OR 
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.project_id = threads.project_id
                    AND basejump.has_role_on_account(projects.account_id) = true
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'threads' AND policyname = 'thread_update_policy') THEN
        CREATE POLICY thread_update_policy ON threads
            FOR UPDATE
            USING (
                basejump.has_role_on_account(account_id) = true OR 
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.project_id = threads.project_id
                    AND basejump.has_role_on_account(projects.account_id) = true
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'threads' AND policyname = 'thread_delete_policy') THEN
        CREATE POLICY thread_delete_policy ON threads
            FOR DELETE
            USING (
                basejump.has_role_on_account(account_id) = true OR 
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.project_id = threads.project_id
                    AND basejump.has_role_on_account(projects.account_id) = true
                )
            );
    END IF;

    -- Agent run policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_runs' AND policyname = 'agent_run_select_policy') THEN
        CREATE POLICY agent_run_select_policy ON agent_runs
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM threads
                    LEFT JOIN projects ON threads.project_id = projects.project_id
                    WHERE threads.thread_id = agent_runs.thread_id
                    AND (
                        projects.is_public = TRUE OR
                        basejump.has_role_on_account(threads.account_id) = true OR 
                        basejump.has_role_on_account(projects.account_id) = true
                    )
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_runs' AND policyname = 'agent_run_insert_policy') THEN
        CREATE POLICY agent_run_insert_policy ON agent_runs
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM threads
                    LEFT JOIN projects ON threads.project_id = projects.project_id
                    WHERE threads.thread_id = agent_runs.thread_id
                    AND (
                        basejump.has_role_on_account(threads.account_id) = true OR 
                        basejump.has_role_on_account(projects.account_id) = true
                    )
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_runs' AND policyname = 'agent_run_update_policy') THEN
        CREATE POLICY agent_run_update_policy ON agent_runs
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM threads
                    LEFT JOIN projects ON threads.project_id = projects.project_id
                    WHERE threads.thread_id = agent_runs.thread_id
                    AND (
                        basejump.has_role_on_account(threads.account_id) = true OR 
                        basejump.has_role_on_account(projects.account_id) = true
                    )
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_runs' AND policyname = 'agent_run_delete_policy') THEN
        CREATE POLICY agent_run_delete_policy ON agent_runs
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM threads
                    LEFT JOIN projects ON threads.project_id = projects.project_id
                    WHERE threads.thread_id = agent_runs.thread_id
                    AND (
                        basejump.has_role_on_account(threads.account_id) = true OR 
                        basejump.has_role_on_account(projects.account_id) = true
                    )
                )
            );
    END IF;

    -- Message policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'message_select_policy') THEN
        CREATE POLICY message_select_policy ON messages
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM threads
                    LEFT JOIN projects ON threads.project_id = projects.project_id
                    WHERE threads.thread_id = messages.thread_id
                    AND (
                        projects.is_public = TRUE OR
                        basejump.has_role_on_account(threads.account_id) = true OR 
                        basejump.has_role_on_account(projects.account_id) = true
                    )
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'message_insert_policy') THEN
        CREATE POLICY message_insert_policy ON messages
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM threads
                    LEFT JOIN projects ON threads.project_id = projects.project_id
                    WHERE threads.thread_id = messages.thread_id
                    AND (
                        basejump.has_role_on_account(threads.account_id) = true OR 
                        basejump.has_role_on_account(projects.account_id) = true
                    )
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'message_update_policy') THEN
        CREATE POLICY message_update_policy ON messages
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM threads
                    LEFT JOIN projects ON threads.project_id = projects.project_id
                    WHERE threads.thread_id = messages.thread_id
                    AND (
                        basejump.has_role_on_account(threads.account_id) = true OR 
                        basejump.has_role_on_account(projects.account_id) = true
                    )
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'message_delete_policy') THEN
        CREATE POLICY message_delete_policy ON messages
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM threads
                    LEFT JOIN projects ON threads.project_id = projects.project_id
                    WHERE threads.thread_id = messages.thread_id
                    AND (
                        basejump.has_role_on_account(threads.account_id) = true OR 
                        basejump.has_role_on_account(projects.account_id) = true
                    )
                )
            );
    END IF;
END $$;
