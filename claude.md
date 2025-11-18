# FoxWise - Plateforme de Gestion d'Équipe avec GPS 3D

## Vue d'Ensemble

FoxWise est une plateforme complète de gestion d'équipe en temps réel comprenant deux applications distinctes:
- **FoxWise Client** (port 3010): Application web pour les gestionnaires
- **FoxWise Worker** (port 3020): Application mobile pour les employés

## Caractéristiques Principales

### 🏢 Architecture Multi-Tenant
- Isolation complète des données par compagnie
- Chaque entreprise a son propre espace sécurisé
- Gestion stricte des permissions basée sur company_id
- Row Level Security (RLS) au niveau de la base de données

### 👥 Gestion d'Employés
- Système d'invitation par email avec tokens sécurisés
- Invitations envoyées depuis FoxWise Client
- Lien unique pour télécharger FoxWise Worker
- Assignation automatique à la compagnie du gestionnaire
- Gestion des rôles: Manager vs Employee
- Interface distincte pour chaque type d'utilisateur

### 🗺️ GPS & Navigation 3D
- Navigation GPS en temps réel avec Mapbox
- Mode 3D immersif pour les employés
- Cartes interactives pour visualiser tous les jobs
- Itinéraires optimisés automatiquement
- Guidage vocal turn-by-turn
- Suivi de position en direct pour les gestionnaires

### ⏱️ Suivi Automatique du Temps
- Calcul automatique basé sur le GPS de navigation
- Aucune intervention manuelle requise
- Rapports détaillés par employé
- Rapports détaillés par job
- Tableaux de bord pour les gestionnaires
- Export des données pour la paie

### 📊 Rapports et Analytics
- Tableaux de bord en temps réel
- Analyse de performance par employé
- Suivi des temps de travail
- Visualisation des itinéraires
- Statistiques de productivité
- Rapports exportables

### 💼 Gestion de Clients et Jobs
- Base de données clients centralisée
- Gestion complète des jobs avec statuts
- Assignation de jobs aux employés
- Suivi des priorités et deadlines
- Organisation par secteurs géographiques
- Historique complet par client

### 💰 Gestion Financière
- Suivi des coûts par job
- Gestion des activités avec coûts par défaut
- Calcul de la rentabilité
- Factures et paiements
- Rapports financiers

### 📧 Système d'Email Intelligent
- **Authentification moderne avec Google OAuth 2.0**
- **Envoi de factures par email** aux clients
- **Campagnes email personnalisées** (rappels, promotions, etc.)
- **Architecture dual-path**:
  - OAuth → Gmail API Direct (moderne, plug-and-play)
  - SMTP → n8n Workflow (fallback pour Outlook, custom SMTP)
- **Credentials chiffrés AES-256** dans Supabase
- **Configuration plug-and-play** pour clients non-techniques
- **Personnalisation automatique** avec variables {{client.name}}
- **Support HTML et texte brut**
- **Envoi batch** avec gestion automatique des erreurs
- **Refresh tokens** automatique (pas de réauthentification)

## Stack Technique

### Frontend
- **Framework**: Next.js 15 avec App Router
- **Language**: TypeScript (strict mode)
- **UI**: React avec composants fonctionnels
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Cartes**: Mapbox GL JS
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **ORM**: Supabase Client
- **Security**: Row Level Security (RLS)
- **Email**:
  - Gmail API (googleapis)
  - n8n workflows (automation)
  - Nodemailer (SMTP fallback)
- **Encryption**: PostgreSQL pgcrypto (AES-256)

