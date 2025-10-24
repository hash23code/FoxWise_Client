# 🔗 Guide d'Intégration FoxWise

Ce document explique comment FoxWise Client s'intègre avec les autres applications de l'écosystème FoxWise.

## 🌐 Écosystème FoxWise

```
┌─────────────────┐
│  FoxWise ToDo   │  Port 3000
│  Gestion Tâches │
└────────┬────────┘
         │
         │ Shared Supabase
         │
┌────────┴────────┬─────────────────┬──────────────────┐
│                 │                 │                  │
│  FoxWise Client │  FoxWise Finance│  FoxWise Mobile  │
│  Port 3010      │  Port 3020      │  Expo            │
│  Gestion CRM    │  Comptabilité   │  Multi-app       │
└─────────────────┴─────────────────┴──────────────────┘
```

## 🔄 Intégrations Prévues

### 1. FoxWise Client ↔ FoxWise ToDo

#### Synchronisation des Projets
Un job dans FoxWise Client peut créer automatiquement :
- Un projet dans FoxWise ToDo
- Des tâches liées au job
- Des sous-tâches par étape du projet

**Exemple de flux :**
```
Client: ABC Construction
Job: Installation Système Électrique
  ↓
FoxWise ToDo:
  Project: "ABC Construction - Installation"
    ├─ Task: Évaluation sur site
    ├─ Task: Préparation matériel
    ├─ Task: Installation
    └─ Task: Tests et validation
```

#### Tables Partagées
```sql
-- Lien entre Jobs et Projects
ALTER TABLE fc_jobs ADD COLUMN todo_project_id UUID REFERENCES projects(id);

-- Lien entre Clients et Projects
ALTER TABLE projects ADD COLUMN client_id UUID REFERENCES fc_clients(id);
```

### 2. FoxWise Client ↔ FoxWise Finance

#### Synchronisation Financière
Les jobs complétés créent automatiquement :
- Factures clients
- Entrées de revenus
- Rapports de paiements

**Exemple de flux :**
```
Job Complété: Installation ABC Construction
Payment: 5000$
  ↓
FoxWise Finance:
  ├─ Invoice #2024-001 créée
  ├─ Revenue enregistré: 5000$
  ├─ Client: ABC Construction lié
  └─ Catégorie: Services d'installation
```

#### Tables de Liaison
```sql
-- Lien entre Jobs et Invoices
ALTER TABLE fc_jobs ADD COLUMN finance_invoice_id UUID;

-- Table de synchronisation
CREATE TABLE foxwise_sync (
  id UUID PRIMARY KEY,
  source_app TEXT, -- 'client', 'todo', 'finance'
  source_table TEXT,
  source_id UUID,
  target_app TEXT,
  target_table TEXT,
  target_id UUID,
  synced_at TIMESTAMP,
  sync_status TEXT
);
```

### 3. API Inter-Applications

#### Endpoints Partagés

**FoxWise Client expose :**
```typescript
// GET /api/v1/clients - Liste des clients
// GET /api/v1/jobs - Liste des jobs
// POST /api/v1/webhooks/job-completed - Notification job complété
```

**FoxWise ToDo expose :**
```typescript
// POST /api/v1/projects/from-job - Créer projet depuis job
// GET /api/v1/tasks/by-client - Tâches par client
```

**FoxWise Finance expose :**
```typescript
// POST /api/v1/invoices/from-job - Créer facture depuis job
// GET /api/v1/revenue/by-client - Revenus par client
```

## 🔐 Authentication Partagée

Toutes les applications utilisent **Clerk** avec le même compte :

```typescript
// Clerk Organization = Entreprise
// Clerk Members = Employés/Managers

// Rôles partagés:
type UserRole = 'manager' | 'employee' | 'admin';

// Metadata partagées dans Clerk:
{
  role: 'manager',
  apps_access: ['client', 'todo', 'finance'],
  preferences: {
    theme: 'dark',
    language: 'fr'
  }
}
```

## 📊 Base de Données Partagée

### Structure Unifiée

```
Supabase Project: FoxWise
├─ Schema: public
│  ├─ Prefixes:
│  │  ├─ fc_* (FoxWise Client)
│  │  ├─ (none) (FoxWise ToDo)
│  │  └─ ff_* (FoxWise Finance)
│  │
│  ├─ Tables Communes:
│  │  ├─ organizations
│  │  ├─ users (info utilisateurs)
│  │  └─ audit_logs
│  │
│  └─ Tables Spécifiques:
│     ├─ fc_clients, fc_jobs (Client)
│     ├─ tasks, projects (ToDo)
│     └─ ff_transactions, ff_invoices (Finance)
```

