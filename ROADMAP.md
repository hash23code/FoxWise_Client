# 🗺️ Roadmap - FoxWise Client

## Version Actuelle: v0.1.0 (MVP)

### ✅ Fonctionnalités Actuelles

#### Core
- Dashboard avec statistiques
- Gestion complète des clients
- Gestion des jobs et assignations
- Authentification et rôles (Manager/Employé)
- API REST pour clients et jobs

#### UI/UX
- Design FoxWise cohérent
- Interface responsive
- Animations Framer Motion
- Dark mode

## 📅 Versions Futures

### v0.2.0 - Calendrier et Planification (1-2 semaines)

**Objectif**: Permettre la planification visuelle des jobs

- [ ] Vue calendrier mensuel/hebdomadaire
- [ ] Drag & drop d'événements
- [ ] Création d'événements depuis le calendrier
- [ ] Sync avec Google Calendar (optionnel)
- [ ] Notifications pour événements à venir
- [ ] Code couleur par type de job
- [ ] Vue timeline pour les employés

**API Routes à créer**:
- `POST /api/calendar/events`
- `GET /api/calendar/events?start=&end=`
- `PATCH /api/calendar/events/:id`
- `DELETE /api/calendar/events/:id`

**Bibliothèques suggérées**:
- `@fullcalendar/react` ou `react-big-calendar`
- `date-fns` (déjà installé)

---

### v0.3.0 - Système de Paiements (1-2 semaines)

**Objectif**: Suivi complet des finances et paiements

- [ ] Vue détaillée des paiements par client
- [ ] Génération de factures PDF
- [ ] Historique des paiements
- [ ] Rapports financiers
- [ ] Graphiques de revenus
- [ ] Filtres par période
- [ ] Export Excel/CSV
- [ ] Alertes paiements en retard

**Tables à ajouter**:
```sql
CREATE TABLE fc_invoices (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES fc_jobs(id),
  invoice_number TEXT UNIQUE,
  amount DECIMAL(10, 2),
  status TEXT,
  due_date TIMESTAMP,
  paid_date TIMESTAMP,
  pdf_url TEXT
);

CREATE TABLE fc_payments (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES fc_invoices(id),
  amount DECIMAL(10, 2),
  payment_method TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMP
);
```

**Bibliothèques suggérées**:
- `jspdf` pour génération PDF
- `recharts` pour graphiques (déjà installé)

---

### v0.4.0 - Emails et n8n Integration (1 semaine)

**Objectif**: Automatisation des emails clients

- [ ] Interface d'envoi d'emails groupés
- [ ] Templates d'emails personnalisables
- [ ] Variables dynamiques (nom client, montant, etc.)
- [ ] Historique des emails envoyés
- [ ] Webhooks n8n configurables
- [ ] Prévisualisation avant envoi
- [ ] Pièces jointes (devis, factures)

**Workflows n8n à créer**:
1. Envoi email simple
2. Envoi email avec facture
3. Rappel de paiement automatique
4. Email de bienvenue nouveau client

**API Routes**:
- `POST /api/emails/send`
- `GET /api/emails/logs`
- `POST /api/emails/templates`

---

### v0.5.0 - Chat Interne (2 semaines)

**Objectif**: Communication d'équipe en temps réel

- [ ] Chat 1-on-1 entre employés
- [ ] Groupes de discussion
- [ ] Notifications en temps réel
- [ ] Indicateur "en ligne"
- [ ] Historique des conversations
- [ ] Recherche dans les messages
- [ ] Partage de fichiers
- [ ] Mentions (@utilisateur)
- [ ] Émojis et réactions

**Technologies**:
- WebSockets avec Supabase Realtime
- ou Socket.io pour plus de contrôle

**Tables** (déjà créées):
- `fc_conversations`
- `fc_chat_messages`

**API Routes**:
- WebSocket endpoints
- `GET /api/chat/conversations`
- `POST /api/chat/messages`

---

### v0.6.0 - Application Mobile (3-4 semaines)

**Objectif**: Version mobile avec React Native

#### Fonctionnalités Mobile
- [ ] Authentification
- [ ] Dashboard simplifié
- [ ] Liste clients
- [ ] Liste jobs
- [ ] Notifications push
- [ ] Scanner QR codes clients
- [ ] Mode hors ligne
- [ ] Géolocalisation (jobs à proximité)
- [ ] Appareil photo (photos de chantier)

