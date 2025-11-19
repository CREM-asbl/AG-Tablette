# Walkthrough - Migration Signal (Phase 2)

## Objectif
Migrer le composant principal `ag-main.ts` vers l'architecture Signal pour valider l'approche "Shadow State".

## Changements Effectués

### 1. Infrastructure Signal
- **`src/services/SignalSyncService.js`** : Création d'un service qui écoute les événements legacy (`tool-changed`, `refresh`, etc.) et met à jour le store Signal.
- **`src/store/appState.js`** : Ajout de nouveaux signaux (`historyState`, `filename`, `helpSelected`) pour couvrir les besoins de l'UI.
- **`src/controllers/Core/App.js`** : Initialisation du `SignalSyncService`.

### 2. Migration UI
- **`ag-main.ts`** : Transformation en composant réactif, suppression des écouteurs manuels.
- **`ag-menu.ts`** : Suppression des props, utilisation directe des signaux (`activeTool`, `historyState`, `helpSelected`).

## Vérification

### Tests Unitaires
- **`test/services/SignalSyncService.test.js`** : Vérifie la synchro Legacy -> Signal.
- **`test/layouts/ag-main.test.js`** : Vérifie `ag-main` (titre, intégration).
- **`test/layouts/ag-menu.test.js`** : Vérifie `ag-menu` (affichage outil, boutons undo/redo, aide).

### Résultats
- ✅ `SignalSyncService` opérationnel.
- ✅ `ag-main` migré et testé.
- ✅ `ag-menu` migré et testé.

## Prochaines Étapes
- Migrer d'autres composants UI (ex: `ag-menu`, `canvas-container`).
- Remplacer progressivement les `dispatchEvent` par des appels directs aux actions Signal.
