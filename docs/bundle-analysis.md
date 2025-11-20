# Analyse du Bundle

**Date** : 20 novembre 2025
**Outil** : `npm run build` (Vite/Rollup)

## Résumé Global

-   **Taille Totale (estimée)** : ~1 MB (non compressé) / ~250 KB (gzip)
-   **Temps de Build** : ~6.70s
-   **Performance** : Le chargement initial est impacté par la taille du chunk Firebase.

## Détail des Chunks Principaux

| Fichier | Taille (Brut) | Taille (Gzip) | Contenu Probable |
| :--- | :--- | :--- | :--- |
| `firebase-init.js` | **541.69 kB** ⚠️ | 137.32 kB | Firebase App, Firestore, Auth, Storage, Analytics |
| `ag-app.js` | **183.75 kB** | 45.69 kB | Logique principale de l'application, imports statiques |
| `ag-main.js` | 42.60 kB | 11.21 kB | Layout principal |
| `open-popup.js` | 42.52 kB | 9.96 kB | Popup d'ouverture de fichier (probablement inclut du parsing) |
| `recomputeShape.js` | 20.95 kB | 4.10 kB | Logique géométrique complexe |

## Avertissements

> [!WARNING]
> `dist/_astro/firebase-init.H62r80Ze.js` (541.69 kB) dépasse la limite recommandée de 500 kB.

## Analyse de la Configuration Actuelle (`astro.config.mjs`)

La configuration `manualChunks` est déjà en place :
```javascript
manualChunks: {
  'controllers': ['src/controllers'],
  'firebase': ['firebase/app', 'firebase/firestore', 'firebase/storage', 'firebase/auth', 'firebase/analytics'],
  'lit': ['lit', '@lit-labs/signals', 'lit-html'],
  'utils': ['src/utils', 'src/core', 'src/services'],
  'components': ['src/components'],
  'store': ['src/store']
}
```

### Observations :
1.  **Firebase** : Le regroupement de tous les modules Firebase en un seul chunk crée un gros fichier bloquant.
2.  **ag-app** : Semble contenir beaucoup de code malgré la séparation des `components` et `controllers`. Cela peut être dû à des imports directs ou des dépendances non capturées par les patterns `manualChunks`.

## Recommandations d'Optimisation

### 1. Optimisation Firebase (Priorité Haute)
-   **Lazy Loading** : Charger Firebase uniquement lorsque nécessaire (ex: à la connexion ou sauvegarde), ou charger les modules secondaires (Analytics, Performance) dynamiquement.
-   **Imports Sélectifs** : Vérifier si tous les sous-modules importés sont utilisés.

### 2. Code Splitting des Popups
-   Les popups comme `open-popup` (42KB) et `settings-popup` sont probablement chargés au démarrage mais utilisés rarement.
-   **Action** : Utiliser l'import dynamique `import(...)` pour ces composants dans `ag-app.ts` ou `ag-main.ts`.

### 3. Vérification des Chunks
-   S'assurer que `lit` et `lit-html` sont bien dédupliqués. Le chunk `lit-html` est petit (7KB), ce qui est bon signe.

## Résultats de l'Optimisation (Lazy Loading)

**Action** : Lazy loading de `open-server-popup` dans `open-popup.js`.

| Fichier | Avant | Après | Gain |
| :--- | :--- | :--- | :--- |
| `open-popup.js` | 42.52 kB | **1.70 kB** | **-96%** 🚀 |
| `open-server-popup.js` | (inclus) | 41.45 kB | Nouveau chunk (chargé à la demande) |
| `firebase-init.js` | 541.69 kB | 541.66 kB | Découplé du chargement initial de `open-popup` |

**Impact** : Le popup "Ouvrir" s'affiche instantanément. Le lourd SDK Firebase n'est chargé que si l'utilisateur clique sur "Ouvrir en ligne".

## Résultats de l'Optimisation (Splitting)

**Action** : Configuration avancée de `manualChunks` dans `astro.config.mjs` pour découper intelligemment les dossiers `src/`.

| Chunk | Avant | Après | Contenu |
| :--- | :--- | :--- | :--- |
| `ag-app.js` | 183.75 kB | **0.21 kB** 📉 | Point d'entrée minimal |
| `controllers.js` | (inclus) | 424.34 kB | Logique métier (Core, Tools...) |
| `components.js` | (inclus) | 127.73 kB | Composants UI (Lit) |
| `store.js` | (inclus) | 15.75 kB | Gestion d'état (Signals) |
| `firebase.js` | 541.66 kB | 517.08 kB | SDK Firebase (isolé) |

**Impact** :
- Le fichier principal `ag-app` est devenu minuscule.
- Meilleure mise en cache : modifier un composant n'invalide pas le cache des contrôleurs ou de Firebase.
- Préparation idéale pour le lazy-loading futur des contrôleurs.

## Résultats de l'Optimisation (Lazy Loading Firebase)

**Action** : Suppression des imports statiques de Firebase dans les popups (`file-elem`, `module-elem`, `theme-elem`, `open-server-popup`) et `Bugs.js`. Remplacement par des imports dynamiques (`await import(...)`).

| Chunk | Avant | Après | Gain |
| :--- | :--- | :--- | :--- |
| **Initial Bundle** | ~1.1 MB | **~0.6 MB** | **-45%** 📉 |
| `firebase.js` | Chargé au démarrage | **Différé** (Lazy) | 518 kB économisés |

**Détail du chargement initial :**
- `controllers.js` : 424 kB
- `components.js` : 111 kB
- `lit.js` : 34 kB
- `store.js` : 15 kB
- `ag-main.js` : 7 kB
- `ag-app.js` : 0.2 kB

**Conclusion** : L'objectif principal est atteint. Le SDK Firebase (la plus grosse dépendance) n'est plus chargé au démarrage de l'application, mais uniquement lorsque l'utilisateur interagit avec les fonctionnalités serveur (Ouvrir en ligne, Notions, etc.) ou pour la synchronisation en arrière-plan.

## Prochaines Étapes
1.  Améliorer la couverture de tests (Objectif 40%).
2.  Continuer la migration vers les Signals pour les outils restants.