#### Technologies
- React Native + Expo
- Expo Router pour navigation
- NativeWind pour styling
- Clerk Expo pour auth
- Supabase JS pour données

#### Structure
```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Dashboard
│   │   ├── clients.tsx
│   │   ├── jobs.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── components/
├── lib/
└── package.json
```

---

### v0.7.0 - Intégration FoxWise ToDo (1-2 semaines)

**Objectif**: Synchroniser jobs et projets

- [ ] Créer projet ToDo depuis job
- [ ] Synchronisation bidirectionnelle
- [ ] Voir tâches liées dans job
- [ ] Dashboard unifié (optionnel)
- [ ] Webhooks entre applications

**Flux d'intégration**:
```
FoxWise Client                 FoxWise ToDo
     |                              |
     | Job créé                     |
     |----------------------------->|
     |                         Projet créé
     |                         Tâches créées
     |                              |
     | Tâche complétée              |
     |<-----------------------------|
     | Mise à jour statut job       |
```

---

### v0.8.0 - Intégration FoxWise Finance (1-2 semaines)

**Objectif**: Synchronisation financière

- [ ] Créer facture automatiquement
- [ ] Sync paiements
- [ ] Rapports croisés
- [ ] Budget par client
- [ ] Prévisions de revenus

---

### v0.9.0 - Fonctionnalités Avancées (2-3 semaines)

- [ ] Rapports personnalisables
- [ ] Export de données
- [ ] Import CSV de clients
- [ ] Champs personnalisés pour clients
- [ ] Workflows automatisés
- [ ] Rôles personnalisés
- [ ] Permissions granulaires
- [ ] API publique documentée
- [ ] Webhooks personnalisés

---

### v1.0.0 - Release Stable (1 semaine)

**Objectif**: Version production-ready

- [ ] Tests end-to-end complets
- [ ] Documentation utilisateur
- [ ] Guide vidéo
- [ ] Optimisations performance
- [ ] SEO
- [ ] Analytics
- [ ] Support multi-langue complet
- [ ] Mode clair (light theme)

---

## 🎯 Fonctionnalités Nice-to-Have

### Intelligence Artificielle
- [ ] Assistant IA pour suggestions
- [ ] Prédiction temps nécessaire par job
- [ ] Recommandations de planification
- [ ] Analyse sentiments clients (emails)
- [ ] Chatbot support client

### Intégrations Tierces
- [ ] QuickBooks / Sage comptabilité
- [ ] Stripe pour paiements en ligne
- [ ] Twilio pour SMS
- [ ] Google Maps pour géolocalisation
- [ ] Dropbox/Google Drive pour documents

### Advanced Features
- [ ] Devis interactifs
- [ ] Contrats électroniques
- [ ] Signature électronique
- [ ] Gestion d'inventaire
- [ ] Gestion d'équipements
- [ ] Timesheet employés
- [ ] Évaluations clients
- [ ] Programme de fidélité

---

## 🏆 Objectifs Long Terme

### Année 1
- 1000+ utilisateurs actifs
- Suite FoxWise complète (Client + ToDo + Finance)
- Application mobile stable
- Intégrations majeures

### Année 2
- API publique pour développeurs
- Marketplace d'extensions
- Version entreprise
- Support multi-organisations
- Application desktop (Electron)

---

## 📊 Métriques de Succès

### Adoption
- Nombre d'utilisateurs actifs
- Nombre de clients gérés
- Nombre de jobs complétés
- Taux de rétention

### Performance
- Temps de chargement < 2s
- 99.9% uptime
- Réponse API < 200ms

### Satisfaction
- NPS Score > 50
- Reviews 4.5+ étoiles
- Support response < 24h

---

## 💡 Comment Contribuer

Pour proposer une nouvelle fonctionnalité:
1. Ouvre une issue sur GitHub
2. Décris le use case
3. Propose une implémentation
4. Estime la priorité

Pour voter sur les fonctionnalités:
- 👍 pour les fonctionnalités que tu veux
- Commente avec ton feedback

---

**Cette roadmap est vivante et évoluera selon les besoins des utilisateurs!**

Dernière mise à jour: 2025-10-23
