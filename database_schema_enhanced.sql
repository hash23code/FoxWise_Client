-- FoxWise Client Database Schema (Enhanced)
-- Complete schema with activities, role-based access, and enhanced features

-- =====================================================
-- DROP EXISTING TABLES (if any)
-- =====================================================

DROP TABLE IF EXISTS fc_client_activities CASCADE;
DROP TABLE IF EXISTS fc_activities CASCADE;
DROP TABLE IF EXISTS fc_email_logs CASCADE;
DROP TABLE IF EXISTS fc_chat_messages CASCADE;
DROP TABLE IF EXISTS fc_conversations CASCADE;
DROP TABLE IF EXISTS fc_calendar_events CASCADE;
DROP TABLE IF EXISTS fc_jobs CASCADE;
DROP TABLE IF EXISTS fc_job_types CASCADE;
DROP TABLE IF EXISTS fc_clients CASCADE;
DROP TABLE IF EXISTS fc_sectors CASCADE;
DROP TABLE IF EXISTS fc_users CASCADE;

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (syncs with Clerk)
CREATE TABLE fc_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('manager', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sectors table
CREATE TABLE fc_sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#F97316',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activities table (services offered by the company)
CREATE TABLE fc_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_cost DECIMAL(10,2),
  icon TEXT,
  color TEXT DEFAULT '#F97316',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Clients table
CREATE TABLE fc_clients (
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

-- Client Activities junction table (many-to-many)
CREATE TABLE fc_client_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES fc_clients(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES fc_activities(id) ON DELETE CASCADE,
  custom_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, activity_id)
);

-- Job Types table (kept for backward compatibility)
CREATE TABLE fc_job_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Jobs table
CREATE TABLE fc_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_id UUID REFERENCES fc_clients(id) ON DELETE CASCADE,
  assigned_to TEXT,
  activity_id UUID REFERENCES fc_activities(id) ON DELETE SET NULL,
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
  amount_paid DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Calendar Events table
CREATE TABLE fc_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  assigned_to TEXT,
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

-- Conversations table (for team chat)
CREATE TABLE fc_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  conversation_type TEXT DEFAULT 'group' CHECK (conversation_type IN ('private', 'group', 'team')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat Messages table
CREATE TABLE fc_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES fc_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Email Logs table
CREATE TABLE fc_email_logs (
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

CREATE INDEX idx_fc_users_clerk_id ON fc_users(clerk_user_id);
CREATE INDEX idx_fc_users_role ON fc_users(role);

CREATE INDEX idx_fc_sectors_user_id ON fc_sectors(user_id);

CREATE INDEX idx_fc_activities_user_id ON fc_activities(user_id);

CREATE INDEX idx_fc_clients_user_id ON fc_clients(user_id);
CREATE INDEX idx_fc_clients_sector_id ON fc_clients(sector_id);
CREATE INDEX idx_fc_clients_status ON fc_clients(status);
CREATE INDEX idx_fc_clients_created_at ON fc_clients(created_at);

CREATE INDEX idx_fc_client_activities_client_id ON fc_client_activities(client_id);
CREATE INDEX idx_fc_client_activities_activity_id ON fc_client_activities(activity_id);

CREATE INDEX idx_fc_jobs_user_id ON fc_jobs(user_id);
CREATE INDEX idx_fc_jobs_client_id ON fc_jobs(client_id);
CREATE INDEX idx_fc_jobs_status ON fc_jobs(status);
CREATE INDEX idx_fc_jobs_assigned_to ON fc_jobs(assigned_to);
CREATE INDEX idx_fc_jobs_activity_id ON fc_jobs(activity_id);

CREATE INDEX idx_fc_calendar_events_user_id ON fc_calendar_events(user_id);
CREATE INDEX idx_fc_calendar_events_assigned_to ON fc_calendar_events(assigned_to);
CREATE INDEX idx_fc_calendar_events_start_time ON fc_calendar_events(start_time);

CREATE INDEX idx_fc_chat_messages_conversation_id ON fc_chat_messages(conversation_id);
CREATE INDEX idx_fc_chat_messages_sender_id ON fc_chat_messages(sender_id);

-- =====================================================
-- TRIGGERS FOR AUTO-CALENDAR SYNC
-- =====================================================

-- Function to create calendar event when job is assigned
CREATE OR REPLACE FUNCTION create_calendar_event_for_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create event if job has assigned_to and scheduled_date
  IF NEW.assigned_to IS NOT NULL AND NEW.scheduled_date IS NOT NULL THEN
    INSERT INTO fc_calendar_events (
      user_id,
      assigned_to,
      title,
      description,
      start_time,
      end_time,
      client_id,
      job_id,
      event_type
    ) VALUES (
      NEW.user_id,
      NEW.assigned_to,
      NEW.title,
      NEW.description,
      NEW.scheduled_date,
      NEW.scheduled_date + INTERVAL '2 hours', -- Default 2 hour duration
      NEW.client_id,
      NEW.id,
      'job'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new jobs
CREATE TRIGGER trigger_create_calendar_event_on_job_insert
AFTER INSERT ON fc_jobs
FOR EACH ROW
EXECUTE FUNCTION create_calendar_event_for_job();

-- Function to update calendar event when job is updated
CREATE OR REPLACE FUNCTION update_calendar_event_for_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing calendar event
  UPDATE fc_calendar_events
  SET
    assigned_to = NEW.assigned_to,
    title = NEW.title,
    description = NEW.description,
    start_time = NEW.scheduled_date,
    end_time = NEW.scheduled_date + INTERVAL '2 hours',
    client_id = NEW.client_id,
    updated_at = NOW()
  WHERE job_id = NEW.id;

  -- If no event exists and job now has assignment, create one
  IF NOT FOUND AND NEW.assigned_to IS NOT NULL AND NEW.scheduled_date IS NOT NULL THEN
    INSERT INTO fc_calendar_events (
      user_id,
      assigned_to,
      title,
      description,
      start_time,
      end_time,
      client_id,
      job_id,
      event_type
    ) VALUES (
      NEW.user_id,
      NEW.assigned_to,
      NEW.title,
      NEW.description,
      NEW.scheduled_date,
      NEW.scheduled_date + INTERVAL '2 hours',
      NEW.client_id,
      NEW.id,
      'job'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for job updates
CREATE TRIGGER trigger_update_calendar_event_on_job_update
AFTER UPDATE ON fc_jobs
FOR EACH ROW
WHEN (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to
      OR OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date
      OR OLD.title IS DISTINCT FROM NEW.title)
EXECUTE FUNCTION update_calendar_event_for_job();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Note: Sectors, activities, and job_types are now user-specific
-- Initial data will be created per user on first login

-- Insert default sectors (you can customize these)
-- These are examples - actual data should be user-specific
INSERT INTO fc_sectors (user_id, name, description, color) VALUES
  ('system', 'Résidentiel', 'Clients résidentiels', '#3B82F6'),
  ('system', 'Commercial', 'Clients commerciaux', '#10B981'),
  ('system', 'Industriel', 'Clients industriels', '#F59E0B'),
  ('system', 'Gouvernemental', 'Contrats gouvernementaux', '#8B5CF6'),
  ('system', 'Institutionnel', 'Écoles, hôpitaux, etc.', '#EC4899');

-- Insert default activities (services)
INSERT INTO fc_activities (user_id, name, description, default_cost, color) VALUES
  ('system', 'Déneigement', 'Service de déneigement résidentiel et commercial', 150.00, '#60A5FA'),
  ('system', 'Émondage', 'Élagage et entretien d''arbres', 300.00, '#34D399'),
  ('system', 'Paysagement', 'Aménagement paysager complet', 500.00, '#FBBF24'),
  ('system', 'Tonte de Gazon', 'Service de tonte et entretien de pelouse', 75.00, '#4ADE80'),
  ('system', 'Nettoyage', 'Nettoyage de terrains et espaces extérieurs', 125.00, '#A78BFA'),
  ('system', 'Consultation', 'Consultation et estimation', 100.00, '#F472B6');

-- Insert default job types
INSERT INTO fc_job_types (user_id, name, description, default_cost) VALUES
  ('system', 'Urgence', 'Intervention d''urgence', 200.00),
  ('system', 'Régulier', 'Service régulier planifié', 150.00),
  ('system', 'Saisonnier', 'Service saisonnier', 300.00),
  ('system', 'Ponctuel', 'Service ponctuel unique', 100.00);
