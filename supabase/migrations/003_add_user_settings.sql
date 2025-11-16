-- Migration: Add user settings table
-- Description: Store user preferences including language, timezone, theme, and notifications

-- Create user settings table
CREATE TABLE IF NOT EXISTS fc_user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES fc_companies(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  theme TEXT NOT NULL DEFAULT 'dark',
  notifications JSONB DEFAULT '{"email": true, "push": false, "jobReminders": true, "clientUpdates": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure user belongs to company
  CONSTRAINT fk_user_company FOREIGN KEY (company_id) REFERENCES fc_companies(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_user_settings_user_id ON fc_user_settings(user_id);
CREATE INDEX idx_user_settings_company_id ON fc_user_settings(company_id);

-- Enable RLS
ALTER TABLE fc_user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own settings"
  ON fc_user_settings FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own settings"
  ON fc_user_settings FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own settings"
  ON fc_user_settings FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON fc_user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();
