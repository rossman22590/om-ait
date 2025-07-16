BEGIN;

-- This rollback is complex because the migration consolidated data into JSONB
-- and dropped multiple tables. Some data loss is inevitable.

-- Recreate dropped tables (basic structure - data will be lost)
CREATE TABLE IF NOT EXISTS workflow_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID,
    name VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    schedule VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID,
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credential_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_agent_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    agent_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_mcp_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    provider VARCHAR(255),
    credentials JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID,
    version_number INTEGER,
    changes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate types
CREATE TYPE IF NOT EXISTS connection_type AS ENUM ('input', 'output');
CREATE TYPE IF NOT EXISTS node_type AS ENUM ('start', 'end', 'process');
CREATE TYPE IF NOT EXISTS trigger_type AS ENUM ('manual', 'scheduled', 'webhook');
CREATE TYPE IF NOT EXISTS execution_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE IF NOT EXISTS workflow_status AS ENUM ('draft', 'active', 'paused');

-- Attempt to restore original columns from config JSONB
-- WARNING: This will only work if config data exists and is properly structured

-- Restore agents columns
ALTER TABLE agents ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS configured_mcps JSONB;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS agentpress_tools JSONB;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS custom_mcps JSONB;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_color TEXT;

-- Attempt to restore data from config
UPDATE agents 
SET 
    system_prompt = config->>'system_prompt',
    configured_mcps = config->'tools'->'mcp',
    agentpress_tools = config->'tools'->'agentpress',
    custom_mcps = config->'tools'->'custom_mcp',
    avatar = config->'metadata'->>'avatar',
    avatar_color = config->'metadata'->>'avatar_color'
WHERE config IS NOT NULL AND config != '{}'::jsonb;

-- Restore agent_versions columns
ALTER TABLE agent_versions ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE agent_versions ADD COLUMN IF NOT EXISTS configured_mcps JSONB;
ALTER TABLE agent_versions ADD COLUMN IF NOT EXISTS agentpress_tools JSONB;
ALTER TABLE agent_versions ADD COLUMN IF NOT EXISTS custom_mcps JSONB;

-- Attempt to restore data from config
UPDATE agent_versions 
SET 
    system_prompt = config->>'system_prompt',
    configured_mcps = config->'tools'->'mcp',
    agentpress_tools = config->'tools'->'agentpress',
    custom_mcps = config->'tools'->'custom_mcp'
WHERE config IS NOT NULL AND config != '{}'::jsonb;

-- Remove config columns
ALTER TABLE agents DROP COLUMN IF EXISTS config;
ALTER TABLE agent_versions DROP COLUMN IF EXISTS config;

-- Remove added columns
ALTER TABLE agent_versions DROP COLUMN IF EXISTS change_description;
ALTER TABLE agent_versions DROP COLUMN IF EXISTS previous_version_id;
ALTER TABLE agent_triggers DROP COLUMN IF EXISTS execution_type;
ALTER TABLE agent_triggers DROP COLUMN IF EXISTS workflow_id;
ALTER TABLE trigger_events DROP COLUMN IF EXISTS workflow_execution_id;

-- Drop function
DROP FUNCTION IF EXISTS get_agent_config(UUID);

-- Remove comments
COMMENT ON COLUMN agents.system_prompt IS NULL;
COMMENT ON COLUMN agents.configured_mcps IS NULL;
COMMENT ON COLUMN agents.agentpress_tools IS NULL;
COMMENT ON COLUMN agents.custom_mcps IS NULL;
COMMENT ON COLUMN agents.avatar IS NULL;
COMMENT ON COLUMN agents.avatar_color IS NULL;

COMMENT ON COLUMN agent_versions.system_prompt IS NULL;
COMMENT ON COLUMN agent_versions.configured_mcps IS NULL;
COMMENT ON COLUMN agent_versions.agentpress_tools IS NULL;
COMMENT ON COLUMN agent_versions.custom_mcps IS NULL;

COMMENT ON TABLE agent_workflows IS NULL;
COMMENT ON TABLE workflow_steps IS NULL;
COMMENT ON TABLE workflow_executions IS NULL;
COMMENT ON TABLE workflow_step_executions IS NULL;

COMMENT ON COLUMN agents.is_default IS NULL;
COMMENT ON COLUMN agent_triggers.execution_type IS NULL;

COMMIT; 