# 🔧 FoxWise Multi-Tenant Migration Guide

## Overview
This migration transforms FoxWise into a multi-tenant platform where each company has isolated data.

## What This Migration Does

### 1. **Creates Company Isolation**
- New `fc_companies` table to store company information
- Each company has a unique `company_id`
- All data is scoped to a company

### 2. **Updates All Tables**
Adds `company_id` to:
- `fc_users` (employees & managers)
- `fc_clients`
- `fc_jobs`
- `fc_sectors` (geographic)
- `fc_activities`
- `fc_geolocation`
- `fc_calendar_events` (if exists)
- `fc_email_logs` (if exists)

### 3. **Auto-Creates Companies**
- When a manager signs up → automatic company creation
- Company name generated from user's name
- Manager is linked to their company

### 4. **Employee Invitation System**
- New `fc_employee_invitations` table
- Tracks pending invitations
- Secure token-based invitation flow
- 7-day expiration on invitations

## 🚀 How to Apply This Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `001_add_multi_tenant_support.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success - you should see "Success. No rows returned"

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase migration up
```

### Option 3: psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i supabase/migrations/001_add_multi_tenant_support.sql
```

## ⚠️ Important Notes

### Before Running Migration

1. **Backup your database** - Always backup before schema changes
2. **Test in staging first** - If you have a staging environment
3. **Check existing data** - Understand what data you have

### After Running Migration

1. **Existing Users**: All existing `fc_users` will need to be assigned to companies
   - Managers will have companies auto-created on their next login
   - Existing data will need `company_id` populated

2. **Application Code**: You MUST update your API routes to filter by `company_id`
   - Without this, the migration alone won't enforce isolation
   - See the updated API routes in the codebase

3. **Data Migration**: If you have existing production data:
   ```sql
   -- Example: Assign all existing data to first company
   UPDATE fc_clients SET company_id = (SELECT id FROM fc_companies LIMIT 1) WHERE company_id IS NULL;
   UPDATE fc_jobs SET company_id = (SELECT id FROM fc_companies LIMIT 1) WHERE company_id IS NULL;
   -- Repeat for other tables
   ```

## 🔍 Verify Migration

Run these queries to verify the migration succeeded:

```sql
-- Check fc_companies table exists
SELECT * FROM fc_companies LIMIT 1;

-- Check company_id column exists in fc_users
SELECT column_name FROM information_schema.columns
WHERE table_name = 'fc_users' AND column_name = 'company_id';

-- Check employee invitations table
SELECT * FROM fc_employee_invitations LIMIT 1;

-- Check indexes were created
SELECT tablename, indexname FROM pg_indexes
WHERE indexname LIKE '%company_id%';
```

## 📊 Database Schema Changes

### New Tables
- `fc_companies` - Company information
- `fc_employee_invitations` - Invitation tracking

### Modified Tables
All major tables now have:
- `company_id UUID` column
- Index on `company_id`
- Foreign key reference to `fc_companies`

### New Triggers
- `trigger_create_company_for_manager` - Auto-creates company for new managers
- `trigger_fc_companies_updated_at` - Auto-updates timestamp

## 🔐 Security Considerations

1. **Row Level Security (RLS)** is enabled but policies are managed at application level
2. Using Supabase service role key (bypasses RLS)
3. Company isolation enforced in application code
4. Consider adding RLS policies for additional security layer

## 🆘 Rollback (Emergency Only)

If you need to rollback this migration:

```sql
-- WARNING: This will delete all company data!
DROP TABLE IF EXISTS fc_employee_invitations CASCADE;
DROP TABLE IF EXISTS fc_companies CASCADE;

ALTER TABLE fc_users DROP COLUMN IF EXISTS company_id;
ALTER TABLE fc_users DROP COLUMN IF EXISTS invitation_status;
ALTER TABLE fc_users DROP COLUMN IF EXISTS invitation_token;
ALTER TABLE fc_users DROP COLUMN IF EXISTS invited_at;
ALTER TABLE fc_users DROP COLUMN IF EXISTS invited_by;

ALTER TABLE fc_clients DROP COLUMN IF EXISTS company_id;
ALTER TABLE fc_jobs DROP COLUMN IF EXISTS company_id;
ALTER TABLE fc_sectors DROP COLUMN IF EXISTS company_id;
ALTER TABLE fc_activities DROP COLUMN IF EXISTS company_id;
ALTER TABLE fc_geolocation DROP COLUMN IF EXISTS company_id;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_create_company_for_manager ON fc_users;
DROP FUNCTION IF EXISTS create_company_for_manager();
```

## 📞 Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify all prerequisites are met
3. Ensure you have proper database permissions
4. Review the SQL error messages carefully

## Next Steps

After migration:
1. ✅ Update all API routes (see updated code)
2. ✅ Test company isolation
3. ✅ Implement employee invitation flow
4. ✅ Create FoxWise_Worker employee app
5. ✅ Test end-to-end workflow
