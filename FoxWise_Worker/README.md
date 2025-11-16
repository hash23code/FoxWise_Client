# FoxWise Worker

Application employé pour la gestion de tâches et le suivi de travaux dans l'écosystème FoxWise.

## 🎯 Description

FoxWise Worker est l'application mobile-first destinée aux employés. Elle permet de :

- 📋 Consulter les jobs assignés
- 🗺️ Naviguer vers les clients avec GPS
- ✅ Mettre à jour l'état des tâches
- 👤 Gérer son profil

## 🏗️ Architecture Multi-tenant

Cette application fait partie d'un écosystème multi-tenant :

- **FoxWise_Client** (Manager) : Gestion complète des clients, jobs et employés
- **FoxWise_Worker** (Employé) : Vue simplifiée pour les tâches assignées
- Base de données partagée avec isolation par `company_id`
- Authentification Clerk partagée

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Clerk
- Base de données Supabase (partagée avec FoxWise_Client)

### Configuration

1. Cloner le projet :
```bash
cd /home/user/FoxWise_Worker
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :

Créer un fichier `.env.local` :

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase (PARTAGÉ avec FoxWise_Client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3020
```

4. Lancer l'application :
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3020`

## 📱 Fonctionnalités

### Dashboard

- Vue d'ensemble des jobs assignés
- Filtres par statut (En attente, En cours, Terminé)
- Statistiques en temps réel

### Détails du Job

- Informations complètes sur le job
- Contact client (téléphone, email)
- Navigation GPS vers l'adresse du client
- Mise à jour du statut :
  - En attente → En cours
  - En cours → Terminé
  - Possibilité de rouvrir un job terminé

### Navigation GPS

- Intégration avec Google Maps
- Support mobile et desktop
- Ouverture automatique de l'app native sur mobile

### Profil

- Affichage des informations personnelles
- Rôle et permissions
- Date d'inscription

## 🔐 Permissions

Les employés ont accès uniquement à :

- ✅ Leurs jobs assignés (lecture + mise à jour de statut)
- ✅ Leur profil (lecture)

Les employés N'ONT PAS accès à :

- ❌ Gestion des clients
- ❌ Création de jobs
- ❌ Gestion d'autres employés
- ❌ Statistiques globales
- ❌ Configuration de l'entreprise

## 🎨 Design

- **Couleurs principales** : Purple (#8b5cf6) et Pink (#ec4899)
- **Design system** : Tailwind CSS
- **Interface** : Mobile-first, responsive
- **Thème** : Dark mode

## 🔗 APIs Utilisées

L'application utilise les APIs suivantes :

- `GET /api/jobs` - Récupérer les jobs assignés (filtré par employee)
- `PUT /api/jobs?id={id}` - Mettre à jour le statut d'un job
- `GET /api/profile` - Récupérer le profil de l'employé

Les APIs partagent la même base de données que FoxWise_Client avec filtrage automatique par `company_id`.

## 🚦 Différences avec FoxWise_Client

| Fonctionnalité | FoxWise_Client (Manager) | FoxWise_Worker (Employé) |
|----------------|--------------------------|--------------------------|
| Port | 3010 | 3020 |
| Couleurs | Orange/Red | Purple/Pink |
| Gestion clients | ✅ | ❌ |
| Gestion jobs | ✅ Création/Suppression | ✅ Mise à jour statut |
| Gestion employés | ✅ | ❌ |
| Invitations | ✅ Envoyer | ✅ Accepter |
| Navigation GPS | ❌ | ✅ |
| Statistiques | ✅ Globales | ✅ Personnelles |

## 📦 Structure du Projet

```
FoxWise_Worker/
├── app/
│   ├── dashboard/
│   │   ├── jobs/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Détails du job
│   │   ├── profile/
│   │   │   └── page.tsx          # Profil employé
│   │   ├── layout.tsx            # Layout dashboard
│   │   └── page.tsx              # Liste des jobs
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx          # Page de connexion
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx          # Page d'inscription
│   ├── api/
│   │   ├── jobs/
│   │   │   └── route.ts          # API jobs
│   │   └── profile/
│   │       └── route.ts          # API profile
│   ├── globals.css               # Styles globaux
│   ├── layout.tsx                # Layout racine
│   └── page.tsx                  # Page d'accueil
├── lib/
│   ├── supabase.ts               # Client Supabase
│   └── company-context.ts        # Helpers multi-tenant
├── types/
│   └── index.ts                  # Types TypeScript
├── middleware.ts                 # Middleware Clerk
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 Workflow d'Invitation

1. Un manager invite un employé depuis FoxWise_Client
2. L'employé reçoit un email avec un lien d'invitation
3. L'employé clique sur le lien et crée son compte
4. Le compte est automatiquement lié à l'entreprise du manager
5. L'employé peut se connecter à FoxWise_Worker
6. Il voit uniquement les jobs qui lui sont assignés

## 🧪 Tests

Pour tester l'application :

1. Créer un compte manager dans FoxWise_Client
2. Inviter un employé depuis l'interface manager
3. Accepter l'invitation et créer un compte employé
4. Se connecter à FoxWise_Worker avec le compte employé
5. Vérifier que seuls les jobs assignés apparaissent

## 📝 Notes Importantes

- **Port** : L'application tourne sur le port 3020 (vs 3010 pour Client)
- **Base de données** : Partagée avec FoxWise_Client
- **Authentification** : Même instance Clerk que FoxWise_Client
- **Isolation** : Les données sont isolées par `company_id`
- **Navigation** : Utilise Google Maps pour la navigation GPS

## 🐛 Dépannage

### L'employé ne voit aucun job

- Vérifier que des jobs lui ont été assignés dans FoxWise_Client
- Vérifier que le `company_id` de l'employé correspond à celui des jobs
- Vérifier les logs de la console pour les erreurs API

### Erreur 401 Unauthorized

- Vérifier que les clés Clerk sont correctement configurées
- Vérifier que l'utilisateur est bien connecté
- Vider le cache du navigateur

### La navigation GPS ne fonctionne pas

- Vérifier que l'adresse du client est bien renseignée
- Sur mobile, autoriser l'ouverture de liens externes
- Vérifier la connexion internet

## 📄 Licence

© 2025 FoxWise. Tous droits réservés.
