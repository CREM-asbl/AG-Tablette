# Plan d'Action pour la Migration du State Management du Module Grid

1.  **Analyse et Préparation (Module `Grid`) :**
    *   **Responsabilités principales :**
        *   Affichage de données tabulaires.
        *   Gestion de la source de données (chargement initial, mises à jour).
        *   Pagination.
        *   Tri par colonne.
        *   Filtrage des données.
        *   Sélection de lignes.
        *   Configuration des colonnes (visibilité, ordre).
        *   Potentiellement, état de chargement, erreurs.
    *   **Données spécifiques gérées :**
        *   Liste des éléments de données (`items`).
        *   Configuration actuelle de la pagination (page actuelle, éléments par page, nombre total d'éléments).
        *   Configuration du tri (colonne triée, direction du tri).
        *   Valeurs des filtres actifs.
        *   Liste des lignes sélectionnées (IDs ou objets).
        *   Configuration des colonnes (largeur, visibilité, ordre).
        *   Indicateurs d'état (ex: `isLoading`, `error`).
    *   **Actions modifiant l'état :**
        *   `fetchData` / `reloadData`
        *   `changePage(newPage)`
        *   `setItemsPerPage(count)`
        *   `sortByColumn(columnId, direction)`
        *   `applyFilter(filterCriteria)`
        *   `clearFilters()`
        *   `toggleRowSelection(rowId)`
        *   `selectAllRows()`
        *   `clearSelection()`
        *   `updateColumnConfig(config)`
    *   **Consommation de l'état :**
        *   Les composants d'affichage de la grille (en-têtes, lignes, cellules, pagination, contrôles de filtre/tri).
        *   Potentiellement d'autres modules qui dépendent des données sélectionnées dans la grille ou de son état.

2.  **Tests de non-régression (avant migration pour `Grid`) :**
    *   **Objectif :** Écrire des tests fonctionnels/intégration qui couvrent les scénarios clés suivants avec l'ancien state management :
        *   Affichage correct des données initiales.
        *   Fonctionnement de la pagination (aller à la page suivante/précédente, changer le nombre d'éléments).
        *   Fonctionnement du tri sur une ou plusieurs colonnes.
        *   Application et suppression de filtres.
        *   Sélection et désélection de lignes (simple, multiple).
        *   Interaction avec les contrôles de la grille (si des actions spécifiques sont déclenchées).
    *   **Action :** S'assurer que ces tests passent avec le système actuel.

3.  **Conception du nouvel état (pour `Grid` avec le nouveau système) :**
    *   **Définir la structure du nouvel état :**
        *   Exemple (conceptuel) :
            ```json
            {
              "gridData": {
                "items": [],
                "totalItems": 0,
                "isLoading": false,
                "error": null
              },
              "gridConfig": {
                "pagination": { "currentPage": 1, "pageSize": 10 },
                "sorting": { "column": null, "direction": "asc" },
                "filters": {},
                "columns": [/* ...config par colonne... */]
              },
              "gridSelection": {
                "selectedRowIds": []
              }
            }
            ```
    *   **Nouveaux sélecteurs, actions, logiques :**
        *   **Sélecteurs :** `getVisibleItems`, `getCurrentPageInfo`, `getSortConfig`, `getActiveFilters`, `getSelectedRows`, `isLoadingState`, `getErrorState`.
        *   **Actions :** `LOAD_GRID_DATA_START`, `LOAD_GRID_DATA_SUCCESS`, `LOAD_GRID_DATA_FAILURE`, `SET_GRID_PAGE`, `SET_GRID_SORT`, `APPLY_GRID_FILTER`, `TOGGLE_GRID_ROW_SELECTION`, etc.
        *   **Logique (reducers/mutations) :** Fonctions pures pour gérer chaque action et mettre à jour l'état de manière immuable.

4.  **Implémentation et Tests unitaires (pour `Grid`) :**
    *   **Action :** Implémenter les nouvelles actions et la logique de mise à jour de l'état pour `Grid` en utilisant le nouveau système de gestion d'état.
    *   **Action :** Écrire des tests unitaires pour chaque nouvelle action et chaque fonction de logique d'état (reducer/mutation).
        *   Exemple : Tester qu'une action `SET_GRID_PAGE` met correctement à jour `gridConfig.pagination.currentPage`.
        *   Exemple : Tester qu'un reducer pour `LOAD_GRID_DATA_SUCCESS` met à jour `items` et `totalItems` et réinitialise `isLoading` et `error`.
    *   **Action :** Modifier les composants du module `Grid` (ex: `<GridComponent>`, `<PaginationControls>`, `<FilterBar>`) pour qu'ils lisent et écrivent dans le nouveau store d'état.

5.  **Validation et Itération (pour `Grid`) :**
    *   **Action :** Exécuter tous les tests :
        *   Les nouveaux tests unitaires pour la logique d'état du module `Grid`.
        *   Les tests de non-régression (fonctionnels/intégration) écrits à l'étape 2.
    *   **Action :** Si des tests de non-régression échouent, identifier la cause (bug dans la nouvelle implémentation, mauvaise adaptation des composants) et corriger.
    *   **Action :** Si des tests unitaires échouent, corriger l'implémentation de la logique d'état.
    *   **Action :** Refactoriser le code du module `Grid` (logique d'état, composants) et les tests pour améliorer la clarté, la performance et la maintenabilité.

6.  **Intégration et Communication inter-états (pour `Grid`, si applicable) :**
    *   **Analyse :** Le module `Grid` doit-il communiquer des changements d'état (ex: lignes sélectionnées) à des modules qui utilisent encore l'ancien système ? Ou doit-il lire des informations d'état de ces modules ?
    *   **Action (si besoin) :** Mettre en place des adaptateurs ou des mécanismes d'événements pour assurer la compatibilité temporaire. Par exemple, si un autre module attend un événement de l'ancien système lorsque la sélection change, le nouveau module `Grid` pourrait avoir besoin d'émettre un événement similaire après avoir mis à jour son propre état.
