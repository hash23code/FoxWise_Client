# ⚠️ URGENT - Action Requise

## Problème Actuel

Votre application retourne des erreurs **403 Forbidden** car le système multi-tenant a été implémenté mais la **migration SQL n'a PAS encore été appliquée** dans votre base de données Supabase.

## ✅ Solution Temporaire (DÉJÀ APPLIQUÉE)

J'ai ajouté un **mode de compatibilité legacy** qui permet à l'app de fonctionner même sans la migration. Votre app devrait maintenant fonctionner normalement.

**Note:** En mode legacy, il n'y a PAS d'isolation multi-tenant. Toutes les données sont partagées (comme avant).

## 🚀 Solution Permanente - Appliquer la Migration SQL

Pour activer le vrai système multi-tenant, vous devez appliquer la migration SQL:

### Étape 1: Accéder à Supabase Dashboard

1. Allez sur https://dashboard.supabase.com
2. Sélectionnez votre projet FoxWise
3. Dans le menu de gauche, cliquez sur **SQL Editor**

### Étape 2: Exécuter la Migration

1. Ouvrez le fichier: `supabase/migrations/001_add_multi_tenant_support.sql`
2. Copiez TOUT le contenu du fichier
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **RUN** (en bas à droite)

### Étape 3: Vérification

Exécutez ces requêtes pour vérifier que tout fonctionne:

```sql
-- Vérifier que la table fc_companies existe
SELECT COUNT(*) FROM fc_companies;

-- Vérifier que la colonne company_id existe dans fc_jobs
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fc_jobs'
AND column_name = 'company_id';

-- Vérifier que votre utilisateur a une company
SELECT id, email, company_id, role FROM fc_users;
```

### Étape 4: Assigner une Company aux Utilisateurs Existants

Si vous avez des utilisateurs existants, ils n'auront pas de company_id. Vous devez leur en assigner une:

```sql
-- Créer une company pour votre compte principal
INSERT INTO fc_companies (name, owner_id, email)
VALUES ('Ma Compagnie', 'votre_clerk_user_id', 'votre@email.com')
RETURNING id;

-- Copier l'ID retourné, puis mettre à jour vos utilisateurs
UPDATE fc_users
SET company_id = 'ID_DE_LA_COMPANY_CI_DESSUS'
WHERE email = 'votre@email.com';

-- Mettre à jour tous vos clients existants avec la company_id
UPDATE fc_clients
SET company_id = 'ID_DE_LA_COMPANY_CI_DESSUS'
WHERE company_id IS NULL;

-- Mettre à jour tous vos jobs existants
UPDATE fc_jobs
SET company_id = 'ID_DE_LA_COMPANY_CI_DESSUS'
WHERE company_id IS NULL;

-- Mettre à jour tous vos secteurs
UPDATE fc_sectors
SET company_id = 'ID_DE_LA_COMPANY_CI_DESSUS'
WHERE company_id IS NULL;

-- Mettre à jour toutes vos activités
UPDATE fc_activities
SET company_id = 'ID_DE_LA_COMPANY_CI_DESSUS'
WHERE company_id IS NULL;
```

## 📋 Checklist

- [ ] Migration SQL appliquée
- [ ] Table `fc_companies` créée
- [ ] Colonne `company_id` ajoutée à toutes les tables
- [ ] Company créée pour votre compte
- [ ] Utilisateurs existants assignés à la company
- [ ] Données existantes (clients, jobs, etc.) assignées à la company
- [ ] App testée et fonctionnelle

## 🎯 Après la Migration

Une fois la migration appliquée:
1. ✅ Le mode "legacy" sera automatiquement désactivé
2. ✅ Votre app fonctionnera en mode multi-tenant
3. ✅ Vous pourrez inviter des employés
4. ✅ Chaque company sera isolée
5. ✅ Vous pourrez déployer FoxWise_Worker

## ❓ Besoin d'Aide?

Si vous rencontrez des problèmes:
1. Vérifiez les erreurs dans la console Supabase
2. Assurez-vous que toutes les requêtes SQL s'exécutent sans erreur
3. Vérifiez que votre utilisateur a bien un `company_id` dans `fc_users`

---

**Date:** 2025-01-16
**Status:** Mode Legacy Actif (temporaire)
**Action requise:** Appliquer la migration SQL
