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
│   │   └── settings/         # Paramètres compagnie
│   ├── api/                  # API Routes
│   │   ├── activities/       # CRUD activités
│   │   ├── clients/          # CRUD clients
│   │   ├── jobs/             # CRUD jobs
│   │   ├── sectors/          # CRUD secteurs
│   │   ├── employees/        # Gestion employés
│   │   └── invitations/      # Système d'invitation
│   ├── sign-in/              # Page connexion Clerk
│   ├── sign-up/              # Page inscription Clerk
│   └── page.tsx              # Landing page
├── lib/
│   ├── supabase.ts           # Client Supabase
│   ├── company-context.ts    # Contexte multi-tenant
│   └── utils.ts              # Utilitaires
├── components/               # Composants réutilisables
├── types/                    # Définitions TypeScript
├── supabase/
│   ├── migrations/           # Migrations SQL
│   └── AUTO_MIGRATE.sql      # Script migration automatique
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
- Activités et tarifs
- Secteurs géographiques
- Préférences utilisateur

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

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

# App URLs
NEXT_PUBLIC_APP_URL=https://fox-wise-client.vercel.app
NEXT_PUBLIC_WORKER_APP_URL=[URL FoxWise Worker]
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

### Q1 2025
- ✅ Multi-tenant architecture
- ✅ Gestion d'employés
- ✅ GPS Navigation 3D
- ✅ Suivi automatique du temps
- ✅ Rapports gestionnaires

### Q2 2025
- 📱 Publication sur Google Play Store
- 📱 Publication sur App Store
- 🔔 Notifications push
- 📊 Analytics avancés
- 💬 Chat intégré équipe

### Q3 2025
- 🤖 Intelligence artificielle pour optimisation itinéraires
- 📸 Photos de jobs avec géolocalisation
- ✍️ Signatures électroniques clients
- 📄 Génération automatique de factures
- 🌐 Support multilingue

### Q4 2025
- 🎯 Optimisation de zones de travail par IA
- 📈 Prédictions de temps et coûts
- 🔗 Intégrations tierces (QuickBooks, etc.)
- 🌍 Expansion internationale

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
