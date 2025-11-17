-- ============================================================================
-- CHAT SETUP - VERSION FINALE QUI FONCTIONNE
-- ============================================================================
-- Crée simplement les 4 tables nécessaires pour le chat
-- Pas de complications, pas de dépendances
-- ============================================================================

-- Nettoyer les anciennes tables
DROP TABLE IF EXISTS fc_chat_message_reads CASCADE;
DROP TABLE IF EXISTS fc_chat_messages CASCADE;
DROP TABLE IF EXISTS fc_chat_room_members CASCADE;
DROP TABLE IF EXISTS fc_chat_rooms CASCADE;

-- Table des rooms de chat
CREATE TABLE fc_chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'group',
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres de chaque room
CREATE TABLE fc_chat_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES fc_chat_rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Table des messages
CREATE TABLE fc_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES fc_chat_rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour tracker les messages lus
CREATE TABLE fc_chat_message_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES fc_chat_messages(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Créer les index pour la performance
CREATE INDEX idx_chat_room_members_room ON fc_chat_room_members(room_id);
CREATE INDEX idx_chat_room_members_user ON fc_chat_room_members(user_id);
CREATE INDEX idx_chat_messages_room ON fc_chat_messages(room_id);
CREATE INDEX idx_chat_messages_created ON fc_chat_messages(created_at);
CREATE INDEX idx_chat_message_reads_message ON fc_chat_message_reads(message_id);
CREATE INDEX idx_chat_message_reads_user ON fc_chat_message_reads(user_id);

-- Activer RLS sur toutes les tables
ALTER TABLE fc_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_message_reads ENABLE ROW LEVEL SECURITY;

-- Politiques RLS ultra-simples (tout le monde peut tout faire pour l'instant)
CREATE POLICY "Allow all on chat_rooms" ON fc_chat_rooms FOR ALL USING (true);
CREATE POLICY "Allow all on chat_room_members" ON fc_chat_room_members FOR ALL USING (true);
CREATE POLICY "Allow all on chat_messages" ON fc_chat_messages FOR ALL USING (true);
CREATE POLICY "Allow all on chat_message_reads" ON fc_chat_message_reads FOR ALL USING (true);

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE 'Chat tables created successfully! 🎉';
  RAISE NOTICE 'Tables: fc_chat_rooms, fc_chat_room_members, fc_chat_messages, fc_chat_message_reads';
  RAISE NOTICE 'You can now create chat rooms from the app!';
END $$;
