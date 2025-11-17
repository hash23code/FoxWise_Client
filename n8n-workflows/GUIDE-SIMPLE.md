# 🦊 Guide ULTRA SIMPLE pour configurer n8n avec FoxWise

> **Pour quelqu'un qui n'a JAMAIS utilisé n8n!**

---

## 📦 Ce que tu as maintenant

Dans le dossier `n8n-workflows/`, tu as:
- ✅ `1-invoice-workflow.json` - Pour envoyer des factures/rappels
- ✅ `2-campaign-workflow.json` - Pour envoyer des campagnes email
- ✅ Ce guide!

---

## 🎯 Étape 1: Accéder à n8n

### Si n8n est déjà installé quelque part:
1. Ouvre ton navigateur
2. Va sur l'adresse de ton n8n (exemple: `https://ton-n8n.com` ou `http://localhost:5678`)
3. Connecte-toi avec ton compte

### Si n8n n'est PAS encore installé:
```bash
# Option FACILE: Docker (si tu as Docker installé)
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n docker.n8n.io/n8nio/n8n

# Ensuite va sur: http://localhost:5678
```

**OU utilise n8n Cloud** (encore plus facile!):
- Va sur https://n8n.io
- Clique sur "Get started for free"
- Crée ton compte gratuit
- C'est tout! 🎉

---

## 🎯 Étape 2: Importer les workflows

### A. Dans n8n, regarde en haut à gauche:

```
┌─────────────────────────────┐
│  ☰  Workflows              │
└─────────────────────────────┘
```

### B. Clique sur le menu hamburger ☰ (les 3 lignes)

### C. Tu vas voir un menu. Clique sur **"Import from File..."**

### D. Première importation - Factures:
1. Clique sur **"Select file..."**
2. Va dans ton projet FoxWise: `n8n-workflows/1-invoice-workflow.json`
3. Sélectionne le fichier
4. Clique **"Import"**

### E. Deuxième importation - Campagnes:
1. Répète les étapes A à C
2. Cette fois, sélectionne `2-campaign-workflow.json`
3. Clique **"Import"**

---

## 🎯 Étape 3: Configurer le service email

**C'est la partie IMPORTANTE!** Sans ça, les emails ne partiront pas.

### Option 1: Gmail (LE PLUS SIMPLE)

#### A. Dans Gmail:
1. Va dans ton compte Gmail
2. Active l'authentification à 2 facteurs (si pas déjà fait)
3. Va dans **Sécurité** > **Mots de passe des applications**
4. Génère un nouveau mot de passe d'application
5. Sélectionne "Courrier" et "Autre (nom personnalisé)"
6. Nomme-le "n8n FoxWise"
7. **COPIE** le mot de passe généré (16 caractères)

#### B. Dans n8n:
1. En haut à droite, clique sur **ton icône de profil**
2. Clique sur **"Credentials"**
3. Clique sur **"Add Credential"**
4. Cherche et sélectionne **"SMTP"**
5. Remplis:
   ```
   Name: Gmail FoxWise
   User: ton-email@gmail.com
   Password: [colle le mot de passe d'application de 16 caractères]
   Host: smtp.gmail.com
   Port: 587
   SSL/TLS: Oui
   ```
6. Clique **"Create"**

### Option 2: SendGrid (RECOMMANDÉ pour production)

1. Va sur https://sendgrid.com
2. Crée un compte gratuit (100 emails/jour)
3. Vérifie ton domaine
4. Crée une API Key:
   - Settings > API Keys > Create API Key
   - Nom: "n8n FoxWise"
   - Permission: Full Access
   - **COPIE** la clé (tu ne la reverras plus!)

5. Dans n8n:
   - Credentials > Add Credential > "SendGrid"
   - API Key: [colle ta clé]
   - Create

---

## 🎯 Étape 4: Modifier les workflows

### Workflow 1: Factures et Rappels

1. Dans n8n, ouvre le workflow **"FoxWise - Factures et Rappels"**

2. Double-clique sur le node **"Parser les données"** (le 2ème bloc)

3. Tu vas voir du code. Trouve ces lignes:
   ```javascript
   const supabaseUrl = 'VOTRE_SUPABASE_URL';
   const supabaseKey = 'VOTRE_SUPABASE_ANON_KEY';
   ```

4. Remplace par tes vraies infos Supabase:
   ```javascript
   const supabaseUrl = 'https://abcdefgh.supabase.co';
   const supabaseKey = 'eyJhbGciOi...ton-vrai-key';
   ```

   **Où trouver ça?**
   - Va sur Supabase.com
   - Ton projet > Settings > API
   - Copie "Project URL" et "anon public"

5. Clique **"Save"** (en bas)

6. Double-clique sur le node **"📧 ENVOYER EMAIL"**

7. Dans "Credential to connect with", sélectionne **"Gmail FoxWise"** (ou SendGrid)

8. Change l'email "From":
   ```
   From Email: ton-email@gmail.com
   ```

9. Clique **"Save"**

### Workflow 2: Campagnes Email

**Répète la même chose** pour le workflow "FoxWise - Campagnes Email":
- Node "Parser la campagne" → Change Supabase URL et Key
- Node "📧 ENVOYER CAMPAGNE" → Sélectionne tes credentials email

---

