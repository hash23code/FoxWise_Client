-- ============================================
-- FOXWISE MULTI-TENANT MIGRATION
-- ============================================
-- This migration adds company isolation to the FoxWise platform
-- Allows multiple companies to use the platform independently

-- ============================================
-- 1. CREATE COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fc_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) NOT NULL, -- Clerk user ID of the company owner (manager)
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_plan VARCHAR(50) DEFAULT 'free',
  max_employees INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- Index for faster lookups
CREATE INDEX idx_fc_companies_owner_id ON fc_companies(owner_id);

-- ============================================
-- 2. ADD COMPANY_ID TO FC_USERS
-- ============================================
ALTER TABLE fc_users
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES fc_companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invited_by VARCHAR(255); -- Clerk user ID of who invited them

-- Index for company filtering
CREATE INDEX IF NOT EXISTS idx_fc_users_company_id ON fc_users(company_id);

-- ============================================
-- 3. ADD COMPANY_ID TO ALL OTHER TABLES
-- ============================================

-- Clients
ALTER TABLE fc_clients
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES fc_companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fc_clients_company_id ON fc_clients(company_id);

-- Jobs
ALTER TABLE fc_jobs
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES fc_companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fc_jobs_company_id ON fc_jobs(company_id);

-- Sectors (Geographic)
ALTER TABLE fc_sectors
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES fc_companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fc_sectors_company_id ON fc_sectors(company_id);

-- Activities
ALTER TABLE fc_activities
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES fc_companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fc_activities_company_id ON fc_activities(company_id);

-- Calendar Events (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fc_calendar_events') THEN
    ALTER TABLE fc_calendar_events
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES fc_companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_fc_calendar_events_company_id ON fc_calendar_events(company_id);
  END IF;
END $$;

-- Geolocation
ALTER TABLE fc_geolocation
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES fc_companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fc_geolocation_company_id ON fc_geolocation(company_id);

-- Email Logs (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fc_email_logs') THEN
    ALTER TABLE fc_email_logs
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES fc_companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_fc_email_logs_company_id ON fc_email_logs(company_id);
  END IF;
END $$;

-- ============================================
-- 4. CREATE EMPLOYEE INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fc_employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES fc_companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'employee',
  invited_by VARCHAR(255) NOT NULL, -- Clerk user ID
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, email)
);

CREATE INDEX idx_fc_invitations_company_id ON fc_employee_invitations(company_id);
CREATE INDEX idx_fc_invitations_token ON fc_employee_invitations(invitation_token);
CREATE INDEX idx_fc_invitations_email ON fc_employee_invitations(email);

-- ============================================
-- 5. FUNCTION: Auto-create company for new managers
-- ============================================
CREATE OR REPLACE FUNCTION create_company_for_manager()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  company_name VARCHAR(255);
BEGIN
  -- Only create company for managers
  IF NEW.role = 'manager' AND NEW.company_id IS NULL THEN
    -- Generate company name from user's name or email
    company_name := COALESCE(NEW.full_name, SPLIT_PART(NEW.email, '@', 1)) || '''s Company';

    -- Create the company
    INSERT INTO fc_companies (name, owner_id, email)
    VALUES (company_name, NEW.clerk_user_id, NEW.email)
    RETURNING id INTO new_company_id;

    -- Assign the company_id to the user
    NEW.company_id := new_company_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_company_for_manager ON fc_users;
CREATE TRIGGER trigger_create_company_for_manager
  BEFORE INSERT ON fc_users
  FOR EACH ROW
  EXECUTE FUNCTION create_company_for_manager();

-- ============================================
-- 6. FUNCTION: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to fc_companies
DROP TRIGGER IF EXISTS trigger_fc_companies_updated_at ON fc_companies;
CREATE TRIGGER trigger_fc_companies_updated_at
  BEFORE UPDATE ON fc_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE fc_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_geolocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_employee_invitations ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be managed at the application level using service role key
-- For now, we'll use service role key which bypasses RLS
-- In production, you may want to add specific policies for additional security

-- ============================================
-- 8. MIGRATION HELPER: Update existing data
-- ============================================
-- This section helps migrate existing data to the multi-tenant structure

COMMENT ON TABLE fc_companies IS 'Companies table for multi-tenant support. Each company has isolated data.';
COMMENT ON COLUMN fc_users.company_id IS 'Links user to their company. Managers own companies, employees are invited.';
COMMENT ON TABLE fc_employee_invitations IS 'Tracks employee invitation emails and tokens for secure onboarding.';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Update API routes to filter by company_id
-- 2. Create invitation email system
-- 3. Build employee onboarding flow
