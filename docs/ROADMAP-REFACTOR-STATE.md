# Roadmap de Refactorisation : Architecture State-Driven avec Signals

Ce document sert de plan directeur pour la migration de l'application `ag-tablette` vers une architecture moderne, déclarative et basée sur l'état (`UI = f(state)`).

## Objectif Principal

Abandonner l'architecture impérative actuelle basée sur des `controllers` au profit d'une gestion d'état réactive et centralisée en utilisant la bibliothèque `Signals` déjà présente dans le projet.

## Méthodologie : Refactorisation Sécurisée par les Tests

Pour chaque fonctionnalité ou `controller` à migrer, le processus suivant doit être appliqué rigoureusement pour garantir la non-régression.

### Étape 1 : Test de Caractérisation (E2E)
- **Quoi :** Écrire un test de haut niveau (End-to-End avec Playwright) qui capture le comportement **actuel** de la fonctionnalité.
- **Pourquoi :** Créer un filet de sécurité qui définit le comportement attendu. Ce test valide le code *avant* la refactorisation.
- **Résultat :** Un test qui passe sur la branche principale.

### Étape 2 : Développement Guidé par les Tests (TDD)
- **Quoi :** Implémenter la nouvelle logique avec des `Signals` en suivant un cycle TDD strict (Rouge-Vert-Refactor) avec des tests unitaires (Vitest).
- **Pourquoi :** Concevoir et construire la nouvelle implémentation de manière propre, découplée et validée unitairement.
- **Résultat :** Une nouvelle logique fonctionnelle couverte par des tests unitaires rapides.

### Étape 3 : Vérification de Non-Régression
- **Quoi :** Exécuter à nouveau le test de caractérisation de l'Étape 1, sans aucune modification, contre la nouvelle implémentation.
- **Pourquoi :** Prouver que la nouvelle implémentation est un remplacement comportementalement identique à l'ancienne.
- **Résultat :** Le test E2E de l'Étape 1 doit passer au vert.

### Étape 4 : Nettoyage
- **Quoi :** Supprimer l'ancien code (fichiers de `controller`, anciennes méthodes d'état, etc.).
- **Pourquoi :** Finaliser la migration de la fonctionnalité et réduire la dette technique.
- **Résultat :** Un code base plus propre et moderne.

---
## Avancement de la Migration

### Phase 1 : Couverture des tests (TERMINÉ)
- [x] Modules critiques > 60% de couverture.

### Phase 2 : Migration des Composants UI (TERMINÉ)
- [x] `ag-menu.ts`
- [x] `ag-app.ts`
- [x] Popups principaux.
- [x] `zoom-menu.js` (pilotage de l'état zoom via `appActions`, fallback legacy conservé).
- [x] `shape-selector.ts` (sélection de template pilotée par `appActions`, fallback legacy conservé).
- [x] `CreateRegular/regular-popup.js` (settings + transition d'outil pilotés par `appActions`, fallback legacy conservé).

### Phase 3 : Migration des Outils (EN COURS)
- [x] **DeleteTool** : Migré vers `appActions`. Validé par tests unitaires et E2E.
- [x] **ColorTool** : Migré vers `appActions`. Validé par tests unitaires et E2E.
- [x] **MoveTool** : Migré vers `appActions`. Validé par tests unitaires et E2E.
- [x] **DuplicateTool** : Migré vers `appActions`. Validé par tests unitaires et E2E.
- [x] **CentralSymetryTool** : Migré vers `appActions`. Validé par tests unitaires et E2E.
- [x] **CreatePointTool** : Migré vers `appActions`. Validé par tests unitaires ciblés.
- [x] **CreateRegularTool** : Migré vers `appActions`. Validé par tests unitaires ciblés.
- [x] **CreateLineTool** : Migré vers `appActions`. Validé par tests unitaires ciblés.
- [x] **CreateIrregularTool** : Migré vers `appActions`. Validé par tests unitaires ciblés.
- [x] **DivideTool** : Migré vers `appActions`. Validé par tests unitaires ciblés.
- [x] **ReverseTool** : Migré vers `appActions`. Validé par tests unitaires ciblés.
- [x] **OrthogonalSymetryTool** : Migration stabilisée. Validé par tests unitaires et E2E.
- [x] **TranslationTool** : Migré vers `appActions`. Validé par tests unitaires et E2E.
- [x] **TranslateTool** : Migré vers `appActions` (avec fallback `setState`). Validé par tests unitaires ciblés.
- [x] **RotationTool** : Migré vers `appActions`. Validé par tests unitaires ciblés.
- [x] **RotateTool** : Migré vers `appActions`. Validé par tests unitaires et E2E.
- [x] **CreateCircleTool** : Migré vers `appActions`. Validé par tests unitaires et E2E.
- [x] **CreateTool** : Migré vers `appActions` (avec fallback `setState`). Validé par tests unitaires ciblés.
- [x] **ZoomTool** : Migré vers `appActions` pour les transitions wheel/touch (avec fallback `setState`). Validé par tests unitaires ciblés.
- [x] **BifaceTool** : Migré vers `appActions` (avec fallback `setState`). Validé par tests unitaires ciblés.
- [x] **BuildCenterTool** : Migré vers `appActions` (avec fallback `setState`). Validé par tests unitaires ciblés.
- [x] **UngroupTool** : Migré vers `appActions` (avec fallback `setState`). Validé par tests unitaires ciblés.
- [x] **CopyTool** : Migré vers `appActions` (avec fallback `setState`). Validé par tests unitaires ciblés.
- [x] **GroupTool** : Migré vers `appActions` (avec fallback `setState`). Validé par tests unitaires ciblés.
- [x] **ShowTool** : Migré vers `appActions` (avec fallback `setState`). Validé par tests unitaires ciblés.
- [x] **HideTool** : Migré vers `appActions` (avec fallback `setState`). Validé par tests unitaires ciblés.

### État de la Couverture E2E
- [x] Tests de base pour Delete, Color, Move dans `tests/`.
- [ ] Étendre à tous les outils de la barre d'outils.

---
*Ce document sera maintenu à jour pour refléter l'avancement de la migration.*
