-- ============================================================================
-- DIAGNOSTIC: Check current state of chat tables
-- ============================================================================
-- Run this first to see what already exists
-- ============================================================================

-- Check if tables exist
SELECT
  table_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('fc_chat_rooms', 'fc_chat_room_members', 'fc_chat_messages', 'fc_chat_message_reads')
ORDER BY table_name;

-- Check columns in fc_chat_room_members if it exists
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fc_chat_room_members'
ORDER BY ordinal_position;

-- Check existing policies
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename LIKE 'fc_chat%'
ORDER BY tablename, policyname;
