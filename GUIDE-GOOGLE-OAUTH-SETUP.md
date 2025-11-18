# 🔐 Configuration OAuth Google pour FoxWise

> **Guide pour développeurs** - Configuration Google Cloud Console

---

## 🎯 Ce que tu vas obtenir:

À la fin de ce guide, tu auras:
- ✅ Un `GOOGLE_CLIENT_ID`
- ✅ Un `GOOGLE_CLIENT_SECRET`
- ✅ OAuth configuré pour FoxWise

---

## 📝 Étape 1: Créer un projet Google Cloud

### 1. Va sur Google Cloud Console:
👉 **https://console.cloud.google.com/**

### 2. Crée un nouveau projet:
- Clique sur le sélecteur de projet (en haut à gauche)
- Clique **"Nouveau projet"**
- Nom du projet: **"FoxWise Email"**
- Clique **"Créer"**

### 3. Sélectionne ton nouveau projet
- Attends que le projet soit créé (quelques secondes)
- Sélectionne-le dans le menu déroulant

---

## 🔑 Étape 2: Activer l'API Gmail

### 1. Dans le menu de gauche:
- Clique sur **"APIs & Services"** > **"Enabled APIs & services"**

### 2. Activer l'API:
- Clique **"+ ENABLE APIS AND SERVICES"** (en haut)
- Cherche: **"Gmail API"**
- Clique sur **"Gmail API"**
- Clique **"ENABLE"**

---

## 🎫 Étape 3: Configurer l'écran de consentement OAuth

### 1. Dans le menu de gauche:
- **"APIs & Services"** > **"OAuth consent screen"**

### 2. Choisis le type d'utilisateurs:
- **Externe** (External) si tu veux que n'importe qui puisse se connecter
- Clique **"CREATE"**

### 3. Remplis les informations:

**App information:**
```
App name: FoxWise
User support email: ton-email@gmail.com
```

**App domain (optionnel pour le dev):**
```
Laisse vide pour le moment
```

**Developer contact information:**
```
Email addresses: ton-email@gmail.com
```

- Clique **"SAVE AND CONTINUE"**

### 4. Scopes (permissions):
- Clique **"ADD OR REMOVE SCOPES"**
- Cherche et sélectionne:
  - ✅ `https://www.googleapis.com/auth/gmail.send`
  - ✅ `https://www.googleapis.com/auth/userinfo.email`
  - ✅ `https://www.googleapis.com/auth/userinfo.profile`
- Clique **"UPDATE"**
- Clique **"SAVE AND CONTINUE"**

### 5. Test users (si app en test):
- Clique **"+ ADD USERS"**
- Ajoute ton email Gmail
- Clique **"ADD"**
- Clique **"SAVE AND CONTINUE"**

### 6. Summary:
- Vérifie que tout est OK
- Clique **"BACK TO DASHBOARD"**

---

## 🔐 Étape 4: Créer les credentials OAuth

### 1. Dans le menu de gauche:
- **"APIs & Services"** > **"Credentials"**

### 2. Créer un OAuth Client ID:
- Clique **"+ CREATE CREDENTIALS"** (en haut)
- Sélectionne **"OAuth client ID"**

### 3. Configuration:
```
Application type: Web application
Name: FoxWise Web Client
```

### 4. Authorized JavaScript origins:
Clique **"+ ADD URI"** et ajoute:
```
http://localhost:3010
https://ton-domaine-vercel.vercel.app
```

### 5. Authorized redirect URIs:
Clique **"+ ADD URI"** et ajoute:
```
http://localhost:3010/api/auth/google/callback
https://ton-domaine-vercel.vercel.app/api/auth/google/callback
```

### 6. Créer:
- Clique **"CREATE"**
- Une popup apparaît avec tes credentials! 🎉

### 7. **COPIE TES CREDENTIALS:**
```
Client ID: 123456789-abcdefg.apps.googleusercontent.com
Client secret: GOCSPX-abc123xyz...
```

**⚠️ IMPORTANT:** Garde ces credentials en sécurité!

---

## ⚙️ Étape 5: Configuration FoxWise

