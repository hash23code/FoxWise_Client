-- ============================================================================
-- SIMPLE CHAT SETUP - THIS WILL WORK!
-- ============================================================================
-- Just run this, no complications
-- ============================================================================

-- Clean slate - remove everything chat related
DROP TABLE IF EXISTS fc_chat_message_reads CASCADE;
DROP TABLE IF EXISTS fc_chat_messages CASCADE;
DROP TABLE IF EXISTS fc_chat_room_members CASCADE;
DROP TABLE IF EXISTS fc_chat_rooms CASCADE;

-- Create chat rooms table
CREATE TABLE fc_chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES fc_companies(id) ON DELETE CASCADE,
  name VARCHAR(255),
  type VARCHAR(20) DEFAULT 'group',
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room members table
CREATE TABLE fc_chat_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES fc_chat_rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- Create messages table
CREATE TABLE fc_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES fc_chat_rooms(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  content TEXT,
  voice_duration INTEGER,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message reads table
CREATE TABLE fc_chat_message_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES fc_chat_messages(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create indexes
CREATE INDEX idx_chat_rooms_company ON fc_chat_rooms(company_id);
CREATE INDEX idx_room_members_room ON fc_chat_room_members(room_id);
CREATE INDEX idx_room_members_user ON fc_chat_room_members(user_id);
CREATE INDEX idx_messages_room ON fc_chat_messages(room_id);
CREATE INDEX idx_messages_sender ON fc_chat_messages(sender_id);
CREATE INDEX idx_messages_created ON fc_chat_messages(created_at DESC);
CREATE INDEX idx_reads_message ON fc_chat_message_reads(message_id);
CREATE INDEX idx_reads_user ON fc_chat_message_reads(user_id);

-- Enable RLS but make it permissive (API handles security)
ALTER TABLE fc_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_message_reads ENABLE ROW LEVEL SECURITY;

-- Simple policies - allow everything (your API uses service role key anyway)
CREATE POLICY "Allow all" ON fc_chat_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON fc_chat_room_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON fc_chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON fc_chat_message_reads FOR ALL USING (true) WITH CHECK (true);

-- Create company chat rooms
INSERT INTO fc_chat_rooms (company_id, name, type, created_by)
SELECT
  c.id,
  'Équipe ' || c.name || ' 🦊',
  'company',
  (SELECT e.clerk_user_id FROM fc_employees e WHERE e.company_id = c.id LIMIT 1)
FROM fc_companies c
WHERE EXISTS (SELECT 1 FROM fc_employees e WHERE e.company_id = c.id);

-- Add all employees to their company chat
INSERT INTO fc_chat_room_members (room_id, user_id)
SELECT r.id, e.clerk_user_id
FROM fc_chat_rooms r
JOIN fc_employees e ON e.company_id = r.company_id
WHERE r.type = 'company';

-- Show results
SELECT 'Success! Chat is ready!' as message,
       COUNT(*) as chat_rooms_created
FROM fc_chat_rooms;
