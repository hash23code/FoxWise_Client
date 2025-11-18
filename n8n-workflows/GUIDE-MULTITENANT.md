# 🦊 Guide n8n Multi-Tenant pour FoxWise

> **Architecture SaaS** - Chaque client utilise son propre email!

---

## 🎯 Qu'est-ce qui change?

### ❌ Avant (version simple):
```
Tous les emails partent de TON compte email
Client A, B, C → Reçoivent des emails de ton-email@gmail.com
```

### ✅ Maintenant (multi-tenant):
```
Chaque client configure SON email dans FoxWise
Client A → Configure son-email@construction-a.com
Client B → Configure email@renovation-b.ca
Client C → Configure contact@plomberie-c.com

Chacun envoie depuis SON propre email! 🎉
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ COMMENT ÇA FONCTIONNE                                       │
└─────────────────────────────────────────────────────────────┘

1. Client configure son email Gmail/Outlook dans Settings
   ↓
2. FoxWise stocke les credentials (chiffrés) dans Supabase
   ↓
3. Client clique "Envoyer facture"
   ↓
4. FoxWise récupère SES credentials SMTP
   ↓
5. FoxWise envoie tout à n8n (données + credentials)
   ↓
6. n8n utilise ces credentials pour envoyer l'email
   ↓
7. Email part de l'adresse du client! ✅
```

---

## 📦 Installation (2 étapes seulement!)

### Étape 1: Créer la table dans Supabase

1. Va dans **Supabase** > **SQL Editor**
2. Copie le fichier `database/email_credentials.sql`
3. **Colle** et **exécute**
4. ✅ Table créée!

### Étape 2: Importer les workflows n8n

1. Dans **n8n**, clique sur **☰ > Import from File...**

2. **Importe** ces 2 fichiers:
   - `1-invoice-workflow-multitenant.json`
   - `2-campaign-workflow-multitenant.json`

3. **Active** les workflows (bouton vert en haut à droite)

4. **Copie** les URLs des webhooks:
   - Clique sur le node "Webhook"
   - Copie l'"URL de production"

5. **Dans FoxWise**, crée `.env.local`:
   ```env
   N8N_WEBHOOK_URL_INVOICE=https://ton-n8n.com/webhook/invoice-mt
   N8N_WEBHOOK_URL_CAMPAIGN=https://ton-n8n.com/webhook/campaign-mt
   N8N_API_KEY=ta-cle-secrete-123
   ```

**C'EST TOUT!** 🎉

---

## 🔄 Différences avec les workflows simples

### Workflows simples (`1-invoice-workflow.json`):
- ❌ Utilisent des credentials SMTP fixes configurés dans n8n
- ❌ Tous les emails partent du même compte
- ❌ Pas adapté pour un SaaS

### Workflows multi-tenant (`1-invoice-workflow-multitenant.json`):
- ✅ Reçoivent les credentials SMTP dynamiquement
- ✅ Chaque entreprise utilise son propre email
- ✅ Parfait pour un SaaS!
- ✅ Utilisent un Code node avec nodemailer

---

## 📝 Installation de nodemailer dans n8n

**IMPORTANT**: Les workflows multi-tenant utilisent nodemailer dans un Code node.

### Si tu utilises n8n en local (Docker):

Nodemailer est déjà inclus! ✅ Rien à faire.

### Si tu utilises n8n Cloud:

Nodemailer est disponible! ✅ Rien à faire non plus.

---

## 🧪 Tester le système

### Test complet (recommandé):

1. **Crée une entreprise de test** dans FoxWise

2. **Configure l'email**:
   - Va dans **⚙️ Paramètres**
   - Section "Configuration Email"
   - Configure ton Gmail (voir GUIDE-CONNEXION-EMAIL-CLIENT.md)
   - Teste et sauvegarde

3. **Crée un client de test**

4. **Envoie une facture**:
   - Va dans Clients > [Ton client]
   - Clique "Envoyer facture"

5. **Vérifie**:
   - Regarde les "Executions" dans n8n
   - Vérifie que l'email est reçu
   - ✅ L'email vient de TON compte Gmail!

---

## 🔒 Sécurité

### Comment les mots de passe sont protégés?

1. **Chiffrement AES-256** dans Supabase
   - Les mots de passe ne sont JAMAIS stockés en clair
   - Chiffrés avec une clé secrète (à configurer dans Supabase)

2. **Déchiffrement seulement au moment de l'envoi**
   - La fonction RPC `fc_get_email_credential` déchiffre
   - Le mot de passe est envoyé à n8n via HTTPS
   - n8n l'utilise et le jette immédiatement

3. **Aucun log des mots de passe**
   - Les executions n8n peuvent logger les données
   - ⚠️ Désactive les logs si nécessaire pour la production

### ⚠️ IMPORTANT: Changez la clé de chiffrement!

Dans `database/email_credentials.sql`, ligne 68 et 112:

```sql
v_encryption_key := 'foxwise-email-encryption-key-2024'; -- CHANGEZ ÇA!
```

**Remplacez** par une clé aléatoire de 32+ caractères.

Générez-en une:
```bash
openssl rand -base64 32
```

---

## 🎨 Workflows expliqués

### Workflow Invoice Multi-Tenant

