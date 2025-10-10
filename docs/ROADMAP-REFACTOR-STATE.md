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
*Ce document sera maintenu à jour pour refléter l'avancement de la migration.*