## 🎯 Étape 5: Activer les workflows

### Pour CHAQUE workflow:

1. Regarde en haut à droite du workflow
2. Tu verras un bouton **"Inactive"** (rouge/gris)
3. **CLIQUE DESSUS** pour activer
4. Il devient **"Active"** (vert)

**IMPORTANT:** Les workflows doivent être **Active** (vert) pour fonctionner!

---

## 🎯 Étape 6: Récupérer les URLs des webhooks

### C'est ici que tu vas trouver les URLs à mettre dans FoxWise!

1. Ouvre le workflow **"FoxWise - Factures et Rappels"**

2. Clique sur le premier node **"Webhook - Réception"**

3. En bas, tu verras:
   ```
   Production URL: https://ton-n8n.com/webhook/abc123...
   ```

4. **COPIE** cette URL complète

5. Répète pour le workflow **"FoxWise - Campagnes Email"**

Tu auras 2 URLs comme:
```
URL Factures:  https://ton-n8n.com/webhook/abc123factures
URL Campagnes: https://ton-n8n.com/webhook/xyz456campagnes
```

---

## 🎯 Étape 7: Configurer FoxWise

### A. Créer le fichier .env.local

Dans ton projet FoxWise, à la racine (là où il y a `package.json`):

1. Crée un fichier nommé `.env.local` (s'il n'existe pas)

2. Copie tout le contenu de `.env.example` dedans

3. Ajoute/modifie ces lignes:
   ```env
   # n8n Webhooks
   N8N_WEBHOOK_URL_INVOICE=https://ton-n8n.com/webhook/abc123factures
   N8N_WEBHOOK_URL_CAMPAIGN=https://ton-n8n.com/webhook/xyz456campagnes
   N8N_API_KEY=ton-mot-de-passe-secret-aleatoire
   ```

   **Pour N8N_API_KEY**, tu peux utiliser n'importe quelle clé secrète, exemple:
   ```
   N8N_API_KEY=foxwise2024secretkey123456789
   ```

### B. Si tu utilises Vercel (production):

1. Va sur ton projet Vercel
2. Settings > Environment Variables
3. Ajoute ces 3 variables:
   - `N8N_WEBHOOK_URL_INVOICE` = ton URL
   - `N8N_WEBHOOK_URL_CAMPAIGN` = ton URL
   - `N8N_API_KEY` = ta clé secrète

4. Redéploie ton application

---

## 🎯 Étape 8: TESTER!

### Test simple avec Postman ou curl:

```bash
# Test webhook factures
curl -X POST https://ton-n8n.com/webhook/abc123factures \
  -H "Content-Type: application/json" \
  -d '{
    "clientIds": ["un-id-de-test"],
    "type": "invoice",
    "companyId": "ton-company-id"
  }'
```

**Tu devrais recevoir un email!** 📧

### Test depuis FoxWise:

1. Lance ton app FoxWise: `npm run dev`
2. Va sur http://localhost:3010
3. Connecte-toi
4. Va dans la section Emails
5. Essaie d'envoyer une facture à un client

---

## ✅ CHECKLIST FINALE

Avant de dire "c'est fini", vérifie que:

- [ ] n8n est accessible (localhost:5678 ou ton URL cloud)
- [ ] Les 2 workflows sont importés
- [ ] Les credentials email (Gmail/SendGrid) sont configurés
- [ ] Les workflows sont **ACTIFS** (bouton vert)
- [ ] Tu as copié les URLs des webhooks
- [ ] Le fichier `.env.local` existe avec les bonnes URLs
- [ ] Tu as testé et reçu un email

---

## 🆘 AIDE - Problèmes courants

### "Les emails ne partent pas"

1. **Vérifie que le workflow est ACTIF** (vert en haut à droite)
2. **Vérifie tes credentials email**:
   - Gmail: mot de passe d'application correct?
   - SendGrid: API key valide?
3. **Regarde les logs**:
   - Dans n8n: clique sur "Executions" en haut
   - Tu verras tous les essais et les erreurs

### "Webhook URL introuvable"

- Le workflow doit être **ACTIF** pour que l'URL fonctionne!
- Clique sur le node Webhook pour voir l'URL complète

### "Erreur Supabase"

- Vérifie que tu as bien remplacé `VOTRE_SUPABASE_URL` dans les nodes Function
- Va sur Supabase > Settings > API pour confirmer tes infos

### "Ça marche en local mais pas en production"

- Sur Vercel, as-tu bien ajouté les variables d'environnement?
- As-tu redéployé après avoir ajouté les variables?

---

## 🎉 C'EST TOUT!

Si tu as suivi toutes les étapes, ton système d'email est maintenant configuré!

**Workflow complet:**
1. Tu cliques "Envoyer facture" dans FoxWise
2. FoxWise envoie les données à n8n via webhook
3. n8n récupère les infos clients depuis Supabase
4. n8n crée et envoie les emails personnalisés
5. Les clients reçoivent leurs emails! 📬

---

## 📞 Besoin d'aide?

Si tu es bloqué:
1. Regarde les "Executions" dans n8n pour voir les erreurs
2. Consulte la documentation n8n: https://docs.n8n.io
3. Vérifie les logs de ton app FoxWise (console du navigateur)

**Bon courage! 🦊🚀**