```
[Webhook] Reçoit les données + credentials SMTP
    ↓
[Parser] Extrait tout
    ↓
[HTTP Request] Récupère les clients depuis Supabase
    ↓
[Préparer emails] Personnalise chaque email
    ↓
[Diviser en lots] 5 emails à la fois
    ↓
[Code Node] ← UTILISE NODEMAILER AVEC CREDENTIALS DYNAMIQUES
    ↓
[Attendre] 2 secondes entre chaque lot
```

### Le Code Node magique:

```javascript
const nodemailer = require('nodemailer');

// Créer un transporteur avec les credentials du CLIENT
const transporter = nodemailer.createTransport({
  host: emailData.smtpHost,    // Gmail: smtp.gmail.com
  port: emailData.smtpPort,     // 587
  auth: {
    user: emailData.smtpUser,   // Email du client
    pass: emailData.smtpPassword // Mot de passe du client
  }
});

// Envoyer depuis L'EMAIL DU CLIENT
await transporter.sendMail({
  from: emailData.fromEmail,    // Email du client
  to: client.email,
  subject: "Facture",
  text: body
});
```

---

## 🆚 Quand utiliser quelle version?

### Utilisez les workflows **SIMPLES** si:
- ❌ Vous êtes la seule entreprise à utiliser FoxWise
- ❌ Vous voulez que tous les emails partent de votre compte
- ❌ Version de test/développement

### Utilisez les workflows **MULTI-TENANT** si:
- ✅ FoxWise est utilisé par plusieurs entreprises
- ✅ Chaque entreprise doit utiliser son propre email
- ✅ Version SaaS / Production
- ✅ **C'EST VOTRE CAS!**

---

## 🐛 Debugging

### Les emails ne partent pas:

1. **Vérifier dans n8n** > Executions:
   - Le workflow s'est-il exécuté?
   - Quelle erreur?

2. **Erreurs communes**:

   **"Authentication failed"**
   - Le mot de passe est incorrect
   - Pour Gmail: utilisez un mot de passe d'application!

   **"Credentials not found"**
   - Le client n'a pas configuré son email dans FoxWise
   - Allez dans Settings > Configuration Email

   **"SMTP connection timeout"**
   - Problème réseau
   - Vérifiez que n8n peut accéder à internet

### Logs utiles:

Dans n8n, clique sur une execution:
- Voir les données reçues par le webhook
- Voir les credentials utilisés (attention en production!)
- Voir l'erreur exacte de nodemailer

---

## ⚙️ Configuration avancée

### Limiter le nombre d'emails par minute:

Dans le workflow, node "Diviser en lots":
```
Batch Size: 5  ← Réduis à 3 si tu as des rate limits
```

Node "Attendre":
```
Amount: 2      ← Augmente à 5 secondes si nécessaire
Unit: seconds
```

### Ajouter un retry en cas d'échec:

Ajoute un node "Error Trigger" après le Code node:
1. Drag & drop "Error Trigger"
2. Configure pour retenter 3x
3. Si échec après 3x, envoie une notification

---

## 📊 Monitoring

### Métriques importantes à surveiller:

1. **Taux de succès d'envoi**
   - Dans n8n > Executions
   - Filtre par "Errored"

2. **Temps de traitement**
   - Combien de temps pour 100 emails?
   - Ajuster les batch sizes si nécessaire

3. **Erreurs SMTP par provider**
   - Gmail cause plus d'erreurs? Pourquoi?
   - Documenter les problèmes fréquents

---

## ✅ Checklist de déploiement

Avant de mettre en production:

- [ ] Table `fc_email_credentials` créée dans Supabase
- [ ] Clé de chiffrement changée (pas la valeur par défaut!)
- [ ] Workflows multi-tenant importés dans n8n
- [ ] Workflows activés (bouton vert)
- [ ] URLs des webhooks copiées dans `.env.local`
- [ ] nodemailer installé localement (`npm install`)
- [ ] Test complet effectué avec Gmail ET Outlook
- [ ] Guide client (GUIDE-CONNEXION-EMAIL-CLIENT.md) partagé avec les utilisateurs
- [ ] Monitoring configuré
- [ ] Backup des workflows n8n exportés

---

## 🎓 Pour aller plus loin

### Amélioration: Tracking des emails

Ajoute un node à la fin du workflow pour logger dans Supabase:
- Email envoyé à qui
- Quand
- Depuis quel compte
- Statut (succès/échec)

### Amélioration: Templates d'emails

Stocke des templates dans Supabase:
- Template facture
- Template rappel
- Template bienvenue
- Le client peut personnaliser ses templates

### Amélioration: AI Email Assistant

Intègre OpenAI pour:
- Améliorer la formulation des emails
- Traduire automatiquement
- Suggérer des sujets accrocheurs

---

## 📞 Support

**Problème avec les workflows?**
- Regarde les Executions dans n8n
- Vérifie les logs de l'API FoxWise (Vercel)

**Problème avec le chiffrement?**
- Vérifie que la fonction RPC existe dans Supabase
- Test avec `SELECT fc_get_email_credential('company-id')`

**Autre?**
- GitHub Issues: https://github.com/hash23code/FoxWise_Client/issues

---

**Bon courage! 🦊🚀**

**L'architecture multi-tenant est maintenant en place!**

Chaque client de FoxWise peut utiliser son propre email professionnel pour communiquer avec ses clients. C'est exactement comme ça que fonctionnent les gros CRM (HubSpot, Salesforce, etc.)!
