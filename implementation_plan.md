# Phase 2 : Migration UI vers Signal - `ag-menu.ts`

## Objectif
Migrer `ag-menu.ts` pour utiliser les signaux et actions directement, réduisant la dépendance aux props et aux événements globaux.

## Changements Proposés

### 1. Migration du Composant
#### [MODIFY] [src/layouts/ag-menu.ts](file:///c:/Users/gunbl/Dev/ag-tablette/src/layouts/ag-menu.ts)
- Supprimer les `@property` (`helpSelected`, `tool`, `canUndo`, `canRedo`).
- Utiliser les signaux `helpSelected`, `activeTool`, `historyState` dans `render`.
- Remplacer `setState` par `appActions`.
- Remplacer `window.dispatchEvent('undo')` par `historyActions.undo()`.
- Remplacer `window.dispatchEvent('redo')` par `historyActions.redo()`.

### 2. Nettoyage
- Vérifier si `ag-main.ts` a besoin de passer des props à `ag-menu`. (Non, car `ag-menu` sera autonome).
- Mettre à jour `ag-main.ts` pour ne plus passer de props à `ag-menu`.

## Plan de Vérification
### Vérification Manuelle
- Vérifier que le menu affiche le bon outil.
- Vérifier que les boutons Undo/Redo sont activés/désactivés correctement.
- Vérifier que l'aide s'active/désactive.
