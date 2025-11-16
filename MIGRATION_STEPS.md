# 🚀 Migration Multi-Tenant - Guide d'Application

## Étape 1: Appliquer le SQL dans Supabase

1. **Ouvrir Supabase Dashboard:**
   - https://dashboard.supabase.com
   - Sélectionnez votre projet FoxWise

2. **SQL Editor:**
   - Menu gauche → SQL Editor
   - Cliquez "New Query"

3. **Copier/Coller le SQL:**
   - Ouvrez: `supabase/migrations/001_add_multi_tenant_support.sql`
   - Copiez TOUT le contenu
   - Collez dans l'éditeur SQL

4. **Exécuter:**
   - Cliquez "RUN" (en bas à droite)
   - Attendez le message de succès

## Étape 2: Vérifier que la Migration a Fonctionné

Exécutez ces requêtes dans SQL Editor:

```sql
-- Vérifier que fc_companies existe
SELECT COUNT(*) FROM fc_companies;

-- Vérifier que company_id existe dans fc_users
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fc_users'
AND column_name = 'company_id';

-- Vérifier que company_id existe dans fc_jobs
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fc_jobs'
AND column_name = 'company_id';
```

Si tout retourne des résultats → ✅ Migration réussie!

## Étape 3: Créer Votre Company

Trouvez votre `clerk_user_id` dans la table `fc_users`:

```sql
-- Voir vos utilisateurs
SELECT id, email, clerk_user_id, company_id FROM fc_users;
```

Créez une company:

```sql
-- Remplacez YOUR_CLERK_USER_ID et YOUR_EMAIL
INSERT INTO fc_companies (name, owner_id, email)
VALUES ('Ma Compagnie', 'YOUR_CLERK_USER_ID', 'YOUR_EMAIL')
RETURNING id;
```

**Copiez l'ID retourné!**

## Étape 4: Assigner la Company à Votre Utilisateur

```sql
-- Remplacez COMPANY_ID et YOUR_EMAIL
UPDATE fc_users
SET company_id = 'COMPANY_ID'
WHERE email = 'YOUR_EMAIL';
```

Vérifiez:

```sql
SELECT id, email, company_id FROM fc_users WHERE email = 'YOUR_EMAIL';
```

Vous devriez voir un `company_id` maintenant!

## Étape 5: Assigner la Company à Vos Données Existantes

```sql
-- Remplacez COMPANY_ID avec votre ID de company

-- Clients
UPDATE fc_clients
SET company_id = 'COMPANY_ID'
WHERE company_id IS NULL;

-- Jobs
UPDATE fc_jobs
SET company_id = 'COMPANY_ID'
WHERE company_id IS NULL;

-- Sectors
UPDATE fc_sectors
SET company_id = 'COMPANY_ID'
WHERE company_id IS NULL;

-- Activities
UPDATE fc_activities
SET company_id = 'COMPANY_ID'
WHERE company_id IS NULL;

-- Job Types
UPDATE fc_job_types
SET company_id = 'COMPANY_ID'
WHERE company_id IS NULL;
```

## Étape 6: Vérification Finale

```sql
-- Compter vos données avec company_id
SELECT
  (SELECT COUNT(*) FROM fc_clients WHERE company_id = 'COMPANY_ID') as clients,
  (SELECT COUNT(*) FROM fc_jobs WHERE company_id = 'COMPANY_ID') as jobs,
  (SELECT COUNT(*) FROM fc_sectors WHERE company_id = 'COMPANY_ID') as sectors,
  (SELECT COUNT(*) FROM fc_activities WHERE company_id = 'COMPANY_ID') as activities;
```

Tous les comptes devraient correspondre à vos données!

## ✅ C'est Fait!

Votre application devrait maintenant fonctionner en mode multi-tenant.

**Redémarrez votre application** et connectez-vous. Plus d'erreurs 403!

---

## ⚠️ Important

- **Sauvegardez votre COMPANY_ID** quelque part
- Tous les nouveaux managers créent automatiquement leur propre company (trigger SQL)
- Les employés sont invités et rattachés à la company du manager
- Chaque company voit uniquement ses propres données

## 🐛 Dépannage

**Erreur 403 "User not found or no company assigned":**
- Vérifiez que votre utilisateur a bien un `company_id` dans `fc_users`
- Vérifiez les logs de la console: cherchez "CRITICAL: User has no company_id"

**"relation fc_geolocation does not exist":**
- ✅ Déjà corrigé dans la migration version finale

**Autres erreurs SQL:**
- Vérifiez que toutes les tables existent: `fc_users`, `fc_clients`, `fc_jobs`, etc.
- La migration utilise `IF EXISTS` pour les tables optionnelles
