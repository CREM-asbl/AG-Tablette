# 🤖 AGENTS.md - Mémoire inter-session pour IA

> **Objectif** : Économiser les requêtes IA, éviter les régressions, maintenir la cohérence architecturale et respecter les conventions du projet AG-Tablette.

## 📋 Informations du projet

### Architecture générale
- **Type** : Application web éducative pour géométrie interactive sur tablettes
- **Framework principal** : Astro 5.x + Lit Elements (Web Components)
- **Pattern architectural** : Component-based avec système de controllers modulaires
- **Build system** : Vite (via Astro)
- **État** : Production active (CREM-asbl)

### Stack technique
```
Frontend: Astro + Lit Elements + TypeScript/JavaScript
Backend: Firebase (Auth, Firestore, Storage, Functions)
Testing: Vitest (unit) + Playwright (E2E)
Outils: @lit-labs/signals, ESLint, Prettier, Service Worker
```

## 🏗️ Structure architecturale

### Organisation des dossiers
```
src/
├── components/     # Web Components Lit réutilisables
├── controllers/    # Logique métier modulaire (1 outil = 1 controller)
├── core/          # Systèmes centraux (Performance, Validation)
├── services/      # Services Firebase et utilitaires
├── store/         # Gestion d'état (Signals Lit)
└── utils/         # Fonctions utilitaires pures
```

### Pattern Controller
- **Principe** : 1 outil géométrique = 1 controller dédié
- **Structure** : `controllers/[NomOutil]/index.js`
- **Héritage** : Les outils héritent de `BaseGeometryTool` ou `BaseShapeCreationTool`.
- **État** : Utilisation exclusive de `appActions` pour modifier l'état réactif.

## 🎯 Conventions de développement

### État Global et Signaux (Avril 2026)
- **Architecture** : L'application utilise `@lit-labs/signals` pour une gestion d'état réactive.
- **Migration** : ✅ **TERMINÉE**. La fonction legacy `setState` a été supprimée.
- **Actions** : Toutes les modifications d'état passent par `appActions` défini dans `src/store/appState.js`.
- **Compatibilité** : L'objet global `window.app` est maintenu synchronisé par des écouteurs d'événements dans `App.js` pour la rétrocompatibilité.

### Code Style
- **Langue** : Français pour les noms de classes/méthodes métier.
- **Format** : Lit Elements pour les composants, classes ES6 pour la logique.
- **Imports** : Chemins absolus configurés dans `jsconfig.json`.
- **Performance** : Utiliser `PerformanceSystem.js` pour wrapper les opérations lourdes.

### Gestion des erreurs
- **Validation** : Utiliser `ValidationSystem.js` avant traitement.
- **Tooling** : Utiliser `safeUpdateStep(step)` dans les contrôleurs pour changer d'état de manière sécurisée.

## 🔧 Systèmes centraux

### PerformanceSystem.js
- **Rôle** : Monitoring des performances, métriques.

### ValidationSystem.js
- **Rôle** : Validation des données et états (Fail-fast).

### Canvas Architecture
- **Layers** : Système multi-couches (main, upper, background, grid/tangram, invisible).
- **Signal Sync** : `SignalSyncService.js` synchronise automatiquement le Workspace vers l'état réactif.

## ⚠️ Points d'attention critiques

### Historique (Undo/Redo)
- **Gestion** : Centralisée dans `HistoryManager.js`.
- **FullHistory** : Permet la relecture complète des actions.
- **Attention** : Toujours vérifier que les nouvelles actions sont correctement enregistrées dans l'historique.

### Tests
```bash
npm test          # Vitest (unit tests) - Requis avant chaque commit
npm run test:playwright # E2E tests (Playwright)
```

## 🚫 Anti-patterns à éviter

### ❌ À ne pas faire
- **`setState`** : Tenter d'utiliser la fonction `setState` (elle n'existe plus).
- **Mutation directe** : Modifier directement `app.settings` ou `app.tool` sans passer par `appActions`.
- **Import direct** : Importer un controller dans un autre (utiliser les événements).

### ✅ À faire
- **Signals** : Utiliser `SignalWatcher` dans les composants Lit pour réagir aux changements d'état.
- **appActions** : Utiliser `appActions.updateSettings()`, `appActions.setCurrentStep()`, etc.
- **TDD** : Écrire un test unitaire dans `test/controllers/` pour chaque nouvelle fonctionnalité.

---

## 🔄 Historique des décisions importantes

### Dernières modifications majeures
- **Finalisation Migration Signals (avril 2026)** : Suppression définitive de `setState` et du signal `changes`. Refactorisation de `Environment.js`, `App.js` et des outils Tangram. Renommage de `safeSetState` en `safeUpdateStep`.
- **Stabilisation Historique (mars 2026)** : Correction du système Undo/Redo et de la relecture. Suppression des dépendances circulaires.
- **Migration Signals (mars 2026)** : Migration progressive des outils (Rotate, Duplicate, CreateCircle, Zoom, Delete, Color, Move).

---

## 📝 Métadonnées
**Dernière mise à jour** : 7 Avril 2026
**Version** : 1.1.0
**Mainteneur** : équipe CREM-asbl
