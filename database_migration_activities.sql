-- Migration to add activity support to jobs
-- Run this script in your Supabase database

-- Add activity_id column to fc_jobs
ALTER TABLE fc_jobs
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES fc_activities(id) ON DELETE SET NULL;

-- Add address column to fc_jobs (for custom job addresses different from client address)
ALTER TABLE fc_jobs
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_fc_jobs_activity_id ON fc_jobs(activity_id);

-- Comments for documentation
COMMENT ON COLUMN fc_jobs.activity_id IS 'Reference to the activity/service type for this job';
COMMENT ON COLUMN fc_jobs.address IS 'Custom address for the job (overrides client address if set)';
