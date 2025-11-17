-- ============================================================================
-- MANUAL MIGRATION: Run this in Supabase SQL Editor
-- ============================================================================
-- This script creates missing tables for:
-- 1. User settings (language, timezone, notifications)
-- 2. Chat system (if migration 002 hasn't been run)
-- ============================================================================

-- ============================================================================
-- 1. USER SETTINGS TABLE
-- ============================================================================

-- Create user settings table
CREATE TABLE IF NOT EXISTS fc_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON fc_user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_company_id ON fc_user_settings(company_id);

-- Enable RLS
ALTER TABLE fc_user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  CREATE POLICY "Users can view their own settings"
    ON fc_user_settings FOR SELECT
    USING (user_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own settings"
    ON fc_user_settings FOR INSERT
    WITH CHECK (user_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own settings"
    ON fc_user_settings FOR UPDATE
    USING (user_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS user_settings_updated_at ON fc_user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON fc_user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- ============================================================================
-- 2. CHAT TABLES (if not already created by migration 002)
-- ============================================================================

-- Chat rooms (for group conversations)
CREATE TABLE IF NOT EXISTS fc_chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES fc_companies(id) ON DELETE CASCADE,
  name VARCHAR(255),
  type VARCHAR(20) DEFAULT 'group' CHECK (type IN ('direct', 'group', 'company')),
  created_by VARCHAR(255) NOT NULL, -- clerk_user_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fc_chat_rooms_company_id ON fc_chat_rooms(company_id);

-- Chat room members
CREATE TABLE IF NOT EXISTS fc_chat_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES fc_chat_rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- clerk_user_id
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
  ALTER TABLE fc_chat_room_members ADD CONSTRAINT fc_chat_room_members_room_id_user_id_key UNIQUE(room_id, user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_fc_chat_room_members_room_id ON fc_chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_fc_chat_room_members_user_id ON fc_chat_room_members(user_id);

-- Chat messages
CREATE TABLE IF NOT EXISTS fc_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES fc_chat_rooms(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL, -- clerk_user_id
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file', 'system')),
  content TEXT, -- Text message or file URL for voice/files
  voice_duration INTEGER, -- Duration in seconds for voice messages
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fc_chat_messages_room_id ON fc_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_fc_chat_messages_sender_id ON fc_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_fc_chat_messages_created_at ON fc_chat_messages(created_at DESC);

-- Message read status
CREATE TABLE IF NOT EXISTS fc_chat_message_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES fc_chat_messages(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- clerk_user_id
  read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
  ALTER TABLE fc_chat_message_reads ADD CONSTRAINT fc_chat_message_reads_message_id_user_id_key UNIQUE(message_id, user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_fc_chat_message_reads_message_id ON fc_chat_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_fc_chat_message_reads_user_id ON fc_chat_message_reads(user_id);

-- Enable RLS on chat tables
ALTER TABLE fc_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_message_reads ENABLE ROW LEVEL SECURITY;

-- Chat RLS Policies
DO $$ BEGIN
  CREATE POLICY "Users can view rooms they are members of"
    ON fc_chat_rooms FOR SELECT
    USING (
      id IN (
        SELECT room_id FROM fc_chat_room_members
        WHERE user_id = auth.jwt() ->> 'sub'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view messages in their rooms"
    ON fc_chat_messages FOR SELECT
    USING (
      room_id IN (
        SELECT room_id FROM fc_chat_room_members
        WHERE user_id = auth.jwt() ->> 'sub'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can send messages to their rooms"
    ON fc_chat_messages FOR INSERT
    WITH CHECK (
      room_id IN (
        SELECT room_id FROM fc_chat_room_members
        WHERE user_id = auth.jwt() ->> 'sub'
      )
      AND sender_id = auth.jwt() ->> 'sub'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own messages"
    ON fc_chat_messages FOR UPDATE
    USING (sender_id = auth.jwt() ->> 'sub');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view room members for their rooms"
    ON fc_chat_room_members FOR SELECT
    USING (
      room_id IN (
        SELECT room_id FROM fc_chat_room_members
        WHERE user_id = auth.jwt() ->> 'sub'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 3. CREATE DEFAULT COMPANY CHAT ROOM FOR EXISTING COMPANIES
-- ============================================================================

DO $$
DECLARE
  company_record RECORD;
  room_id_var UUID;
  room_exists BOOLEAN;
BEGIN
  FOR company_record IN SELECT id, name FROM fc_companies
  LOOP
    -- Check if company chat room already exists
    SELECT EXISTS(
      SELECT 1 FROM fc_chat_rooms
      WHERE company_id = company_record.id AND type = 'company'
    ) INTO room_exists;

    -- Only create if it doesn't exist
    IF NOT room_exists THEN
      -- Create company-wide chat room
      INSERT INTO fc_chat_rooms (company_id, name, type, created_by)
      VALUES (
        company_record.id,
        company_record.name || ' - Team Chat',
        'company',
        (SELECT clerk_user_id FROM fc_users WHERE company_id = company_record.id AND role = 'manager' LIMIT 1)
      )
      RETURNING id INTO room_id_var;

      -- Add all company users to the room
      INSERT INTO fc_chat_room_members (room_id, user_id)
      SELECT room_id_var, clerk_user_id
      FROM fc_users
      WHERE company_id = company_record.id;

      RAISE NOTICE 'Created chat room for company: %', company_record.name;
    ELSE
      RAISE NOTICE 'Chat room already exists for company: %', company_record.name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_fc_chat_rooms_updated_at ON fc_chat_rooms;
CREATE TRIGGER update_fc_chat_rooms_updated_at BEFORE UPDATE ON fc_chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fc_chat_messages_updated_at ON fc_chat_messages;
CREATE TRIGGER update_fc_chat_messages_updated_at BEFORE UPDATE ON fc_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT '✅ All tables created successfully!' as status;
SELECT '📝 User settings table ready' as status;
SELECT '💬 Chat system tables ready' as status;
SELECT '🔒 RLS policies enabled' as status;
