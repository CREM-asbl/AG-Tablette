# Système de Cache Hors Ligne pour AG-Tablette

## Vue d'ensemble

Ce système permet aux utilisateurs d'accéder aux activités (.agg, .agl) même sans connexion internet, grâce à une combinaison de Service Worker, IndexedDB et synchronisation en arrière-plan.

## Composants

### 1. Service Worker (`public/service-worker.js`)
- Intercepte les requêtes vers les fichiers d'activités (.agg, .agl)
- Met automatiquement en cache les fichiers lors de leur premier téléchargement
- Sert les fichiers depuis le cache lorsque hors ligne

### 2. Gestionnaire IndexedDB (`src/utils/indexeddb-activities.js`)
- Stocke les fichiers d'activités localement dans IndexedDB
- Permet l'accès rapide aux activités sans réseau
- API simple : `saveActivity()`, `getActivity()`, `getAllActivities()`

### 3. Service de Synchronisation (`src/services/activity-sync.js`)
- Synchronise automatiquement les nouvelles activités du serveur
- Se déclenche lors de la reconnexion réseau
- Évite les téléchargements redondants

### 4. Indicateur de Synchronisation (`src/components/sync-status-indicator.ts`)
- Affiche uniquement la progression de la synchronisation des activités
- Apparait quand une synchronisation démarre, reste 2s après 100% puis disparaît
- Barre de progression et pourcentage, animation de rotation
- Positionnement fixe en bas à droite pour ne pas gêner la zone de dessin

### 5. Firebase Integration (`src/firebase/firebase-init.js`)
- Modifié pour vérifier d'abord IndexedDB avant le serveur
- Sauvegarde automatique des fichiers téléchargés
- Fallback sur le cache local en cas d'erreur réseau

## Fonctionnement

### Première utilisation (en ligne)
1. L'utilisateur ouvre une activité
2. Le fichier est téléchargé depuis Firebase Storage
3. Service Worker met en cache automatiquement
4. IndexedDB sauvegarde pour accès hors ligne

### Utilisation hors ligne
1. L'application vérifie d'abord IndexedDB
2. Si disponible, l'activité se charge instantanément
3. Sinon, message d'erreur approprié

### Synchronisation
1. Détection automatique de la reconnexion
2. Téléchargement des nouvelles activités en arrière-plan
3. Notification de fin de synchronisation

## Avantages

### 🎓 Pour les Enseignants
- Préparation de cours sans contrainte de connexion
- Continuité pédagogique avec WiFi instable
- Utilisation en sortie scolaire

### 👨‍🎓 Pour les Élèves
- Travail autonome à la maison sans internet
- Accès rapide aux activités (pas d'attente)
- Aucune perte de données en cas de déconnexion

### 🏫 Pour les Établissements
- Réduction de la charge réseau
- Fonctionnement même en cas de panne internet
- Meilleure performance générale

## Configuration

Le système s'initialise automatiquement au chargement de l'application. Aucune configuration particulière n'est requise.

## Événements

L'application émet des événements personnalisés utilisés par le système :
- `sync-progress` : { percent } progression courante (0-100)
- `activities-synced` : Synchronisation terminée (alias final 100%)
- `show-notif` : Notifications utilisateur diverses

## Futur

- Versioning des activités pour une synchronisation plus intelligente
- Compression des données stockées
- Gestion de la taille du cache
- API Background Sync pour une synchronisation plus robuste