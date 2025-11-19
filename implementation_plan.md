# Plan de Migration : canvas-container.ts

## Analyse

`canvas-container.ts` est le conteneur principal des couches canvas. Il gère :
- Le rendu de plusieurs `canvas-layer` (invisible, background, grid/tangram, main, upper)
- L'affichage d'un curseur temporaire
- Le redimensionnement du canvas
- Les event listeners pour les interactions souris

## Changements Proposés

### Changements Minimes Requis

Ce composant n'a **PAS besoin** d'une migration Signal majeure car :
- `cursorPos`, `cursorSize`, `cursorShow` sont de l'**état local** au composant (pas d'état global nécessaire)
- Les event listeners (`resize`, `mouse-coordinates-changed`, etc.) sont des **side effects** appropriés pour `firstUpdated()` et `disconnectedCallback()`
- Le contenu de `render()` ne dépend que de l'état local et de `environment`

### Seule Modification : Utiliser le Signal `currentEnvironment`

**Fichier** : `src/components/canvas-container.ts`

**Avant** :
```typescript
@property({ type: Object }) environment;
```

**Après** :
```typescript
import { SignalWatcher } from '@lit-labs/signals';
import { currentEnvironment } from '../store/appState';

class CanvasContainer extends SignalWatcher(LitElement) {
  // Supprimer @property environment
  
  render() {
    const environment = currentEnvironment.get();
    // ... rest of render
  }
}
```

**Mise à jour dans** : `src/layouts/ag-main.ts`
```typescript
// Supprimer la prop environment passée à canvas-container
<canvas-container></canvas-container>
```

## Justification

Ce composant est **déjà bien structuré** :
- État local approprié pour le curseur
- Event listeners correctement nettoyés dans `disconnectedCallback()`
- Aucun état global à gérer sauf `environment`

Une migration plus poussée serait **over-engineering** et n'apporterait pas de valeur.

## Vérification

### Test Manuel
1. Vérifier que le canvas se redimensionne correctement
2. Vérifier que le curseur temporaire apparaît lors d'actions
3. Vérifier l'affichage du tangramCanvas vs gridCanvas selon l'environnement

### Test Unitaire (Optionnel)
Créer `test/components/canvas-container.test.js` pour vérifier :
- Le rendu des bonnes couches selon l'environnement
- L'intégration du signal `currentEnvironment`
