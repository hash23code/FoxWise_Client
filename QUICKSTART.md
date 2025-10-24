# 🚀 Quick Start Guide - FoxWise Client

## Démarrage Rapide (5 minutes)

### 1. Configuration de la Base de Données

**Important** : Exécutez le schéma de base de données dans Supabase

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet `FoxWise`
3. Allez dans **SQL Editor**
4. Cliquez sur **New Query**
5. Copiez-collez tout le contenu de `web/database_schema.sql`
6. Cliquez sur **Run** (▶️)

Cela va créer :
- ✅ 9 tables (fc_users, fc_clients, fc_jobs, etc.)
- ✅ Indexes pour la performance
- ✅ Row Level Security (RLS)
- ✅ Données de test (secteurs et types de jobs)

### 2. Lancer l'Application Web

```bash
cd web
npm run dev
```

L'application démarre sur : **http://localhost:3010**

### 3. Premier Utilisateur

1. Visitez http://localhost:3010
2. Cliquez sur **Sign Up**
3. Créez votre compte (automatiquement configuré comme Manager)
4. Vous serez redirigé vers le dashboard

### 4. Ajouter Votre Premier Client

1. Dans le sidebar, cliquez sur **Clients**
2. Cliquez sur **Nouveau Client**
3. Remplissez les informations :
   - Nom de l'entreprise
   - Nom du contact
   - Email
   - Téléphone
   - Secteur (Résidentiel, Commercial, etc.)
4. Cliquez sur **Sauvegarder**

### 5. Créer un Job

1. Dans le sidebar, cliquez sur **Jobs**
2. Cliquez sur **Nouveau Job**
3. Remplissez :
   - Titre du job
   - Client
   - Type de service
   - Priorité
   - Montant
4. Assignez à un employé (vous pour l'instant)
5. Cliquez sur **Créer**

## 🎯 Prochaines Étapes

### Configuration Optionnelle

#### Configurer n8n pour les Emails

1. Installez n8n : `npm install -g n8n`
2. Lancez n8n : `n8n start`
3. Créez un workflow avec :
   - **Webhook Trigger** (GET/POST)
   - **Email Node** (SendGrid, Gmail, etc.)
4. Copiez l'URL du webhook
5. Ajoutez dans `.env.local` :
   ```
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/send-email
   ```

#### Inviter des Employés

1. Allez dans **Paramètres** > **Équipe**
2. Cliquez sur **Inviter un employé**
3. Entrez l'email
4. L'employé recevra une invitation

### Données de Test

Pour tester rapidement, vous pouvez créer :

**Clients de test :**
- ABC Construction (Commercial)
- Résidence Dubois (Résidentiel)
- Usine Martin (Industriel)

**Jobs de test :**
- Installation système - ABC Construction
- Consultation - Résidence Dubois
- Maintenance préventive - Usine Martin

## 🎨 Personnalisation

### Changer les Secteurs

1. Dans Supabase, allez à **Table Editor** > `fc_sectors`
2. Ajoutez/modifiez les secteurs selon vos besoins
3. Changez les couleurs (format hex: #RRGGBB)

### Changer les Types de Jobs

1. Dans Supabase, allez à **Table Editor** > `fc_job_types`
2. Ajoutez vos types de services
3. Personnalisez les couleurs

## 📱 Application Mobile (Bientôt)

L'application mobile sera disponible prochainement avec :
- Même design que la version web
- Notifications push
- Mode hors ligne
- Scanner de codes QR pour les clients

## 🐛 Dépannage

### L'application ne démarre pas
```bash
# Vérifiez que le port 3010 est libre
netstat -ano | findstr :3010

# Si occupé, changez le port dans package.json
"dev": "next dev -p 3011"
```

### Erreur de connexion Supabase
1. Vérifiez vos credentials dans `.env.local`
2. Assurez-vous que le schéma SQL est exécuté
3. Vérifiez les RLS policies dans Supabase

### Erreur d'authentification Clerk
1. Vérifiez vos clés Clerk dans `.env.local`
2. Assurez-vous que les URLs de redirection sont configurées dans Clerk Dashboard

## 📞 Besoin d'Aide ?

- Consultez le [README.md](./README.md) complet
- Vérifiez la documentation [Next.js](https://nextjs.org/docs)
- Support [Supabase](https://supabase.com/docs)
- Documentation [Clerk](https://clerk.com/docs)

---

Bon développement! 🦊✨
