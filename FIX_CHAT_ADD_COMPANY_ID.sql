-- ============================================================================
-- FIX CHAT: Ajouter company_id et créer les chat rooms automatiquement
-- ============================================================================
-- Ce script corrige le problème "No Chat Rooms"
-- ============================================================================

-- ÉTAPE 1: Ajouter la colonne company_id à fc_chat_rooms
ALTER TABLE fc_chat_rooms
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES fc_companies(id) ON DELETE CASCADE;

-- Créer l'index pour la performance
CREATE INDEX IF NOT EXISTS idx_fc_chat_rooms_company_id ON fc_chat_rooms(company_id);

-- ÉTAPE 2: Créer automatiquement un chat room "Équipe" pour chaque compagnie
DO $$
DECLARE
  company_record RECORD;
  new_room_id UUID;
  user_record RECORD;
BEGIN
  -- Pour chaque compagnie dans fc_companies
  FOR company_record IN
    SELECT id, name, owner_id FROM fc_companies
  LOOP
    -- Vérifier si un chat room existe déjà pour cette compagnie
    IF NOT EXISTS (
      SELECT 1 FROM fc_chat_rooms
      WHERE company_id = company_record.id
      AND type = 'company'
    ) THEN
      -- Créer le chat room de la compagnie
      INSERT INTO fc_chat_rooms (company_id, name, type, created_by)
      VALUES (
        company_record.id,
        'Équipe ' || company_record.name || ' 🦊',
        'company',
        company_record.owner_id
      )
      RETURNING id INTO new_room_id;

      RAISE NOTICE 'Created chat room "%" for company "%"',
        'Équipe ' || company_record.name || ' 🦊',
        company_record.name;

      -- Ajouter TOUS les utilisateurs de cette compagnie comme membres
      FOR user_record IN
        SELECT clerk_user_id
        FROM fc_users
        WHERE company_id = company_record.id
      LOOP
        INSERT INTO fc_chat_room_members (room_id, user_id)
        VALUES (new_room_id, user_record.clerk_user_id)
        ON CONFLICT (room_id, user_id) DO NOTHING;

        RAISE NOTICE 'Added user % to chat room', user_record.clerk_user_id;
      END LOOP;
    ELSE
      RAISE NOTICE 'Chat room already exists for company "%"', company_record.name;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Chat setup complete!';
END $$;

-- ÉTAPE 3: Afficher un résumé
SELECT
  c.name as company_name,
  cr.name as room_name,
  cr.type,
  COUNT(crm.user_id) as member_count
FROM fc_companies c
LEFT JOIN fc_chat_rooms cr ON cr.company_id = c.id
LEFT JOIN fc_chat_room_members crm ON crm.room_id = cr.id
GROUP BY c.name, cr.name, cr.type
ORDER BY c.name;
