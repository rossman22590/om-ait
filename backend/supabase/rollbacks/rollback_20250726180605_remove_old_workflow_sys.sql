-- ROLLBACK: 20250726180605_remove_old_workflow_sys.sql
-- WARNING: This rollback cannot restore the dropped data!
-- The old workflow tables were permanently deleted.

BEGIN;

-- WARNING: DATA LOSS OCCURRED - CANNOT BE FULLY ROLLED BACK
-- This migration permanently deleted:
-- - workflow_step_executions table
-- - workflow_executions table
-- - workflow_steps table
-- - workflow_step_type enum
-- - workflow_execution_status enum

-- We can recreate the structures, but the data is permanently lost

-- Recreate enums
CREATE TYPE workflow_step_type AS ENUM ('action', 'condition', 'instruction');
CREATE TYPE workflow_execution_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- Recreate workflow_steps table structure (data will be empty)
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID, -- Foreign key reference may need adjustment
    step_order INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type workflow_step_type NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate workflow_executions table structure (data will be empty)
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID, -- Foreign key reference may need adjustment
    agent_id UUID, -- Foreign key reference may need adjustment
    thread_id UUID,
    triggered_by VARCHAR(255),
    status workflow_execution_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds FLOAT,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate workflow_step_executions table structure (data will be empty)
CREATE TABLE IF NOT EXISTS workflow_step_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    status workflow_execution_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds FLOAT,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: This rollback only restores table structures, not data
-- Manual data restoration from backup is required if data recovery is needed

COMMIT;
