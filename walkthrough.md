# Walkthrough - Migration Signal (Phase 2)

## Objectif
Migrer les composants principaux vers l'architecture Signal pour valider l'approche "Shadow State".

## Changements Effectués

### 1. Infrastructure Signal
- **`src/services/SignalSyncService.js`** : Création d'un service qui écoute les événements legacy (`tool-changed`, `refresh`, etc.) et met à jour le store Signal.
- **`src/store/appState.js`** : Ajout de nouveaux signaux (`historyState`, `filename`, `helpSelected`) pour couvrir les besoins de l'UI.
- **`src/controllers/Core/App.js`** : Initialisation du `SignalSyncService` + import de `HistoryManager`.

### 2. Migration UI
- **`ag-main.ts`** : Transformation en composant réactif, suppression des écouteurs manuels.
- **`ag-menu.ts`** : Suppression des props, utilisation directe des signaux (`activeTool`, `historyState`, `helpSelected`).

## Tests Effectués

### Tests Unitaires
- ✅ `test/layouts/ag-main.test.js` : 3/3 tests passés
- ✅ `test/layouts/ag-menu.test.js` : 4/4 tests passés
- ✅ `test/services/SignalSyncService.test.js` : 4/4 tests passés

### Tests Manuels
- ✅ Changement d'outil : les signaux se mettent à jour correctement
- ✅ Menu : tous les boutons fonctionnent
- ✅ Undo/Redo : les boutons s'activent/désactivent correctement après des actions
- ✅ Help : le mode aide fonctionne

## Correction du Problème Undo/Redo

### Problème Identifié
Les boutons undo/redo restaient toujours désactivés malgré l'ajout de formes. Investigation révélée que :
- L'événement `actions-executed` était bien dispatché par `CreateTool`
- MAIS `HistoryManager.js` n'était jamais chargé, donc ses listeners n'étaient jamais enregistrés

### Solution Appliquée
Ajout d'un import de `HistoryManager.js` dans [`App.js`](file:///c:/Users/gunbl/Dev/ag-tablette/src/controllers/Core/App.js#L6) :
```javascript
import './Managers/HistoryManager'; // Import to register event listeners
```

Cette simple ligne garantit que les event listeners de `HistoryManager` sont enregistrés au démarrage de l'application :
- `actions-executed` → `HistoryManager.addStep()`
- `undo` → `HistoryManager.undo()`
- `redo` → `HistoryManager.redo()`

### Flux Complet Vérifié
1. **Action utilisateur** : clic sur canvas → `CreateTool.canvasMouseUp()`
2. **Exécution** : `this.executeAction()` → dispatch `actions-executed`
3. **Historique** : `HistoryManager.addStep()` → `setState({ history: ... })`
4. **Signal** : `history-changed` → `SignalSyncService` → `appActions.setHistoryState()`
5. **UI** : `ag-menu` re-render automatiquement via `SignalWatcher`

Le système fonctionne maintenant de bout en bout ! ✅

## Migration de canvas-container.ts

### Approche Minimaliste
Après analyse, `canvas-container.ts` ne nécessitait qu'une **migration minimale** car :
- L'état du curseur (`cursorPos`, `cursorShow`) est **local** au composant
- Les event listeners sont appropriés pour le cycle de vie du composant
- Seule la prop `environment` devait être migrée vers un signal

### Changements Effectués
- **`src/components/canvas-container.ts`** :
  - Ajout de `SignalWatcher`
  - Import et utilisation de `currentEnvironment` signal
  - Suppression de `@property environment`
  - Utilisation de `currentEnvironment.get()` dans `render()`

- **`src/layouts/ag-main.ts`** :
  - Suppression de la prop `.environment="${app.environment}"`

### Vérification
- ✅ Le canvas s'affiche correctement
- ✅ Le redimensionnement fonctionne
- ✅ L'affichage varie selon l'environnement (grid vs tangram)

## Prochaines Étapes
- Migrer d'autres composants UI (ex: `canvas-container`)
- Remplacer progressivement les `dispatchEvent` par des appels directs aux actions Signal
