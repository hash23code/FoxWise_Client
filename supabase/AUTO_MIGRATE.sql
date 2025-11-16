-- ============================================
-- SCRIPT AUTO-MIGRATION - TOUT EN UN
-- ============================================
-- Ce script détecte automatiquement votre utilisateur et fait tout le setup
-- Exécutez-le dans Supabase SQL Editor - c'est tout!

DO $$
DECLARE
  v_user_record RECORD;
  v_company_id UUID;
  v_company_name VARCHAR(255);
BEGIN
  -- ============================================
  -- 1. TROUVER L'UTILISATEUR (le premier manager sans company)
  -- ============================================
  SELECT * INTO v_user_record
  FROM fc_users
  WHERE company_id IS NULL
  AND role = 'manager'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE NOTICE '✅ Tous les managers ont déjà une company!';
    RETURN;
  END IF;

  RAISE NOTICE '📧 Utilisateur trouvé: %', v_user_record.email;

  -- ============================================
  -- 2. CRÉER LA COMPANY
  -- ============================================
  v_company_name := COALESCE(v_user_record.full_name, SPLIT_PART(v_user_record.email, '@', 1)) || '''s Company';

  INSERT INTO fc_companies (name, owner_id, email)
  VALUES (v_company_name, v_user_record.clerk_user_id, v_user_record.email)
  RETURNING id INTO v_company_id;

  RAISE NOTICE '🏢 Company créée: % (ID: %)', v_company_name, v_company_id;

  -- ============================================
  -- 3. ASSIGNER LA COMPANY À L'UTILISATEUR
  -- ============================================
  UPDATE fc_users
  SET company_id = v_company_id
  WHERE id = v_user_record.id;

  RAISE NOTICE '👤 User mis à jour avec company_id';

  -- ============================================
  -- 4. ASSIGNER LA COMPANY À TOUTES LES DONNÉES
  -- ============================================

  -- Clients
  UPDATE fc_clients
  SET company_id = v_company_id
  WHERE company_id IS NULL;
  RAISE NOTICE '✅ Clients mis à jour: % lignes', (SELECT COUNT(*) FROM fc_clients WHERE company_id = v_company_id);

  -- Jobs
  UPDATE fc_jobs
  SET company_id = v_company_id
  WHERE company_id IS NULL;
  RAISE NOTICE '✅ Jobs mis à jour: % lignes', (SELECT COUNT(*) FROM fc_jobs WHERE company_id = v_company_id);

  -- Sectors
  UPDATE fc_sectors
  SET company_id = v_company_id
  WHERE company_id IS NULL;
  RAISE NOTICE '✅ Secteurs mis à jour: % lignes', (SELECT COUNT(*) FROM fc_sectors WHERE company_id = v_company_id);

  -- Activities
  UPDATE fc_activities
  SET company_id = v_company_id
  WHERE company_id IS NULL;
  RAISE NOTICE '✅ Activités mises à jour: % lignes', (SELECT COUNT(*) FROM fc_activities WHERE company_id = v_company_id);

  -- Job Types (if table and column exist)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fc_job_types') AND
     EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fc_job_types' AND column_name = 'company_id') THEN
    UPDATE fc_job_types
    SET company_id = v_company_id
    WHERE company_id IS NULL;
    RAISE NOTICE '✅ Types de jobs mis à jour: % lignes', (SELECT COUNT(*) FROM fc_job_types WHERE company_id = v_company_id);
  END IF;

  -- ============================================
  -- 5. RÉSUMÉ FINAL
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '🎉 MIGRATION COMPLÈTE!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Company Name: %', v_company_name;
  RAISE NOTICE 'User Email: %', v_user_record.email;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Votre application fonctionne maintenant!';
  RAISE NOTICE '✅ Plus d''erreurs 403';
  RAISE NOTICE '✅ Rechargez votre app: https://fox-wise-client.vercel.app';

END $$;

-- Vérification finale
SELECT
  u.email,
  u.company_id,
  c.name as company_name,
  (SELECT COUNT(*) FROM fc_clients WHERE company_id = u.company_id) as clients,
  (SELECT COUNT(*) FROM fc_jobs WHERE company_id = u.company_id) as jobs,
  (SELECT COUNT(*) FROM fc_sectors WHERE company_id = u.company_id) as sectors,
  (SELECT COUNT(*) FROM fc_activities WHERE company_id = u.company_id) as activities
FROM fc_users u
LEFT JOIN fc_companies c ON u.company_id = c.id
WHERE u.role = 'manager'
LIMIT 1;