### Ajoute les variables d'environnement:

**Dans `.env.local` (développement):**
```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz...
NEXT_PUBLIC_APP_URL=http://localhost:3010
```

**Dans Vercel (production):**
1. Va dans ton projet Vercel
2. **Settings** > **Environment Variables**
3. Ajoute:
   - `GOOGLE_CLIENT_ID` = ton Client ID
   - `GOOGLE_CLIENT_SECRET` = ton Client secret
   - `NEXT_PUBLIC_APP_URL` = https://ton-app.vercel.app

4. **Redéploie** l'application

---

## ✅ Étape 6: Tester!

### En développement:

1. Lance FoxWise:
   ```bash
   npm run dev
   ```

2. Va sur: **http://localhost:3010/settings**

3. Clique sur **"Connecter avec Google"**

4. Tu devrais voir la popup OAuth de Google!

5. Autorise FoxWise

6. Tu es redirigé vers Settings avec le badge vert ✅

---

## 🚀 Passage en production

### Quand tu es prêt pour la prod:

1. **Retourne dans Google Cloud Console**

2. **OAuth consent screen** > **"PUBLISH APP"**
   - Clic sur le bouton pour passer en production
   - Ça permet à N'IMPORTE QUI de se connecter (pas juste les test users)

3. **Verification** (optionnel mais recommandé):
   - Google peut demander une vérification si ton app devient populaire
   - Ils vont vérifier que tu utilises les scopes correctement
   - Pas nécessaire au début!

---

## 🔒 Sécurité

### Bonnes pratiques:

✅ **NEVER** commit tes `GOOGLE_CLIENT_SECRET` dans Git
✅ Utilise des variables d'environnement
✅ Différents credentials pour dev et prod
✅ Révoque les credentials si compromis

### Si tu dois révoquer:
1. **Google Cloud Console** > **Credentials**
2. Trouve ton OAuth Client ID
3. Clique sur l'icône poubelle 🗑️
4. Crée-en un nouveau

---

## 🆘 Problèmes courants

### "redirect_uri_mismatch"
➡️ L'URL de callback n'est pas dans les "Authorized redirect URIs"
➡️ Vérifie que l'URL est EXACTEMENT la même (avec/sans slash final)

### "access_denied"
➡️ L'utilisateur a refusé l'autorisation
➡️ Ou l'app n'est pas en mode "External" ou "Published"

### "invalid_client"
➡️ Le `GOOGLE_CLIENT_ID` ou `SECRET` est incorrect
➡️ Vérifie tes variables d'environnement

### Pas de refresh_token
➡️ L'utilisateur avait déjà autorisé l'app
➡️ Solution: Révoque l'accès dans https://myaccount.google.com/permissions
➡️ Ou utilise `prompt: 'consent'` (déjà fait dans le code!)

---

## 📚 Ressources

- **Google OAuth Documentation**: https://developers.google.com/identity/protocols/oauth2
- **Gmail API**: https://developers.google.com/gmail/api
- **Google Cloud Console**: https://console.cloud.google.com

---

## ✅ Checklist finale

Avant de dire "c'est bon":

- [ ] Projet Google Cloud créé
- [ ] Gmail API activée
- [ ] OAuth consent screen configuré
- [ ] OAuth Client ID créé
- [ ] Redirect URIs configurés (localhost ET production)
- [ ] `GOOGLE_CLIENT_ID` dans `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` dans `.env.local`
- [ ] `NEXT_PUBLIC_APP_URL` dans `.env.local`
- [ ] Variables ajoutées dans Vercel (pour production)
- [ ] Testé en local et ça fonctionne!
- [ ] App published (pour permettre à tous de se connecter)

---

**Félicitations!** 🎉

Ton système OAuth Google est maintenant configuré!

Tes clients vont juste cliquer "Connecter avec Google" et c'est TERMINÉ. Pas de mot de passe d'application, pas de galère!

**Welcome to modern SaaS!** 🚀🔥

---

**Questions?** Consulte les logs dans la console Next.js ou les Network requests dans DevTools!
