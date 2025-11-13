# 🚗 Guide de Navigation GPS 3D - FoxWise Client

## 🎮 Vue d'ensemble

FoxWise Client dispose maintenant d'un système de navigation GPS 3D de style jeu vidéo avec:

- **Carte 3D interactive** avec bâtiments et terrain
- **Navigation turn-by-turn en temps réel**
- **Tracking GPS des employés**
- **Détection automatique de proximité**
- **Système de couleurs intelligent:**
  - 🟠 **Orange**: Job assigné / En route
  - 🔴 **Rouge**: Job URGENT
  - 🟢 **Vert**: Job complété / Employé arrivé
  - 🟣 **Violet**: Position des employés
- **Effets météo 3D** (pluie, neige)
- **Interface style jeu vidéo** avec HUD immersif

---

## 🚀 Installation & Configuration

### 1. Installer les dépendances

Les dépendances ont déjà été installées:
```bash
npm install mapbox-gl @types/mapbox-gl @mapbox/mapbox-gl-geocoder @turf/turf @turf/distance
```

### 2. Obtenir une clé API Mapbox

1. Créez un compte gratuit sur [Mapbox](https://www.mapbox.com/)
2. Allez dans votre [tableau de bord](https://account.mapbox.com/)
3. Créez un nouveau token d'accès
4. Copiez votre clé API

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet:

```bash
NEXT_PUBLIC_MAPBOX_API_KEY=votre_cle_api_mapbox_ici
```

**IMPORTANT:** Redémarrez le serveur Next.js après avoir ajouté la clé:
```bash
npm run dev
```

### 4. Exécuter la migration de base de données

Connectez-vous à votre base de données Supabase et exécutez le script:

```bash
database_migration_geolocation.sql
```

Ce script ajoute:
- Les colonnes `latitude` et `longitude` aux tables `fc_clients` et `fc_jobs`
- Une nouvelle table `fc_employee_locations` pour le tracking en temps réel
- Des fonctions SQL pour calculer les distances
- Les index nécessaires pour les performances

---

## 📱 Utilisation

### Pour les MANAGERS

#### Page: Carte des Jobs (`/jobs-map`)

**Fonctionnalités:**
- Voir tous les jobs sur une carte 3D interactive
- Créer de nouveaux jobs avec géolocalisation automatique
- Assigner des jobs aux employés
- Voir la position en temps réel des employés
- Marquer des jobs comme URGENTS (rouge pulsant)
- Filtrer par statut et recherche

**Comment créer un job:**

1. Cliquez sur **"Nouveau Job"**
2. Remplissez les informations:
   - **Titre**: Ex: "Déneigement résidentiel"
   - **Description**: Détails du job
   - **Client**: Sélectionnez dans la liste
   - **Adresse**: L'adresse sera automatiquement géocodée
   - **Assigner à**: Choisissez un employé
   - **Priorité**: Basse, Moyenne, Haute, ou Urgente
   - **Date prévue**: Optionnel
   - **URGENT**: Cochez si c'est urgent (rouge sur la carte)

3. Cliquez sur **"Créer le Job"**

Le job apparaîtra immédiatement sur la carte avec la bonne couleur!

**Système de couleurs:**
- 🟠 **Orange**: Job assigné ou en route
- 🔴 **Rouge clignotant**: Job URGENT
- 🟢 **Vert**: Job complété ou employé arrivé
- 🟣 **Violet**: Employés en ligne

### Pour les EMPLOYÉS

#### Page: Navigation GPS (`/navigation`)

**Fonctionnalités:**
- Voir tous vos jobs assignés
- Navigation GPS 3D immersive vers chaque job
- Directions turn-by-turn en temps réel
- Détection automatique d'arrivée (50m de proximité)
- Compléter les jobs
- Effets météo 3D

**Comment utiliser:**

1. **Autoriser la géolocalisation** quand le navigateur le demande
2. Vos jobs apparaissent dans la liste de gauche
3. Cliquez sur un job pour démarrer la navigation
4. La navigation 3D s'active automatiquement!

**HUD de navigation:**
- **Distance restante**: Mise à jour en temps réel
- **Temps estimé**: Calcul dynamique
- **Vitesse actuelle**: En km/h
- **Instruction courante**: Directions turn-by-turn
- **Notification d'arrivée**: Automatique à 50m

**Quand vous arrivez:**
1. Le système détecte automatiquement votre arrivée
2. Le job devient VERT sur toutes les cartes
3. Cliquez sur **"Compléter"** pour terminer le job
4. Passez automatiquement au job suivant

**Effets météo:**
- Cliquez sur l'icône météo (bas-droite) pour changer:
  - ☀️ **Clair**
  - 🌧️ **Pluie**
  - ❄️ **Neige**

---

## 🛠️ Architecture Technique

### Composants Créés

#### 1. `Map3D.tsx`
Carte 3D interactive avec:
- Rendu 3D des bâtiments
- Markers personnalisés avec animations
- Popup d'information
- Effets météo (particules de pluie/neige)
- Détection de proximité

#### 2. `NavigationMap.tsx`
Navigation GPS complète avec:
- Carte style navigation nocturne
- Route calculée avec Mapbox Directions API
- Instructions turn-by-turn
- HUD style jeu vidéo
- Tracking en temps réel
- Speedometer animé

### API Endpoints

#### `/api/geolocation`
- **GET**: Récupère toutes les positions des employés
- **POST**: Met à jour la position d'un employé

#### `/api/geocode`
- **POST**: Convertit une adresse en coordonnées (lat/lng)
- **GET**: Reverse geocoding (coordonnées → adresse)

#### `/api/jobs/location`
- **PUT**: Met à jour le statut de localisation d'un job
- **POST**: Vérifie la proximité et met à jour automatiquement

### Pages Créées

#### `/jobs-map`
Interface manager pour:
- Visualiser tous les jobs sur une carte
- Créer/modifier/supprimer des jobs
- Assigner des jobs aux employés
- Voir les employés en temps réel

#### `/navigation`
Interface employé pour:
- Navigation GPS 3D immersive
- Liste des jobs assignés
- Compléter les jobs
- Tracking automatique

---

## 📊 Flux de données

### Création d'un job (Manager)

```
1. Manager crée un job avec adresse
   ↓
2. API geocode convertit l'adresse en lat/lng
   ↓
3. Job enregistré avec coordonnées dans Supabase
   ↓
4. Job apparaît ORANGE sur la carte (assigné)
   ↓
5. Notification à l'employé assigné
```

### Navigation (Employé)

```
1. Employé ouvre /navigation
   ↓
2. GPS commence le tracking (watchPosition)
   ↓
3. Position envoyée au serveur toutes les X secondes
   ↓
4. Route calculée avec Mapbox Directions API
   ↓
5. Carte mise à jour en temps réel
   ↓
6. À 50m de proximité → Job devient VERT
   ↓
7. Employé complète le job → Statut "completed"
```

---

## 🎨 Personnalisation

### Changer le seuil de proximité

Dans `/api/jobs/location/route.ts`:
```typescript
const { threshold = 50 } = body // Change 50 à la valeur désirée (en mètres)
```

### Modifier les couleurs des markers

Dans `Map3D.tsx`:
```typescript
const getJobColor = (job: Job): string => {
  if (job.is_urgent) return '#EF4444' // Rouge
  if (job.location_status === 'completed') return '#10B981' // Vert
  return '#F97316' // Orange
}
```

### Ajouter d'autres effets météo

Dans `Map3D.tsx`, fonction `addWeatherEffect()`:
```typescript
case 'fog':
  // Ajouter votre effet de brouillard
  break
```

---

## 🐛 Dépannage

### La carte ne s'affiche pas
- ✅ Vérifiez que `NEXT_PUBLIC_MAPBOX_API_KEY` est dans `.env.local`
- ✅ Redémarrez le serveur Next.js
- ✅ Vérifiez la console du navigateur pour les erreurs

### Géolocalisation ne fonctionne pas
- ✅ Autorisez la géolocalisation dans votre navigateur
- ✅ Utilisez HTTPS (requis pour geolocation API)
- ✅ Testez sur un appareil mobile pour un meilleur GPS

### Les jobs n'ont pas de coordonnées
- ✅ Assurez-vous que la migration DB est exécutée
- ✅ Vérifiez que l'adresse est valide
- ✅ Le géocodage fonctionne uniquement pour le Canada (country=CA)

### La détection de proximité ne fonctionne pas
- ✅ Vérifiez que le job a des coordonnées (lat/lng)
- ✅ Assurez-vous que le GPS est actif
- ✅ La précision GPS peut varier (intérieur vs extérieur)

---

## 🚀 Prochaines améliorations possibles

- [ ] **Notifications push** quand un nouveau job est assigné
- [ ] **Chat en temps réel** entre manager et employé
- [ ] **Photos de complétion** via camera
- [ ] **Signature électronique** du client
- [ ] **Optimisation de route** (multiple jobs)
- [ ] **Historique des trajets**
- [ ] **Rapport de temps** (début → arrivée → fin)
- [ ] **Mode hors-ligne** avec cache
- [ ] **AR (Réalité Augmentée)** pour trouver l'adresse
- [ ] **Intégration Apple Maps / Google Maps**

---

## 📝 Notes importantes

### Performance
- La carte 3D peut être gourmande en ressources sur mobile
- Le tracking GPS consomme de la batterie
- Optimisez en réduisant la fréquence de polling si nécessaire

### Sécurité
- Les clés API Mapbox doivent avoir des restrictions d'URL
- Utilisez RLS (Row Level Security) dans Supabase
- Ne partagez jamais vos clés dans le code

### Limites Mapbox (plan gratuit)
- 50,000 requêtes de geocoding/mois
- 100,000 chargements de carte/mois
- 1,000 directions API/mois

Si vous dépassez, considérez upgrader votre plan Mapbox.

---

## 🎉 Conclusion

Votre système de navigation GPS 3D est maintenant prêt!

**Pour tester:**
1. Créez un job avec une adresse valide sur `/jobs-map`
2. Assignez-le à un employé
3. Connectez-vous en tant qu'employé et allez sur `/navigation`
4. Profitez de la navigation 3D immersive! 🚗💨

**Questions?** Consultez la documentation Mapbox: https://docs.mapbox.com/

---

Créé avec ❤️ par Claude pour FoxWise Client
