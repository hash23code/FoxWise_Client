# FoxWise Client 🦊

Application complète de gestion de clients avec intelligence artificielle pour entreprises de services.

## 🌟 Fonctionnalités

### ✅ Implémentées
- **Gestion Clients** : Liste complète des clients par secteur avec toutes les informations
- **Gestion Jobs** : Attribution de jobs aux employés, suivi du statut et des priorités
- **Dashboard** : Vue d'ensemble avec statistiques en temps réel
- **Authentification** : Système sécurisé avec Clerk (Manager/Employé)
- **Design FoxWise** : Interface moderne avec les couleurs et le style de la famille FoxWise

### 🚧 En Développement
- **Calendrier** : Planification des événements et jobs
- **Paiements** : Suivi des paiements clients et revenus
- **Emails** : Envoi d'emails groupés via n8n workflow
- **Chat Interne** : Communication d'équipe en temps réel

## 🏗️ Architecture

### Web (Next.js)
```
web/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/      # Tableau de bord
│   │   ├── clients/        # Gestion clients
│   │   ├── jobs/           # Gestion jobs
│   │   ├── calendar/       # Calendrier
│   │   ├── payments/       # Paiements
│   │   ├── emails/         # Emails
│   │   ├── chat/           # Chat
│   │   └── settings/       # Paramètres
│   ├── api/
│   │   ├── clients/        # API clients
│   │   ├── jobs/           # API jobs
│   │   ├── stats/          # API statistiques
│   │   └── ...
│   ├── sign-in/            # Connexion
│   ├── sign-up/            # Inscription
│   └── globals.css
├── components/
│   └── Sidebar.tsx         # Navigation principale
├── lib/
│   └── supabase.ts         # Client Supabase
├── types/
│   └── index.ts            # Types TypeScript
└── database_schema.sql     # Schéma de base de données
```

### Mobile (À venir)
- React Native avec Expo
- Design synchronisé avec l'app web

## 🗄️ Base de Données

### Tables Principales

**fc_users**
- Gestion des utilisateurs avec rôles (Manager/Employé)
- Lié à Clerk pour l'authentification

**fc_clients**
- Informations complètes des clients
- Organisation par secteur (Résidentiel, Commercial, Industriel, etc.)
- Statut (Actif, Inactif, Prospect)

**fc_jobs**
- Jobs assignables aux employés
- Priorités et statuts
- Suivi des paiements
- Lié aux clients et types de jobs

**fc_sectors**
- Catégorisation des clients par secteur

**fc_job_types**
- Types de services offerts (Consultation, Installation, Maintenance, etc.)

**fc_calendar_events**
- Événements et planification

**fc_conversations & fc_chat_messages**
- Système de chat interne (groupe et privé)

**fc_email_logs**
- Historique des emails envoyés

## 🚀 Installation

### Prérequis
- Node.js 18+
- Compte Supabase
- Compte Clerk
- (Optionnel) n8n pour les workflows d'emails

### Configuration Web

1. **Installer les dépendances**
   ```bash
   cd web
   npm install
   ```

2. **Configurer les variables d'environnement**

   Le fichier `.env.local` est déjà configuré avec :
   - Clerk (Authentication)
   - Supabase (Database)
   - OpenAI (AI features)
   - n8n Webhook URL (à configurer)

3. **Créer les tables dans Supabase**

   Exécutez le fichier `database_schema.sql` dans votre SQL Editor Supabase :
   ```bash
   # Copiez le contenu de database_schema.sql
   # Allez dans Supabase Dashboard > SQL Editor
   # Collez et exécutez le script
   ```

4. **Lancer l'application**
   ```bash
   npm run dev
   ```

   L'application sera disponible sur `http://localhost:3010`

## 🎨 Design

L'application utilise le même design que FoxWise ToDo :
- **Couleurs principales** : Orange (#F97316) → Rouge (#EF4444)
- **Thème** : Dark mode avec fond noir (#0a0a0a)
- **Dégradés colorés** : Pour chaque section
- **Animations** : Framer Motion pour les transitions

## 📱 Applications FoxWise

FoxWise Client fait partie d'un écosystème d'applications :

1. **FoxWise ToDo** : Gestion de tâches et projets
2. **FoxWise Finance** : Gestion financière (à venir)
3. **FoxWise Client** : Gestion de clients (cette app)

Ces applications seront interconnectées pour une gestion complète de votre entreprise.

## 🔐 Authentification et Rôles

### Manager
- Accès complet à toutes les fonctionnalités
- Peut gérer les clients, jobs, paiements
- Peut assigner des jobs aux employés
- Accès au système d'emails

### Employé
- Accès limité aux fonctionnalités
- Peut voir les jobs assignés
- Peut communiquer via le chat
- Peut consulter les clients

## 🛠️ Technologies

### Web
- **Framework** : Next.js 14
- **UI** : TailwindCSS + Framer Motion
- **Auth** : Clerk
- **Database** : Supabase (PostgreSQL)
- **Icons** : Lucide React
- **Charts** : Recharts
- **AI** : OpenAI API

### À venir - Mobile
- **Framework** : React Native + Expo
- **Navigation** : Expo Router
- **Auth** : Clerk Expo
- **Styling** : NativeWind (Tailwind for RN)

## 🔄 Intégration n8n

Pour activer l'envoi d'emails via n8n :

1. Créez un workflow n8n avec un webhook trigger
2. Configurez votre service email (SendGrid, Resend, etc.)
3. Ajoutez l'URL du webhook dans `.env.local` :
   ```
   N8N_WEBHOOK_URL=https://votre-n8n.com/webhook/send-email
   ```

Le workflow devrait accepter :
- `client_ids[]` : Array d'IDs clients
- `subject` : Sujet de l'email
- `content` : Contenu de l'email
- `sent_by` : ID de l'utilisateur

## 📊 Statistiques Dashboard

Le dashboard affiche en temps réel :
- Total de clients (et clients actifs)
- Jobs en cours vs complétés
- Paiements en attente
- Revenu total et en attente

## 🚀 Prochaines Étapes

1. ✅ Application Web de base
2. 🚧 Application Mobile (Expo)
3. 🚧 Système de calendrier interactif
4. 🚧 Intégration complète n8n pour emails
5. 🚧 Chat en temps réel avec WebSockets
6. 🚧 Système de paiements et facturation
7. 🔮 Intégration avec FoxWise ToDo et Finance
8. 🔮 Rapports et analytics avancés
9. 🔮 Notifications push mobiles

## 📝 Notes

- Port par défaut : **3010** (pour éviter les conflits avec FoxWise ToDo sur 3000)
- Base de données partagée avec FoxWise ToDo
- Les préfixes de tables `fc_*` évitent les conflits

## 🤝 Support

Pour toute question ou problème, consultez la documentation des services utilisés :
- [Next.js](https://nextjs.org/docs)
- [Clerk](https://clerk.com/docs)
- [Supabase](https://supabase.com/docs)
- [n8n](https://docs.n8n.io)

---

**Développé avec ❤️ par Claude pour la suite FoxWise**
