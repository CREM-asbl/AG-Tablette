# Mapping slug site ↔ documents Firestore (AG-Tablette)

## Objet

Ce document décrit la correspondance entre un **slug site** (identifiant stable côté site AG, ex. `mon-activite`) et les documents Firestore `files` / `modules` d'AG-Tablette, ainsi que l'ordre de résolution utilisé par `resolveBySiteSlug`.

## Normalisation

- Le slug fourni est normalisé par `trim()` puis `toLowerCase()`.
- Un slug vide (après normalisation) renvoie `null`.
- La comparaison avec `siteSlug` et les IDs Firestore est faite sur la valeur normalisée.

## Ordre de résolution

`resolveBySiteSlug(slug)` (dans `src/services/site-slug-resolver.ts`) applique, dans cet ordre :

1. **Firestore — fichier par `siteSlug`** : `findFileBySiteSlug(normalized)` sur la collection `files`.
2. **Firestore — module par `siteSlug`** : `findModuleBySiteSlug(normalized)` sur la collection `modules`.
3. **Firestore — ID exact fichier** : `getFileDocFromFilename(normalized)` (document `files/{id}`).
4. **Firestore — ID exact module** : `getModuleById(normalized)` (document `modules/{id}`).
5. **Cache mémoire** : signaux `cachedModulesByTheme` puis `cachedFiles`.
6. **IndexedDB** : `getAllModules()` puis `getAllThemes()` (best-effort).
7. **Offline / inconnu** : `null` (aucune exception propagée).

Chaque étape Firestore est protégée : une erreur réseau (offline) est ignorée et la résolution continue sur les caches, puis `null`.

## Correspondance slug ↔ document

| Slug site (normalisé) | Collection Firestore | Champ clé | Résultat (`SiteSlugResolution`) |
|---|---|---|---|
| `mon-activite` | `files` | `siteSlug == "mon-activite"` | `{ kind: 'file', fileId, moduleId?, themeId? }` |
| `mon-module` | `modules` | `siteSlug == "mon-module"` | `{ kind: 'module', moduleId, themeId? }` |
| `doc-id-exact` | `files` | document id == slug | `{ kind: 'file', ... }` |
| `module-id-exact` | `modules` | document id == slug | `{ kind: 'module', ... }` |

Les champs optionnels `siteSlug` sont persistés sur les documents `files` et `modules` (et dans le cache IndexedDB) pour permettre le mapping sans changer les IDs existants.

## Extraction du slug depuis l'URL

Helper pur `parseSlug(pathname, search)` :

- Si le chemin est `/open/:slug`, retourne le slug décodé (prioritaire).
- Sinon, retourne la valeur du paramètre de requête `?slug=`.
- Sinon, `null`.

## Exemples d'URL

- Deep-link chemin : `https://ag.crem.be/open/mon-activite`
- Deep-link query : `https://ag.crem.be/?slug=mon-activite`
- Page Astro statique : `src/pages/open/[slug].astro` (getStaticPaths liste `KNOWN_OPEN_SLUGS` depuis `src/services/known-open-slugs.ts`) + fallback `src/pages/open/index.astro` pour `?slug=` + script client qui appelle `resolveBySiteSlug` via helper partagé `src/services/open-page.ts`.

## Non-objectifs

- Pas de renommage des IDs Firestore existants.
- Pas de changement de schéma breaking (champ `siteSlug` optionnel).
- Pas de support Site-AGm ni de médias.
- Pas de bump de version IndexedDB (reste v4).
- Pas de modification des règles Firestore au-delà de la lecture existante.
