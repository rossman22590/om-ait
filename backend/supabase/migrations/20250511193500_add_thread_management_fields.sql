-- Add thread management fields
ALTER TABLE threads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS active_duration INTEGER DEFAULT 0;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;

-- Add index for better performance on thread duration queries
CREATE INDEX IF NOT EXISTS idx_threads_active_duration ON threads(active_duration);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at timestamp on threads
DROP TRIGGER IF EXISTS set_threads_updated_at ON threads;
CREATE TRIGGER set_threads_updated_at
BEFORE UPDATE ON threads
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
