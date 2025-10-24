-- FoxWise Client Database Schema
-- Complete schema for client management system

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (syncs with Clerk)
CREATE TABLE IF NOT EXISTS fc_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('manager', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sectors table
CREATE TABLE IF NOT EXISTS fc_sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#F97316',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Clients table
CREATE TABLE IF NOT EXISTS fc_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  sector_id UUID REFERENCES fc_sectors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Job Types table
CREATE TABLE IF NOT EXISTS fc_job_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Jobs table
CREATE TABLE IF NOT EXISTS fc_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_id UUID REFERENCES fc_clients(id) ON DELETE CASCADE,
  assigned_to TEXT,
  job_type_id UUID REFERENCES fc_job_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(10,2),
  estimated_cost DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS fc_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  client_id UUID REFERENCES fc_clients(id) ON DELETE SET NULL,
  job_id UUID REFERENCES fc_jobs(id) ON DELETE SET NULL,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'job', 'reminder', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Conversations table (for chat)
CREATE TABLE IF NOT EXISTS fc_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  conversation_type TEXT DEFAULT 'group' CHECK (conversation_type IN ('private', 'group')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS fc_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES fc_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Email Logs table
CREATE TABLE IF NOT EXISTS fc_email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_ids UUID[],
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_fc_clients_user_id ON fc_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_fc_clients_sector_id ON fc_clients(sector_id);
CREATE INDEX IF NOT EXISTS idx_fc_clients_status ON fc_clients(status);

CREATE INDEX IF NOT EXISTS idx_fc_jobs_user_id ON fc_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_fc_jobs_client_id ON fc_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_fc_jobs_status ON fc_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fc_jobs_assigned_to ON fc_jobs(assigned_to);

CREATE INDEX IF NOT EXISTS idx_fc_calendar_events_user_id ON fc_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_fc_calendar_events_start_time ON fc_calendar_events(start_time);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE fc_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_email_logs ENABLE ROW LEVEL SECURITY;

-- Clients RLS Policies
CREATE POLICY "Users can view own clients"
  ON fc_clients FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own clients"
  ON fc_clients FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own clients"
  ON fc_clients FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own clients"
  ON fc_clients FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Jobs RLS Policies
CREATE POLICY "Users can view own jobs"
  ON fc_jobs FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own jobs"
  ON fc_jobs FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own jobs"
  ON fc_jobs FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own jobs"
  ON fc_jobs FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Calendar Events RLS Policies
CREATE POLICY "Users can view own events"
  ON fc_calendar_events FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own events"
  ON fc_calendar_events FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own events"
  ON fc_calendar_events FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own events"
  ON fc_calendar_events FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default sectors
INSERT INTO fc_sectors (name, description, color) VALUES
  ('Résidentiel', 'Clients résidentiels', '#3B82F6'),
  ('Commercial', 'Clients commerciaux', '#10B981'),
  ('Industriel', 'Clients industriels', '#F59E0B'),
  ('Gouvernemental', 'Contrats gouvernementaux', '#8B5CF6'),
  ('Institutionnel', 'Écoles, hôpitaux, etc.', '#EC4899')
ON CONFLICT DO NOTHING;

-- Insert default job types
INSERT INTO fc_job_types (name, description, default_cost) VALUES
  ('Consultation', 'Consultation initiale', 100.00),
  ('Installation', 'Installation de système', 500.00),
  ('Maintenance', 'Maintenance préventive', 150.00),
  ('Réparation', 'Réparation d''urgence', 200.00),
  ('Inspection', 'Inspection annuelle', 75.00),
  ('Nettoyage', 'Nettoyage complet', 125.00)
ON CONFLICT DO NOTHING;
