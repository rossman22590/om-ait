BEGIN;

-- Drop the file processing jobs table
DROP TABLE IF EXISTS agent_kb_file_processing_jobs CASCADE;

-- Drop the functions
DROP FUNCTION IF EXISTS get_agent_kb_processing_jobs(UUID, INTEGER);
DROP FUNCTION IF EXISTS create_agent_kb_processing_job(UUID, UUID, VARCHAR(50), JSONB);
DROP FUNCTION IF EXISTS update_agent_kb_job_status(UUID, VARCHAR(50), JSONB, INTEGER, INTEGER, TEXT);

-- Remove the new columns from agent_knowledge_base_entries
ALTER TABLE agent_knowledge_base_entries 
DROP COLUMN IF EXISTS source_type,
DROP COLUMN IF EXISTS source_metadata,
DROP COLUMN IF EXISTS file_path,
DROP COLUMN IF EXISTS file_size,
DROP COLUMN IF EXISTS file_mime_type,
DROP COLUMN IF EXISTS extracted_from_zip_id;

-- Drop the indexes
DROP INDEX IF EXISTS idx_agent_kb_entries_source_type;
DROP INDEX IF EXISTS idx_agent_kb_entries_extracted_from_zip;
DROP INDEX IF EXISTS idx_agent_kb_jobs_agent_id;
DROP INDEX IF EXISTS idx_agent_kb_jobs_status;
DROP INDEX IF EXISTS idx_agent_kb_jobs_created_at;

COMMIT; 