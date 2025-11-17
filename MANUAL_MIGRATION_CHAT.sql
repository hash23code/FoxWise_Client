-- ============================================================================
-- MANUAL MIGRATION: Chat System Tables
-- ============================================================================
-- Run this in Supabase SQL Editor to create the chat system tables
-- This script is safe to run multiple times
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE TABLES (ONLY IF THEY DON'T EXIST)
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

-- Chat room members
CREATE TABLE IF NOT EXISTS fc_chat_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES fc_chat_rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- clerk_user_id
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

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

-- Message read status
CREATE TABLE IF NOT EXISTS fc_chat_message_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES fc_chat_messages(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- clerk_user_id
  read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id)
);

-- ============================================================================
-- STEP 2: CREATE INDEXES (ONLY IF THEY DON'T EXIST)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_fc_chat_rooms_company_id ON fc_chat_rooms(company_id);

CREATE INDEX IF NOT EXISTS idx_fc_chat_room_members_room_id ON fc_chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_fc_chat_room_members_user_id ON fc_chat_room_members(user_id);

CREATE INDEX IF NOT EXISTS idx_fc_chat_messages_room_id ON fc_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_fc_chat_messages_sender_id ON fc_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_fc_chat_messages_created_at ON fc_chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fc_chat_message_reads_message_id ON fc_chat_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_fc_chat_message_reads_user_id ON fc_chat_message_reads(user_id);

-- ============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE fc_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_message_reads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: DROP EXISTING POLICIES (IF ANY)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view rooms in their company" ON fc_chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms in their company" ON fc_chat_rooms;
DROP POLICY IF EXISTS "Users can view their room memberships" ON fc_chat_room_members;
DROP POLICY IF EXISTS "Users can join rooms in their company" ON fc_chat_room_members;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON fc_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON fc_chat_messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON fc_chat_message_reads;
DROP POLICY IF EXISTS "Users can view read status in their rooms" ON fc_chat_message_reads;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- Chat Rooms: Users can view rooms in their company
CREATE POLICY "Users can view rooms in their company" ON fc_chat_rooms
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM fc_employees
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Chat Rooms: Users can create rooms in their company
CREATE POLICY "Users can create rooms in their company" ON fc_chat_rooms
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM fc_employees
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Chat Room Members: Users can view their memberships
CREATE POLICY "Users can view their room memberships" ON fc_chat_room_members
  FOR SELECT
  USING (
    fc_chat_room_members.room_id IN (
      SELECT fc_chat_rooms.id FROM fc_chat_rooms WHERE fc_chat_rooms.company_id IN (
        SELECT company_id FROM fc_employees
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Chat Room Members: Users can join rooms
CREATE POLICY "Users can join rooms in their company" ON fc_chat_room_members
  FOR INSERT
  WITH CHECK (
    fc_chat_room_members.room_id IN (
      SELECT fc_chat_rooms.id FROM fc_chat_rooms WHERE fc_chat_rooms.company_id IN (
        SELECT company_id FROM fc_employees
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Chat Messages: Users can view messages in their rooms
CREATE POLICY "Users can view messages in their rooms" ON fc_chat_messages
  FOR SELECT
  USING (
    fc_chat_messages.room_id IN (
      SELECT fc_chat_room_members.room_id FROM fc_chat_room_members
      WHERE fc_chat_room_members.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Chat Messages: Users can send messages
CREATE POLICY "Users can send messages to their rooms" ON fc_chat_messages
  FOR INSERT
  WITH CHECK (
    fc_chat_messages.room_id IN (
      SELECT fc_chat_room_members.room_id FROM fc_chat_room_members
      WHERE fc_chat_room_members.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Chat Message Reads: Users can mark messages as read
CREATE POLICY "Users can mark messages as read" ON fc_chat_message_reads
  FOR INSERT
  WITH CHECK (
    fc_chat_message_reads.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Chat Message Reads: Users can view read status
CREATE POLICY "Users can view read status in their rooms" ON fc_chat_message_reads
  FOR SELECT
  USING (
    fc_chat_message_reads.message_id IN (
      SELECT fc_chat_messages.id FROM fc_chat_messages WHERE fc_chat_messages.room_id IN (
        SELECT fc_chat_room_members.room_id FROM fc_chat_room_members
        WHERE fc_chat_room_members.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- ============================================================================
-- STEP 6: CREATE DEFAULT COMPANY CHAT ROOM
-- ============================================================================

-- Create a company-wide chat room for each company (if it doesn't exist)
DO $$
BEGIN
  INSERT INTO fc_chat_rooms (company_id, name, type, created_by)
  SELECT
    c.id,
    'Équipe ' || c.company_name || ' 🦊',
    'company',
    (SELECT e.clerk_user_id FROM fc_employees e
     WHERE e.company_id = c.id AND e.role IN ('owner', 'manager')
     LIMIT 1)
  FROM fc_companies c
  WHERE NOT EXISTS (
    SELECT 1 FROM fc_chat_rooms
    WHERE company_id = c.id AND type = 'company'
  )
  AND EXISTS (
    SELECT 1 FROM fc_employees e
    WHERE e.company_id = c.id AND e.role IN ('owner', 'manager')
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create default chat rooms: %', SQLERRM;
END $$;

-- Add all employees to their company chat room
DO $$
BEGIN
  INSERT INTO fc_chat_room_members (room_id, user_id)
  SELECT DISTINCT
    r.id,
    e.clerk_user_id
  FROM fc_chat_rooms r
  JOIN fc_employees e ON e.company_id = r.company_id
  WHERE r.type = 'company'
    AND NOT EXISTS (
      SELECT 1 FROM fc_chat_room_members
      WHERE room_id = r.id AND user_id = e.clerk_user_id
    );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add employees to chat rooms: %', SQLERRM;
END $$;

-- ============================================================================
-- DONE! SHOW RESULTS
-- ============================================================================

SELECT
  'Chat system successfully created!' as status,
  COUNT(DISTINCT r.id) as total_rooms,
  COUNT(DISTINCT m.id) as total_members
FROM fc_chat_rooms r
LEFT JOIN fc_chat_room_members m ON m.room_id = r.id;
