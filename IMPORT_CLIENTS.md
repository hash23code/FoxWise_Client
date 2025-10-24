# Guide d'Import des Clients

## Étape 1: Préparer le fichier Excel

Ouvre le fichier: `H:\Ai_Projects\app\claude\Banque_clients_Deneigement_2025_2026_colonnes_ajustees (1).xlsx`

### Colonnes attendues (à ajuster selon ton fichier):
- Nom de l'entreprise / Contact
- Adresse
- Ville
- Code postal
- Téléphone
- Email
- Secteur (zone géographique)
- Notes / Informations supplémentaires

## Étape 2: Convertir en CSV

1. Dans Excel, **Fichier** > **Enregistrer sous**
2. Choisis le format **CSV (séparateur: point-virgule) (*.csv)**
3. Sauvegarde dans: `H:\Ai_Projects\app\claude\FoxWise_Client\web\clients_import.csv`

## Étape 3: Ajouter les secteurs d'abord

Avant d'importer les clients, va dans l'application:
1. Lance l'app: `npm run dev`
2. Va sur **Secteurs** dans la sidebar
3. Ajoute tous tes secteurs géographiques (ex: Secteur Nord, Secteur Sud, etc.)

## Étape 4: Exécuter l'import

Une fois le CSV créé et les secteurs ajoutés:

```bash
cd web
node scripts/import-clients.js
```

## Format CSV attendu

```csv
company_name;contact_name;address;city;postal_code;phone;email;sector;notes
ABC Corp;Jean Tremblay;123 Rue Principale;Québec;G1A 1A1;418-555-1234;jean@abc.com;Secteur Nord;Client important
...
```

## Si tu as besoin d'aide

1. **Montre-moi les colonnes de ton fichier Excel**
2. Je créerai un script d'import personnalisé
3. On pourra importer en un clic!

## Import Manuel (Alternative)

Si tu préfères, tu peux aussi:
1. Utiliser l'interface web "Nouveau Client"
2. Copier-coller les infos depuis Excel
3. Plus long mais plus de contrôle

---

**Prochaine étape**: Dis-moi quelles colonnes sont dans ton fichier Excel et je créerai le script d'import parfait!