### Vues SQL Unifiées

```sql
-- Vue unifiée: Tous les projets/jobs/tâches
CREATE VIEW unified_work_items AS
SELECT
  'job' as type,
  id,
  title as name,
  status,
  created_at
FROM fc_jobs
UNION ALL
SELECT
  'project' as type,
  id,
  title as name,
  status,
  created_at
FROM projects
UNION ALL
SELECT
  'task' as type,
  id,
  title as name,
  status::text as status,
  created_at
FROM tasks;

-- Vue: Revenus par client
CREATE VIEW client_revenue AS
SELECT
  c.id as client_id,
  c.company_name,
  COUNT(j.id) as total_jobs,
  SUM(CASE WHEN j.payment_status = 'paid' THEN j.payment_amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN j.payment_status = 'unpaid' THEN j.payment_amount ELSE 0 END) as total_unpaid
FROM fc_clients c
LEFT JOIN fc_jobs j ON j.client_id = c.id
GROUP BY c.id, c.company_name;
```

## 🔔 Notifications Inter-Applications

### Système d'Événements

```typescript
// Event Bus partagé
type FoxWiseEvent =
  | { type: 'client.created', data: Client }
  | { type: 'job.completed', data: Job }
  | { type: 'invoice.paid', data: Invoice }
  | { type: 'task.assigned', data: Task }
  | { type: 'project.started', data: Project };

// Listeners dans chaque app
// FoxWise Client
onEvent('invoice.paid', (event) => {
  updateJobPaymentStatus(event.data.job_id, 'paid');
});

// FoxWise ToDo
onEvent('job.created', (event) => {
  createProjectFromJob(event.data);
});

// FoxWise Finance
onEvent('job.completed', (event) => {
  generateInvoice(event.data);
});
```

## 🎯 Roadmap d'Intégration

### Phase 1 (Actuel)
- ✅ Base de données Supabase partagée
- ✅ Authentication Clerk partagée
- ✅ Structure de données compatible

### Phase 2 (À venir)
- 🚧 API webhooks entre applications
- 🚧 Synchronisation automatique jobs ↔ projects
- 🚧 Dashboard unifié multi-apps

### Phase 3 (Future)
- 🔮 Vue unifiée de tous les travaux
- 🔮 Rapports cross-application
- 🔮 Workflows automatisés entre apps
- 🔮 Application mobile unifiée

## 🛠️ Implémentation Technique

### 1. Créer un Job et Projet Lié

```typescript
// Dans FoxWise Client
async function createJobWithProject(jobData) {
  // 1. Créer le job
  const job = await createJob(jobData);

  // 2. Appeler FoxWise ToDo API
  const project = await fetch('http://localhost:3000/api/v1/projects/from-job', {
    method: 'POST',
    body: JSON.stringify({
      job_id: job.id,
      title: `${job.client.company_name} - ${job.title}`,
      description: job.description,
      client_id: job.client_id
    })
  });

  // 3. Lier le projet au job
  await updateJob(job.id, {
    todo_project_id: project.id
  });

  return { job, project };
}
```

### 2. Synchroniser les Paiements

```typescript
// Dans FoxWise Finance
async function onInvoicePaid(invoice) {
  if (invoice.job_id) {
    // Mettre à jour le job dans FoxWise Client
    await fetch('http://localhost:3010/api/v1/jobs/payment-status', {
      method: 'PATCH',
      body: JSON.stringify({
        job_id: invoice.job_id,
        payment_status: 'paid',
        paid_at: new Date()
      })
    });
  }
}
```

## 📱 Application Mobile Unifiée

L'application mobile FoxWise regroupera toutes les fonctionnalités :

```typescript
// Navigation mobile unifiée
<Tabs>
  <Tab name="Dashboard" icon={LayoutDashboard} />
  <Tab name="ToDo" icon={CheckSquare} />
  <Tab name="Clients" icon={Users} />
  <Tab name="Finance" icon={DollarSign} />
  <Tab name="Plus" icon={Menu} />
</Tabs>

// Modules chargeables
- @foxwise/client
- @foxwise/todo
- @foxwise/finance
```

## 🚀 Pour Commencer

1. **Assurez-vous que toutes les apps utilisent le même Supabase**
2. **Configurez les mêmes credentials Clerk**
3. **Ajoutez les tables de liaison** (voir database_schema.sql)
4. **Testez les webhooks localement**
5. **Déployez progressivement les intégrations**

---

**L'écosystème FoxWise grandira pour devenir une suite complète de gestion d'entreprise!** 🦊✨
