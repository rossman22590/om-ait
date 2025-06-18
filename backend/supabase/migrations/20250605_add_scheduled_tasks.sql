-- migrations/20250605_add_scheduled_tasks.sql

BEGIN;

-- Scheduled Tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(agent_id),
    thread_id UUID REFERENCES threads(thread_id),
    project_id UUID REFERENCES projects(project_id),
    created_by UUID REFERENCES basejump.accounts(id),
    prompt TEXT,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('hourly', 'daily', 'weekly', 'monthly')),
    days_of_week INT[] NULL, -- Only for weekly (0=Sunday)
    time_of_day TIME NULL,   -- Time to run (UTC)
    next_run_at TIMESTAMPTZ NOT NULL,
    last_run_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_account_id ON scheduled_tasks(account_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run_at ON scheduled_tasks(next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_is_active ON scheduled_tasks(is_active);

-- Scheduled Task Runs table
CREATE TABLE IF NOT EXISTS scheduled_task_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
    agent_run_id UUID REFERENCES agent_runs(id),
    thread_id UUID REFERENCES threads(thread_id),
    task_run_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'running', 'completed', 'failed', 'triggered')),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_task_runs_scheduled_task_id ON scheduled_task_runs(scheduled_task_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_task_runs_status ON scheduled_task_runs(status);

-- RLS: Only allow account owners to access their scheduled tasks/runs
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_task_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scheduled_tasks_select ON scheduled_tasks;
CREATE POLICY scheduled_tasks_select ON scheduled_tasks
    FOR SELECT USING (account_id = auth.uid());

DROP POLICY IF EXISTS scheduled_tasks_modify ON scheduled_tasks;
CREATE POLICY scheduled_tasks_modify ON scheduled_tasks
    FOR ALL USING (account_id = auth.uid());

DROP POLICY IF EXISTS scheduled_task_runs_select ON scheduled_task_runs;
CREATE POLICY scheduled_task_runs_select ON scheduled_task_runs
    FOR SELECT USING (
        scheduled_task_id IN (
            SELECT id FROM scheduled_tasks WHERE account_id = auth.uid()
        )
    );


    ALTER TABLE public.scheduled_tasks
    ADD COLUMN IF NOT EXISTS minute_of_hour INTEGER CHECK (minute_of_hour >= 0 AND minute_of_hour <= 59),
    ADD COLUMN IF NOT EXISTS day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31);

    COMMENT ON COLUMN public.scheduled_tasks.minute_of_hour IS 'Minute of the hour (0-59) for the task to run.';
    COMMENT ON COLUMN public.scheduled_tasks.day_of_month IS 'Day of the month (1-31) for monthly tasks.';

    ALTER TABLE public.scheduled_tasks
ADD COLUMN IF NOT EXISTS model_name TEXT;

COMMENT ON COLUMN public.scheduled_tasks.model_name IS 'The specific LLM model name to be used for this scheduled task.';

COMMIT;
