-- ================================================================
-- Table pour stocker les credentials email de chaque entreprise
-- ================================================================
-- Permet à chaque client d'utiliser SON propre email
-- Les mots de passe sont CHIFFRÉS pour la sécurité
-- ================================================================

-- Activer l'extension de chiffrement si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table des credentials email par entreprise
CREATE TABLE IF NOT EXISTS fc_email_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES fc_companies(id) ON DELETE CASCADE,

  -- Provider type (pour simplifier la config)
  provider VARCHAR(50) NOT NULL DEFAULT 'smtp_custom', -- 'gmail', 'gmail_oauth', 'outlook', 'smtp_custom'

  -- Auth method: 'smtp' or 'oauth'
  auth_method VARCHAR(20) DEFAULT 'smtp', -- 'smtp', 'oauth'

  -- SMTP Configuration (for smtp auth_method)
  smtp_host VARCHAR(255), -- smtp.gmail.com, smtp-mail.outlook.com, etc.
  smtp_port INTEGER DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT true, -- TLS/SSL

  -- SMTP Authentication
  smtp_user VARCHAR(255), -- Email address
  smtp_password_encrypted TEXT, -- Mot de passe chiffré avec pgcrypto

  -- OAuth Configuration (for oauth auth_method)
  oauth_refresh_token_encrypted TEXT, -- OAuth refresh token (chiffré)
  oauth_access_token_encrypted TEXT, -- OAuth access token (chiffré, peut expirer)
  oauth_token_expiry TIMESTAMPTZ, -- Quand l'access token expire
  oauth_scope TEXT, -- OAuth scopes granted

  -- Email settings
  from_email VARCHAR(255) NOT NULL, -- Email "From"
  from_name VARCHAR(255), -- Nom affiché "FoxWise - Entreprise X"

  -- Status
  is_verified BOOLEAN DEFAULT false, -- Si on a testé et ça fonctionne
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  last_tested_at TIMESTAMPTZ,
  test_status VARCHAR(50), -- 'success', 'failed', 'pending'
  test_error TEXT, -- Message d'erreur si le test a échoué

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Une seule configuration email par company
  UNIQUE(company_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_email_credentials_company ON fc_email_credentials(company_id);
CREATE INDEX IF NOT EXISTS idx_email_credentials_active ON fc_email_credentials(is_active) WHERE is_active = true;

-- ================================================================
-- Fonctions helper pour chiffrer/déchiffrer les mots de passe
-- ================================================================

-- Fonction pour sauvegarder un credential (chiffre le mot de passe)
CREATE OR REPLACE FUNCTION fc_save_email_credential(
  p_company_id UUID,
  p_provider VARCHAR,
  p_smtp_host VARCHAR,
  p_smtp_port INTEGER,
  p_smtp_user VARCHAR,
  p_smtp_password VARCHAR, -- Plain text password (sera chiffré)
  p_from_email VARCHAR,
  p_from_name VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_credential_id UUID;
  v_encryption_key TEXT;
BEGIN
  -- Clé de chiffrement (À STOCKER DANS LES VARIABLES D'ENVIRONNEMENT!)
  -- Pour production, utilisez process.env.ENCRYPTION_KEY
  v_encryption_key := 'foxwise-email-encryption-key-2024'; -- CHANGEZ ÇA!

  -- Upsert (insert or update)
  INSERT INTO fc_email_credentials (
    company_id,
    provider,
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_password_encrypted,
    from_email,
    from_name
  ) VALUES (
    p_company_id,
    p_provider,
    p_smtp_host,
    p_smtp_port,
    p_smtp_user,
    encode(encrypt(p_smtp_password::bytea, v_encryption_key, 'aes'), 'base64'), -- Chiffrement AES
    p_from_email,
    p_from_name
  )
  ON CONFLICT (company_id) DO UPDATE SET
    provider = EXCLUDED.provider,
    smtp_host = EXCLUDED.smtp_host,
    smtp_port = EXCLUDED.smtp_port,
    smtp_user = EXCLUDED.smtp_user,
    smtp_password_encrypted = EXCLUDED.smtp_password_encrypted,
    from_email = EXCLUDED.from_email,
    from_name = EXCLUDED.from_name,
    updated_at = NOW()
  RETURNING id INTO v_credential_id;

  RETURN v_credential_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer un credential (déchiffre le mot de passe)
CREATE OR REPLACE FUNCTION fc_get_email_credential(
  p_company_id UUID
) RETURNS TABLE (
  id UUID,
  provider VARCHAR,
  smtp_host VARCHAR,
  smtp_port INTEGER,
  smtp_secure BOOLEAN,
  smtp_user VARCHAR,
  smtp_password VARCHAR, -- Déchiffré!
  from_email VARCHAR,
  from_name VARCHAR,
  is_verified BOOLEAN
) AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  -- Même clé que pour le chiffrement
  v_encryption_key := 'foxwise-email-encryption-key-2024'; -- CHANGEZ ÇA!

  RETURN QUERY
  SELECT
    ec.id,
    ec.provider,
    ec.smtp_host,
    ec.smtp_port,
    ec.smtp_secure,
    ec.smtp_user,
    convert_from(decrypt(decode(ec.smtp_password_encrypted, 'base64'), v_encryption_key, 'aes'), 'UTF8') AS smtp_password,
    ec.from_email,
    ec.from_name,
    ec.is_verified
  FROM fc_email_credentials ec
  WHERE ec.company_id = p_company_id
    AND ec.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Fonction pour tester une configuration email
-- ================================================================
CREATE OR REPLACE FUNCTION fc_mark_email_credential_tested(
  p_company_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE fc_email_credentials
  SET
    is_verified = p_success,
    last_tested_at = NOW(),
    test_status = CASE WHEN p_success THEN 'success' ELSE 'failed' END,
    test_error = p_error,
    updated_at = NOW()
  WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Fonction pour sauvegarder OAuth credentials (Google)
-- ================================================================
CREATE OR REPLACE FUNCTION fc_save_oauth_credential(
  p_company_id UUID,
  p_provider VARCHAR,
  p_from_email VARCHAR,
  p_from_name VARCHAR,
  p_refresh_token TEXT,
  p_access_token TEXT,
  p_token_expiry TIMESTAMPTZ,
  p_scope TEXT
) RETURNS UUID AS $$
DECLARE
  v_credential_id UUID;
  v_encryption_key TEXT;
BEGIN
  -- Clé de chiffrement
  v_encryption_key := 'foxwise-email-encryption-key-2024'; -- CHANGEZ ÇA!

  -- Upsert OAuth credentials
  INSERT INTO fc_email_credentials (
    company_id,
    provider,
    auth_method,
    from_email,
    from_name,
    oauth_refresh_token_encrypted,
    oauth_access_token_encrypted,
    oauth_token_expiry,
    oauth_scope,
    is_verified
  ) VALUES (
    p_company_id,
    p_provider,
    'oauth',
    p_from_email,
    p_from_name,
    encode(encrypt(p_refresh_token::bytea, v_encryption_key, 'aes'), 'base64'),
    encode(encrypt(p_access_token::bytea, v_encryption_key, 'aes'), 'base64'),
    p_token_expiry,
    p_scope,
    true -- OAuth est automatiquement vérifié
  )
  ON CONFLICT (company_id) DO UPDATE SET
    provider = EXCLUDED.provider,
    auth_method = EXCLUDED.auth_method,
    from_email = EXCLUDED.from_email,
    from_name = EXCLUDED.from_name,
    oauth_refresh_token_encrypted = EXCLUDED.oauth_refresh_token_encrypted,
    oauth_access_token_encrypted = EXCLUDED.oauth_access_token_encrypted,
    oauth_token_expiry = EXCLUDED.oauth_token_expiry,
    oauth_scope = EXCLUDED.oauth_scope,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW()
  RETURNING id INTO v_credential_id;

  RETURN v_credential_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Fonction pour récupérer OAuth credentials (déchiffre les tokens)
-- ================================================================
CREATE OR REPLACE FUNCTION fc_get_oauth_credential(
  p_company_id UUID
) RETURNS TABLE (
  id UUID,
  provider VARCHAR,
  from_email VARCHAR,
  from_name VARCHAR,
  refresh_token TEXT,
  access_token TEXT,
  token_expiry TIMESTAMPTZ,
  scope TEXT,
  is_verified BOOLEAN
) AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  v_encryption_key := 'foxwise-email-encryption-key-2024'; -- CHANGEZ ÇA!

  RETURN QUERY
  SELECT
    ec.id,
    ec.provider,
    ec.from_email,
    ec.from_name,
    convert_from(decrypt(decode(ec.oauth_refresh_token_encrypted, 'base64'), v_encryption_key, 'aes'), 'UTF8') AS refresh_token,
    convert_from(decrypt(decode(ec.oauth_access_token_encrypted, 'base64'), v_encryption_key, 'aes'), 'UTF8') AS access_token,
    ec.oauth_token_expiry AS token_expiry,
    ec.oauth_scope AS scope,
    ec.is_verified
  FROM fc_email_credentials ec
  WHERE ec.company_id = p_company_id
    AND ec.auth_method = 'oauth'
    AND ec.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Presets pour les providers populaires
-- ================================================================
CREATE TABLE IF NOT EXISTS fc_email_provider_presets (
  provider VARCHAR(50) PRIMARY KEY,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_secure BOOLEAN DEFAULT true,
  instructions TEXT, -- Instructions pour l'utilisateur
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les presets
INSERT INTO fc_email_provider_presets (provider, smtp_host, smtp_port, smtp_secure, instructions) VALUES
  ('gmail', 'smtp.gmail.com', 587, true,
   'Activez l''authentification à 2 facteurs puis générez un "Mot de passe d''application" dans votre compte Google.'),

  ('outlook', 'smtp-mail.outlook.com', 587, true,
   'Utilisez votre email Outlook/Hotmail et votre mot de passe habituel.'),

  ('office365', 'smtp.office365.com', 587, true,
   'Utilisez votre email Office 365 et votre mot de passe professionnel.'),

  ('yahoo', 'smtp.mail.yahoo.com', 587, true,
   'Générez un mot de passe d''application dans vos paramètres de sécurité Yahoo.')
ON CONFLICT (provider) DO NOTHING;

-- ================================================================
-- Permissions RLS (Row Level Security)
-- ================================================================
ALTER TABLE fc_email_credentials ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (pour éviter les erreurs de duplication)
DROP POLICY IF EXISTS "Users can view their company email credentials" ON fc_email_credentials;
DROP POLICY IF EXISTS "Managers can modify their company email credentials" ON fc_email_credentials;

-- Les utilisateurs ne peuvent voir que les credentials de leur company
-- Note: Comme on utilise Clerk, on désactive temporairement les RLS strictes
-- L'authentification est gérée au niveau de l'API Next.js
CREATE POLICY "Users can view their company email credentials"
  ON fc_email_credentials
  FOR SELECT
  TO authenticated
  USING (true);

-- Seulement les managers peuvent modifier
-- Note: La vérification du rôle manager est faite dans l'API Next.js
CREATE POLICY "Managers can modify their company email credentials"
  ON fc_email_credentials
  FOR ALL
  TO authenticated
  USING (true);

-- ================================================================
-- Commentaires pour la documentation
-- ================================================================
COMMENT ON TABLE fc_email_credentials IS 'Stocke les credentials email SMTP de chaque entreprise de façon sécurisée (mots de passe chiffrés)';
COMMENT ON COLUMN fc_email_credentials.smtp_password_encrypted IS 'Mot de passe SMTP chiffré avec AES-256';
COMMENT ON FUNCTION fc_save_email_credential IS 'Sauvegarde un credential email (chiffre automatiquement le mot de passe)';
COMMENT ON FUNCTION fc_get_email_credential IS 'Récupère un credential email (déchiffre automatiquement le mot de passe)';
