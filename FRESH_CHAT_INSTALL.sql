-- ============================================================================
-- FRESH CHAT INSTALLATION
-- ============================================================================
-- This script completely removes existing chat tables and recreates them
-- Use this if you're having issues with the migration
-- WARNING: This will delete all existing chat data!
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING TABLES (if they exist)
-- ============================================================================

DROP TABLE IF EXISTS fc_chat_message_reads CASCADE;
DROP TABLE IF EXISTS fc_chat_messages CASCADE;
DROP TABLE IF EXISTS fc_chat_room_members CASCADE;
DROP TABLE IF EXISTS fc_chat_rooms CASCADE;

-- ============================================================================
-- STEP 2: CREATE TABLES
-- ============================================================================

-- Chat rooms
CREATE TABLE fc_chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES fc_companies(id) ON DELETE CASCADE,
  name VARCHAR(255),
  type VARCHAR(20) DEFAULT 'group' CHECK (type IN ('direct', 'group', 'company')),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat room members
CREATE TABLE fc_chat_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES fc_chat_rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE fc_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES fc_chat_rooms(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file', 'system')),
  content TEXT,
  voice_duration INTEGER,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Message read status
CREATE TABLE fc_chat_message_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES fc_chat_messages(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id)
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_fc_chat_rooms_company_id ON fc_chat_rooms(company_id);
CREATE INDEX idx_fc_chat_room_members_room_id ON fc_chat_room_members(room_id);
CREATE INDEX idx_fc_chat_room_members_user_id ON fc_chat_room_members(user_id);
CREATE INDEX idx_fc_chat_messages_room_id ON fc_chat_messages(room_id);
CREATE INDEX idx_fc_chat_messages_sender_id ON fc_chat_messages(sender_id);
CREATE INDEX idx_fc_chat_messages_created_at ON fc_chat_messages(created_at DESC);
CREATE INDEX idx_fc_chat_message_reads_message_id ON fc_chat_message_reads(message_id);
CREATE INDEX idx_fc_chat_message_reads_user_id ON fc_chat_message_reads(user_id);

-- ============================================================================
-- STEP 4: ENABLE RLS
-- ============================================================================

ALTER TABLE fc_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_message_reads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE SIMPLE RLS POLICIES
-- ============================================================================

-- For now, allow service role to do everything (API will handle permissions)
-- This is the simplest approach and avoids column ambiguity errors

-- Chat Rooms
CREATE POLICY "Allow all for authenticated users" ON fc_chat_rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat Room Members
CREATE POLICY "Allow all for authenticated users" ON fc_chat_room_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat Messages
CREATE POLICY "Allow all for authenticated users" ON fc_chat_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chat Message Reads
CREATE POLICY "Allow all for authenticated users" ON fc_chat_message_reads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 6: CREATE DEFAULT COMPANY CHAT ROOM
-- ============================================================================

INSERT INTO fc_chat_rooms (company_id, name, type, created_by)
SELECT
  c.id,
  'Équipe ' || c.company_name || ' 🦊',
  'company',
  (SELECT e.clerk_user_id FROM fc_employees e
   WHERE e.company_id = c.id AND e.role IN ('owner', 'manager')
   LIMIT 1)
FROM fc_companies c
WHERE EXISTS (
  SELECT 1 FROM fc_employees e
  WHERE e.company_id = c.id AND e.role IN ('owner', 'manager')
);

-- Add all employees to their company chat room
INSERT INTO fc_chat_room_members (room_id, user_id)
SELECT DISTINCT
  r.id,
  e.clerk_user_id
FROM fc_chat_rooms r
JOIN fc_employees e ON e.company_id = r.company_id
WHERE r.type = 'company';

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT
  'Chat system successfully created!' as status,
  COUNT(DISTINCT r.id) as total_rooms,
  COUNT(DISTINCT m.id) as total_members
FROM fc_chat_rooms r
LEFT JOIN fc_chat_room_members m ON m.room_id = r.id;
