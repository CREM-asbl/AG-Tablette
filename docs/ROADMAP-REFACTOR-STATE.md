# Roadmap de Refactorisation : Architecture State-Driven avec Signals

Ce document sert de plan directeur pour la migration de l'application `ag-tablette` vers une architecture moderne, déclarative et basée sur l'état (`UI = f(state)`) en utilisant les signaux Lit (`@lit-labs/signals`).

## État Global de la Migration : ✅ TERMINÉE (Avril 2026)

Toute la logique de gestion d'état a été migrée des contrôleurs impératifs vers un état réactif centralisé basé sur les signaux. La fonction legacy `setState` a été supprimée.

---

## 1. Fondations (Terminé)
- [x] Installer `@lit-labs/signals`.
- [x] Créer `src/store/appState.js` pour l'état global et les actions.
- [x] Créer un pont de compatibilité dans `App.js` pour synchroniser les signaux vers l'objet `app` legacy.
- [x] Configurer `SignalSyncService.js` pour la synchronisation automatique du Workspace.

## 2. Migration des Outils (Terminé)
Tous les outils géométriques et utilitaires ont été migrés pour utiliser `appActions` au lieu de `setState`.

### Outils de base
- [x] `DeleteTool`
- [x] `ColorTool`
- [x] `MoveTool`
- [x] `RotateTool`
- [x] `DuplicateTool`
- [x] `CreateCircleTool`
- [x] `ZoomTool`

### Outils complexes et Spécifiques
- [x] `CreateTriangleTool`
- [x] `CreateQuadrilateralTool`
- [x] `CreateRegularTool`
- [x] `CreateIrregularTool`
- [x] `Tangram` (SilhouetteCreator, SolutionChecker)
- [x] `ScalarMultiplication`
- [x] `Group` / `Ungroup`
- [x] `Copy`
- [x] `Biface`
- [x] `Opacity` / `Hide` / `Show`

## 3. Cœur du Système (Terminé)
- [x] `Environment.js` : Migration du chargement des environnements vers les signaux.
- [x] `App.js` : Suppression définitive de `setState` et du signal de transition `changes`.
- [x] `BaseGeometryTool.js` : Refactorisation de `safeSetState` en `safeUpdateStep`.
- [x] Nettoyage des imports inutilisés dans tous les contrôleurs.

## 4. Tests et Validation (Terminé)
- [x] Mise à jour des tests unitaires (`App.test.js`, `SilhouetteCreatorTool.test.js`, `zoom-menu.test.js`).
- [x] Validation de la non-régression sur l'historique (Undo/Redo).
- [x] Vérification du fonctionnement du mode Tangram.

---

## Prochaines Étapes (Post-Migration)
Bien que la migration technique soit terminée, voici les optimisations futures possibles :
1.  **Refactorisation UI** : Migrer progressivement les composants Lit restants pour utiliser `SignalWatcher` et accéder directement aux signaux exportés de `appState.js` plutôt que de passer par l'objet `app` global.
2.  **Suppression complète du pont legacy** : Une fois que tous les composants utiliseront les signaux, supprimer les écouteurs d'événements dans `App.js` qui maintiennent l'objet `app` synchronisé.
3.  **Typer l'état** : Convertir `appState.js` en TypeScript pour une meilleure sécurité.

---
*Dernière mise à jour : 7 Avril 2026 - Migration finalisée.*
