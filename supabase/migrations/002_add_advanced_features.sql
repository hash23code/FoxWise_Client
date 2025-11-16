-- ============================================================================
-- MIGRATION 002: Advanced Features
-- ============================================================================
-- This migration adds support for:
-- 1. Employee color assignments (for calendar and map visualization)
-- 2. Payment tracking system
-- 3. Email marketing campaigns
-- 4. Real-time chat with voice messages
-- ============================================================================

-- ============================================================================
-- 1. EMPLOYEE COLORS
-- ============================================================================

-- Add color column to fc_users for employee visualization
ALTER TABLE fc_users
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- Update existing employees with random distinct colors
DO $$
DECLARE
  colors TEXT[] := ARRAY['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#06B6D4'];
  user_record RECORD;
  color_index INTEGER := 0;
BEGIN
  FOR user_record IN SELECT id FROM fc_users WHERE role = 'employee' AND color IS NULL
  LOOP
    UPDATE fc_users
    SET color = colors[(color_index % array_length(colors, 1)) + 1]
    WHERE id = user_record.id;
    color_index := color_index + 1;
  END LOOP;
END $$;

-- ============================================================================
-- 2. PAYMENT TRACKING
-- ============================================================================

-- Client payments table
CREATE TABLE IF NOT EXISTS fc_client_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES fc_companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES fc_clients(id) ON DELETE CASCADE,
  job_id UUID REFERENCES fc_jobs(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50), -- cash, credit_card, check, transfer
  notes TEXT,
  created_by VARCHAR(255) NOT NULL, -- clerk_user_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fc_client_payments_company_id ON fc_client_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_fc_client_payments_client_id ON fc_client_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_fc_client_payments_job_id ON fc_client_payments(job_id);

-- Client invoices table
CREATE TABLE IF NOT EXISTS fc_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES fc_companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES fc_clients(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by VARCHAR(255) NOT NULL, -- clerk_user_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fc_invoices_company_id ON fc_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_fc_invoices_client_id ON fc_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_fc_invoices_status ON fc_invoices(status);

-- Invoice line items
CREATE TABLE IF NOT EXISTS fc_invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES fc_invoices(id) ON DELETE CASCADE,
  job_id UUID REFERENCES fc_jobs(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fc_invoice_items_invoice_id ON fc_invoice_items(invoice_id);

-- ============================================================================
-- 3. EMAIL CAMPAIGNS
-- ============================================================================

-- Email campaigns table
CREATE TABLE IF NOT EXISTS fc_email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES fc_companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  created_by VARCHAR(255) NOT NULL, -- clerk_user_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fc_email_campaigns_company_id ON fc_email_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_fc_email_campaigns_status ON fc_email_campaigns(status);

-- Campaign recipients
CREATE TABLE IF NOT EXISTS fc_email_campaign_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES fc_email_campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES fc_clients(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fc_email_campaign_recipients_campaign_id ON fc_email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fc_email_campaign_recipients_client_id ON fc_email_campaign_recipients(client_id);

-- ============================================================================
-- 4. REAL-TIME CHAT
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
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

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
  read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fc_chat_message_reads_message_id ON fc_chat_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_fc_chat_message_reads_user_id ON fc_chat_message_reads(user_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE fc_client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_chat_message_reads ENABLE ROW LEVEL SECURITY;

-- Payment tracking policies
CREATE POLICY "Users can view payments from their company"
  ON fc_client_payments FOR SELECT
  USING (company_id IN (SELECT company_id FROM fc_users WHERE clerk_user_id = current_setting('app.current_user_id', true)));

CREATE POLICY "Managers can insert payments"
  ON fc_client_payments FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM fc_users
      WHERE clerk_user_id = current_setting('app.current_user_id', true)
      AND role = 'manager'
    )
  );

CREATE POLICY "Managers can update payments"
  ON fc_client_payments FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM fc_users
      WHERE clerk_user_id = current_setting('app.current_user_id', true)
      AND role = 'manager'
    )
  );

-- Invoice policies
CREATE POLICY "Users can view invoices from their company"
  ON fc_invoices FOR SELECT
  USING (company_id IN (SELECT company_id FROM fc_users WHERE clerk_user_id = current_setting('app.current_user_id', true)));

CREATE POLICY "Managers can manage invoices"
  ON fc_invoices FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM fc_users
      WHERE clerk_user_id = current_setting('app.current_user_id', true)
      AND role = 'manager'
    )
  );

-- Email campaign policies
CREATE POLICY "Users can view campaigns from their company"
  ON fc_email_campaigns FOR SELECT
  USING (company_id IN (SELECT company_id FROM fc_users WHERE clerk_user_id = current_setting('app.current_user_id', true)));

CREATE POLICY "Managers can manage campaigns"
  ON fc_email_campaigns FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM fc_users
      WHERE clerk_user_id = current_setting('app.current_user_id', true)
      AND role = 'manager'
    )
  );

-- Chat policies
CREATE POLICY "Users can view rooms they are members of"
  ON fc_chat_rooms FOR SELECT
  USING (
    id IN (
      SELECT room_id FROM fc_chat_room_members
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can view messages in their rooms"
  ON fc_chat_messages FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM fc_chat_room_members
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can send messages to their rooms"
  ON fc_chat_messages FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT room_id FROM fc_chat_room_members
      WHERE user_id = current_setting('app.current_user_id', true)
    )
    AND sender_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can update their own messages"
  ON fc_chat_messages FOR UPDATE
  USING (sender_id = current_setting('app.current_user_id', true));

-- ============================================================================
-- 6. CREATE DEFAULT COMPANY CHAT ROOM FOR EXISTING COMPANIES
-- ============================================================================

DO $$
DECLARE
  company_record RECORD;
  room_id UUID;
BEGIN
  FOR company_record IN SELECT id, name FROM fc_companies
  LOOP
    -- Create company-wide chat room
    INSERT INTO fc_chat_rooms (company_id, name, type, created_by)
    VALUES (
      company_record.id,
      company_record.name || ' - Team Chat',
      'company',
      (SELECT clerk_user_id FROM fc_users WHERE company_id = company_record.id AND role = 'manager' LIMIT 1)
    )
    RETURNING id INTO room_id;

    -- Add all company users to the room
    INSERT INTO fc_chat_room_members (room_id, user_id)
    SELECT room_id, clerk_user_id
    FROM fc_users
    WHERE company_id = company_record.id;

    RAISE NOTICE 'Created chat room for company: %', company_record.name;
  END LOOP;
END $$;

-- ============================================================================
-- 7. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_fc_client_payments_updated_at BEFORE UPDATE ON fc_client_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fc_invoices_updated_at BEFORE UPDATE ON fc_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fc_email_campaigns_updated_at BEFORE UPDATE ON fc_email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fc_chat_rooms_updated_at BEFORE UPDATE ON fc_chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fc_chat_messages_updated_at BEFORE UPDATE ON fc_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002 completed successfully!';
  RAISE NOTICE '📊 Added employee color assignments';
  RAISE NOTICE '💰 Added payment tracking system';
  RAISE NOTICE '📧 Added email campaign system';
  RAISE NOTICE '💬 Added real-time chat system';
END $$;