### Déploiement
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Domain**: fox-wise-client.vercel.app
- **Branches**: claude/* pour développement

## Structure du Projet

```
FoxWise_Client/
├── app/
│   ├── (dashboard)/          # Routes protégées pour gestionnaires
│   │   ├── clients/          # Gestion clients
│   │   ├── jobs/             # Gestion jobs
│   │   ├── activities/       # Gestion activités
│   │   ├── sectors/          # Gestion secteurs
│   │   ├── employees/        # Gestion employés (invitations)
│   │   └── settings/         # Paramètres compagnie + Email config
│   ├── api/                  # API Routes
│   │   ├── activities/       # CRUD activités
│   │   ├── clients/          # CRUD clients
│   │   ├── jobs/             # CRUD jobs
│   │   ├── sectors/          # CRUD secteurs
│   │   ├── employees/        # Gestion employés
│   │   ├── invitations/      # Système d'invitation
│   │   ├── auth/google/      # OAuth 2.0 Google flow
│   │   │   ├── authorize/    # Initie OAuth
│   │   │   └── callback/     # Callback OAuth
│   │   └── emails/           # Envoi d'emails
│   │       ├── send-invoice/ # Factures et rappels
│   │       └── send-campaign/# Campagnes marketing
│   ├── sign-in/              # Page connexion Clerk
│   ├── sign-up/              # Page inscription Clerk
│   └── page.tsx              # Landing page
├── lib/
│   ├── supabase.ts           # Client Supabase
│   ├── company-context.ts    # Contexte multi-tenant
│   ├── gmail-api.ts          # 📧 Gmail API helpers (OAuth)
│   └── utils.ts              # Utilitaires
├── database/
│   └── email_credentials.sql # 📧 Table + fonctions chiffrement
├── n8n-workflows/            # 📧 Workflows n8n (SMTP)
│   ├── GUIDE-SIMPLE.md
│   ├── GUIDE-MULTITENANT.md
│   ├── invoice-workflow.json
│   └── campaign-workflow.json
├── components/               # Composants réutilisables
├── types/                    # Définitions TypeScript
├── supabase/
│   ├── migrations/           # Migrations SQL
│   └── AUTO_MIGRATE.sql      # Script migration automatique
├── GUIDE-GOOGLE-OAUTH-SETUP.md # 📧 Guide config Google OAuth
├── N8N_INTEGRATION_GUIDE.md    # 📧 Guide n8n
└── public/                   # Assets statiques
```

## Base de Données

### Tables Principales

#### fc_companies
- `id` (UUID, PK)
- `name` (VARCHAR)
- `owner_id` (VARCHAR) - Clerk user ID du propriétaire
- `email` (VARCHAR)
- Métadonnées: created_at, updated_at

#### fc_users
- `id` (UUID, PK)
- `clerk_user_id` (VARCHAR, UNIQUE) - ID Clerk
- `company_id` (UUID, FK → fc_companies)
- `email` (VARCHAR)
- `role` (ENUM: manager, employee)
- `full_name` (VARCHAR)
- Métadonnées: created_at, updated_at

#### fc_clients
- `id` (UUID, PK)
- `company_id` (UUID, FK → fc_companies)
- `user_id` (VARCHAR) - Créateur
- `name`, `email`, `phone`, `address`
- `sector_id` (UUID, FK → fc_sectors)
- `latitude`, `longitude` - Coordonnées GPS
- Métadonnées: created_at, updated_at

#### fc_jobs
- `id` (UUID, PK)
- `company_id` (UUID, FK → fc_companies)
- `client_id` (UUID, FK → fc_clients)
- `assigned_to` (VARCHAR) - Employee clerk_user_id
- `title`, `description`
- `status` (ENUM: pending, in_progress, completed, cancelled)
- `priority` (ENUM: low, medium, high)
- `cost`, `scheduled_date`, `completed_date`
- `latitude`, `longitude` - Coordonnées GPS
- Métadonnées: created_at, updated_at

#### fc_activities
- `id` (UUID, PK)
- `company_id` (UUID, FK → fc_companies)
- `user_id` (VARCHAR) - Créateur
- `name`, `description`
- `default_cost` (DECIMAL)
- `color` (VARCHAR) - Code couleur hex
- Métadonnées: created_at, updated_at

#### fc_sectors
- `id` (UUID, PK)
- `company_id` (UUID, FK → fc_companies)
- `name`, `description`
- `color` (VARCHAR)
- Métadonnées: created_at, updated_at

#### fc_invitations
- `id` (UUID, PK)
- `company_id` (UUID, FK → fc_companies)
- `email` (VARCHAR)
- `token` (VARCHAR, UNIQUE) - Token d'invitation
- `status` (ENUM: pending, accepted, expired)
- `invited_by` (VARCHAR) - Manager clerk_user_id
- `expires_at` (TIMESTAMP)
- Métadonnées: created_at, updated_at

#### fc_email_credentials
- `id` (UUID, PK)
- `company_id` (UUID, FK → fc_companies, UNIQUE)
- `provider` (VARCHAR) - 'gmail', 'gmail_oauth', 'outlook', 'smtp_custom'
- `auth_method` (VARCHAR) - 'smtp' ou 'oauth'
- **SMTP Fields** (pour auth_method='smtp'):
  - `smtp_host` (VARCHAR) - ex: smtp.gmail.com
  - `smtp_port` (INTEGER) - ex: 587
  - `smtp_secure` (BOOLEAN) - TLS/SSL
  - `smtp_user` (VARCHAR) - Email address
  - `smtp_password_encrypted` (TEXT) - Mot de passe chiffré AES-256
- **OAuth Fields** (pour auth_method='oauth'):
  - `oauth_refresh_token_encrypted` (TEXT) - Refresh token chiffré
  - `oauth_access_token_encrypted` (TEXT) - Access token chiffré
  - `oauth_token_expiry` (TIMESTAMPTZ) - Expiration de l'access token
  - `oauth_scope` (TEXT) - Scopes OAuth accordés
- **Email Settings**:
  - `from_email` (VARCHAR) - Email "From"
  - `from_name` (VARCHAR) - Nom affiché
- **Status**:
  - `is_verified` (BOOLEAN) - Configuration testée et validée
  - `is_active` (BOOLEAN)
  - `last_tested_at` (TIMESTAMPTZ)
  - `test_status`, `test_error`
- Métadonnées: created_at, updated_at

#### fc_email_provider_presets
- Presets pour Gmail, Outlook, Office365, Yahoo
- Configuration SMTP pré-remplie pour faciliter la configuration

### Sécurité (RLS)

Toutes les tables ont des policies RLS qui assurent:
- Les utilisateurs ne voient que les données de leur compagnie
- Les managers peuvent créer/modifier/supprimer
- Les employés ont accès en lecture seule (sauf leurs jobs assignés)
- Isolation complète entre compagnies

## Flux d'Authentification

### Pour les Gestionnaires
1. Inscription via Clerk sur FoxWise Client
2. Trigger SQL crée automatiquement une company
3. Utilisateur assigné comme manager de sa company
4. Accès complet à toutes les fonctionnalités de gestion

### Pour les Employés
1. Manager envoie invitation via FoxWise Client
2. Email avec lien unique + token envoyé
3. Employé clique sur le lien → télécharge FoxWise Worker
4. S'inscrit via Clerk avec le token d'invitation
5. Automatiquement assigné à la company du manager
6. Rôle: employee avec permissions limitées

## Architecture Email Multi-Tenant

### Vue d'Ensemble

FoxWise offre un système d'email intelligent avec **deux méthodes d'authentification** selon les besoins:

1. **OAuth 2.0 avec Google** (Recommandé ✨)
   - Configuration en 1 clic "Connecter avec Google"
   - Pas de mots de passe à gérer
   - Envoi direct via Gmail API (pas de n8n nécessaire)
   - Expérience moderne type Slack/Notion
   - Refresh automatique des tokens
   - Sécurité maximale

2. **SMTP Custom** (Fallback pour Outlook, etc.)
   - Configuration manuelle SMTP
   - Support de tous les providers email
   - Utilise n8n workflows pour l'envoi
   - Mots de passe chiffrés AES-256 dans Supabase
   - Idéal pour emails professionnels non-Gmail

### Architecture Dual-Path

```
┌─────────────────────────────────────┐
│ Client demande envoi email          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ FoxWise vérifie auth_method         │
│ dans fc_email_credentials           │
└─────────────────────────────────────┘
              ↓
      ┌───────┴───────┐
      ↓               ↓
┌──────────┐    ┌──────────┐
│ OAuth    │    │ SMTP     │
└──────────┘    └──────────┘
      ↓               ↓
┌──────────────────┐ ┌──────────────────┐
│ Gmail API Direct │ │ n8n Workflow     │
│ lib/gmail-api.ts │ │ + Nodemailer     │
└──────────────────┘ └──────────────────┘
      ↓               ↓
   Email envoyé!   Email envoyé!
```

### Fonctions SQL de Sécurité

**Pour OAuth credentials:**
```sql
-- Sauvegarde (chiffre automatiquement)
fc_save_oauth_credential(company_id, provider, email, tokens...)

-- Récupération (déchiffre automatiquement)
fc_get_oauth_credential(company_id)
```

**Pour SMTP credentials:**
```sql
-- Sauvegarde (chiffre automatiquement)
fc_save_email_credential(company_id, smtp_host, port, password...)

-- Récupération (déchiffre automatiquement)
fc_get_email_credential(company_id)
```

### Routes API Email

**`/api/auth/google/authorize`**
- Initie le flow OAuth 2.0 avec Google
- Génère l'URL d'autorisation
- Scopes: gmail.send, userinfo.email, userinfo.profile

**`/api/auth/google/callback`**
- Reçoit le callback OAuth de Google
- Échange le code pour des tokens (refresh + access)
- Chiffre et sauvegarde les tokens dans Supabase
- Redirige vers /settings avec succès

**`/api/emails/send-invoice`**
- Envoie factures ou rappels
- Détecte automatiquement auth_method
- Personnalise avec nom du client
- Support batch (multiple clients)

**`/api/emails/send-campaign`**
- Envoie campagnes marketing/rappels
- Support clientIds 'all' ou liste spécifique
- Variables de personnalisation: {{client.name}}, {{client.email}}
- Détection automatique HTML vs texte brut

### Configuration Client (Settings Page)

**Pour OAuth (Recommandé):**
1. Clic sur "Connecter avec Google"
2. Authentification Google OAuth
3. Autorisation des scopes
4. Tokens sauvegardés automatiquement
5. Prêt à envoyer! ✅

**Pour SMTP:**
1. Sélection du provider (Gmail, Outlook, custom)
2. Presets automatiques pour providers populaires
3. Saisie du mot de passe d'application
4. Test de connexion
5. Sauvegarde chiffrée

### Sécurité Email

- ✅ **Chiffrement AES-256** de tous les credentials
- ✅ **Isolation multi-tenant** stricte (company_id)
- ✅ **Clé de chiffrement** en variable d'environnement
- ✅ **PostgreSQL pgcrypto** pour chiffrement/déchiffrement
- ✅ **RLS policies** pour accès contrôlé
- ✅ **Refresh tokens** stockés chiffrés (OAuth)
- ✅ **Access tokens** auto-refresh (pas de réauth)

### Envoi d'Emails

**Via Gmail API (OAuth):**
```typescript
// lib/gmail-api.ts
sendViaGmailAPI(companyId, oauthCreds, emailData)
sendBatchViaGmailAPI(companyId, oauthCreds, emails[])
```

**Via n8n (SMTP):**
```typescript
// Webhook POST vers n8n avec credentials
{
  smtpHost, smtpPort, smtpUser, smtpPassword,
  recipients, subject, body
}
```

### n8n Workflows

**Invoice Workflow:**
- Reçoit webhook de FoxWise
- Configure SMTP avec credentials du client
- Envoie emails via Nodemailer
- Gère les erreurs et retry

**Campaign Workflow:**
- Même principe que Invoice
- Support envoi batch
- Délai entre emails (anti-spam)
- Tracking des ouvertures (optionnel)

### Variables de Personnalisation

Les emails supportent les variables suivantes:
- `{{client.name}}` - Nom du client
- `{{client.email}}` - Email du client
- `{{company.name}}` - Nom de l'entreprise (futur)
- `{{manager.name}}` - Nom du gestionnaire (futur)

### Gestion des Erreurs

**Gmail API:**
- Auto-refresh des access tokens expirés
- Retry automatique sur erreurs temporaires
- Messages d'erreur en français
- Rapport détaillé (succès/échecs)

**n8n SMTP:**
- Retry configurable dans n8n
- Queue pour emails en attente
- Logs détaillés dans n8n
- Notifications d'échec

## Fonctionnalités Clés par Application

### FoxWise Client (Gestionnaires)

**Dashboard**
- Vue d'ensemble de l'activité
- Statistiques en temps réel
- Jobs actifs et à venir
- Performance de l'équipe

**Gestion Clients**
- CRUD complet
- Coordonnées et informations
- Historique des jobs
- Secteurs et catégorisation
- Localisation GPS sur carte

**Gestion Jobs**
- Création et assignation
- Statuts et priorités
- Suivi des coûts
- Calendrier intégré
- Vue carte interactive

**Gestion Employés**
- Liste des employés
- Inviter nouveaux employés par email
- Gérer les permissions
- Voir l'activité en temps réel
- Rapports de performance

**Rapports**
- Temps de travail par employé
- Temps de travail par job
- Rentabilité et coûts
- Analytics avancés
- Export de données

**Paramètres**
- Gestion de la compagnie
- **Configuration Email** (OAuth Google ou SMTP)
- Activités et tarifs
- Secteurs géographiques
- Préférences utilisateur

**Envoi d'Emails**
- Factures aux clients
- Rappels de paiement
- Campagnes marketing personnalisées
- Support variables {{client.name}}

### FoxWise Worker (Employés)

**Jobs Assignés**
- Liste des jobs à faire
- Détails complets par job
- Navigation GPS vers le job
- Marquer comme complété

**Navigation GPS 3D**
- Mode navigation immersif
- Itinéraire optimisé
- Guidage turn-by-turn
- Vue 3D interactive
- Temps estimé d'arrivée

**Suivi Automatique**
- Le GPS enregistre automatiquement le temps
- Aucune action manuelle requise
- Calcul précis du temps de travail

**Profil**
- Informations personnelles
- Historique des jobs complétés
- Statistiques personnelles

## Migration Multi-Tenant

Le système utilise un script de migration automatique (`AUTO_MIGRATE.sql`) qui:

1. Trouve les utilisateurs sans company_id
2. Crée une company pour chaque manager
3. Assigne la company au manager
4. Migre toutes les données existantes
5. Assure l'intégrité des données

**Pour migrer manuellement:**
```sql
-- Exécuter dans Supabase SQL Editor
-- Voir: supabase/AUTO_MIGRATE.sql
```

## Variables d'Environnement

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

# App URLs
NEXT_PUBLIC_APP_URL=https://fox-wise-client.vercel.app
NEXT_PUBLIC_WORKER_APP_URL=[URL FoxWise Worker]

# Google OAuth (pour email Gmail)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
# Voir GUIDE-GOOGLE-OAUTH-SETUP.md pour configuration

# n8n Integration (optionnel, pour SMTP)
N8N_WEBHOOK_URL_INVOICE=https://votre-n8n.com/webhook/invoice
N8N_WEBHOOK_URL_CAMPAIGN=https://votre-n8n.com/webhook/campaign
N8N_API_KEY=votre-cle-api-secrete
# Note: OAuth users n'ont PAS besoin de n8n!

# Email Encryption
# IMPORTANT: Générer avec: openssl rand -base64 32
EMAIL_ENCRYPTION_KEY=votre-cle-de-chiffrement-tres-secrete
```

## Installation et Développement

### FoxWise Client

```bash
# Cloner le repo
git clone https://github.com/hash23code/FoxWise_Client.git
cd FoxWise_Client

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# Lancer en développement
npm run dev

# Build pour production
npm run build
npm start
```

### FoxWise Worker

```bash
# Cloner le repo
git clone https://github.com/hash23code/FoxWise_Worker.git
cd FoxWise_Worker

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# Lancer en développement
npm run dev

# Build pour production
npm run build
npm start
```

## Configuration Email

### Option 1: Google OAuth (Recommandé) ⚡

**Étape 1: Créer OAuth Client ID dans Google Cloud Console**

Suivre le guide détaillé: `GUIDE-GOOGLE-OAUTH-SETUP.md`

1. Aller sur https://console.cloud.google.com
2. Créer un projet (ou sélectionner existant)
3. Activer Gmail API
4. Créer OAuth Client ID (Web application)
5. Ajouter redirect URI: `https://votre-domaine.com/api/auth/google/callback`
6. Copier Client ID et Client Secret

**Étape 2: Configurer Variables d'Environnement**

```env
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

**Étape 3: Exécuter SQL dans Supabase**

```bash
# Exécuter dans Supabase SQL Editor
database/email_credentials.sql
```

**Étape 4: Connecter dans l'Application**

1. Aller dans Settings
2. Cliquer "Connecter avec Google"
3. Autoriser l'accès Gmail
4. Done! Prêt à envoyer 🎉

**Avantages:**
- ✅ Configuration en 1 clic pour le client
- ✅ Pas de mots de passe à gérer
- ✅ Tokens auto-refresh
- ✅ Gmail API direct (rapide et fiable)
- ✅ Pas besoin de n8n

### Option 2: SMTP avec n8n (Pour Outlook, etc.)

**Étape 1: Installer n8n**

```bash
# Docker (recommandé)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Ou npm global
npm install n8n -g
n8n start
```

**Étape 2: Importer Workflows**

1. Ouvrir n8n (http://localhost:5678)
2. Aller dans Workflows
3. Importer les fichiers JSON:
   - `n8n-workflows/invoice-workflow.json`
   - `n8n-workflows/campaign-workflow.json`

**Étape 3: Configurer Webhooks**

1. Dans n8n, copier les URLs webhook
2. Ajouter dans .env:

```env
N8N_WEBHOOK_URL_INVOICE=https://n8n.votredomaine.com/webhook/invoice
N8N_WEBHOOK_URL_CAMPAIGN=https://n8n.votredomaine.com/webhook/campaign
N8N_API_KEY=votre-cle-api-generee
```

**Étape 4: Générer Clé de Chiffrement**

```bash
openssl rand -base64 32
```

Ajouter dans .env:
```env
EMAIL_ENCRYPTION_KEY=la-cle-generee-ici
```

**Étape 5: Exécuter SQL dans Supabase**

```bash
# Exécuter dans Supabase SQL Editor
database/email_credentials.sql
```

**Étape 6: Configuration Client**

1. Aller dans Settings
2. Choisir provider (Gmail, Outlook, Custom)
3. Entrer SMTP credentials
4. Tester connexion
5. Sauvegarder (chiffrement automatique)

**Note:** Les guides détaillés sont disponibles dans:
- `N8N_INTEGRATION_GUIDE.md` - Guide général
- `n8n-workflows/GUIDE-SIMPLE.md` - Pour configuration simple
- `n8n-workflows/GUIDE-MULTITENANT.md` - Pour multi-tenant complet

## Déploiement

### Vercel (Recommandé)

**FoxWise Client:**
1. Connecter le repo GitHub à Vercel
2. Configurer les variables d'environnement
3. Déploiement automatique sur push

**FoxWise Worker:**
1. Même processus que Client
2. Utiliser un projet Vercel séparé

### Variables d'Environnement Vercel

Configurer dans le dashboard Vercel:
- Toutes les variables listées ci-dessus
- `NODE_ENV=production`

## Tarification

### Plan Mensuel - $39.99/mois
- Employés illimités
- GPS 3D Navigation
- Rapports complets
- Support prioritaire
- Multi-tenant
- Mises à jour incluses

### Plan Annuel - $29.99/mois (facturation annuelle)
- Tout du plan mensuel
- 2 mois gratuits (économie 25%)
- Accès anticipé aux nouvelles fonctionnalités
- Support VIP
- Garantie satisfaction 30 jours
- Total: $359.88/an

## Disponibilité

**En Production:**
- ✅ Application web (Vercel)
- ✅ Dashboard gestionnaires
- ✅ API complète

**Bientôt Disponible:**
- 📱 Google Play Store (FoxWise Worker)
- 📱 Apple App Store (FoxWise Worker)
- 📱 Google Play Store (FoxWise Client)
- 📱 Apple App Store (FoxWise Client)

## Sécurité

### Authentification
- Clerk OAuth 2.0
- Sessions sécurisées
- MFA disponible
- SSO enterprise

### Base de Données
- Row Level Security (RLS)
- Chiffrement au repos
- Chiffrement en transit (SSL/TLS)
- Backups automatiques

### API
- Validation stricte des entrées
- Protection CSRF
- Rate limiting
- Logs d'audit

### Données
- Isolation multi-tenant stricte
- Conforme RGPD
- Données appartiennent au client
- Suppression complète possible

## Support et Contact

**Email:** support@foxwise.app
**Documentation:** https://docs.foxwise.app
**GitHub Issues:** https://github.com/hash23code/FoxWise_Client/issues

## Roadmap

### Q1 2025 ✅ COMPLÉTÉ
- ✅ Multi-tenant architecture
- ✅ Gestion d'employés avec invitations
- ✅ GPS Navigation 3D immersive
- ✅ Suivi automatique du temps
- ✅ Rapports gestionnaires détaillés
- ✅ **Google OAuth 2.0 pour emails**
- ✅ **Envoi de factures par email**
- ✅ **Campagnes email personnalisées**
- ✅ **Architecture dual-path (OAuth/SMTP)**
- ✅ **Intégration n8n workflows**
- ✅ **Encryption AES-256 des credentials**

### Q2 2025
- 📱 Publication sur Google Play Store
- 📱 Publication sur App Store
- 🔔 Notifications push
- 📊 Analytics avancés
- 💬 Chat intégré équipe
- 📧 Templates d'emails personnalisables
- 📧 Tracking d'ouverture emails

### Q3 2025
- 🤖 Intelligence artificielle pour optimisation itinéraires
- 📸 Photos de jobs avec géolocalisation
- ✍️ Signatures électroniques clients
- 📄 Génération automatique de factures PDF
- 🌐 Support multilingue
- 📧 Intégration Outlook OAuth
- 📧 Scheduling d'emails avancé

### Q4 2025
- 🎯 Optimisation de zones de travail par IA
- 📈 Prédictions de temps et coûts
- 🔗 Intégrations tierces (QuickBooks, etc.)
- 🌍 Expansion internationale
- 📧 A/B testing pour campagnes email
- 📧 Email analytics et rapports

## Contribution

Les contributions sont les bienvenues! Veuillez:
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## License

Copyright © 2025 FoxWise. Tous droits réservés.

## Crédits

**Développement:** Claude Code & Hash23
**Design:** FoxWise Design Team
**Technologies:** Next.js, Supabase, Clerk, Mapbox
