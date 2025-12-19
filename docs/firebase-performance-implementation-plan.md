# 🚀 Plan d'implémentation Firebase Performance

## ✅ Déjà réalisé

### 1. Infrastructure de base
- ✅ Export de Firebase Performance dans `firebase-init.js`
- ✅ Fonctions utilitaires `traceOperation()` et `recordMetric()`
- ✅ Intégration dans `PerformanceManager.measure()`
- ✅ Méthode `recordCustomMetric()` ajoutée
- ✅ PerformanceSystem limité au mode développement uniquement

### 2. Exemples d'instrumentation
- ✅ `parseFile()` dans OpenFileManager.js
- ✅ `openFileFromServer()` dans firebase-init.js
- ✅ Métrique `workspace-objects-count`

### 3. Documentation
- ✅ Guide d'intégration complet
- ✅ Fichier d'exemples pratiques
- ✅ Bonnes pratiques et anti-patterns

---

## 📋 Prochaines étapes prioritaires

### Phase 1 : Opérations critiques (Priorité HAUTE)

#### A. Chargement et fichiers
```javascript
// À instrumenter dans firebase-init.js
- ✅ openFileFromServer() - FAIT
- [ ] readFileFromServer()
- [ ] findAllThemes()
- [ ] getModulesDocFromTheme()
- [ ] downloadFileZip()
```

**Métriques à ajouter :**
- `file-size-bytes` - Taille du fichier
- `cache-status` - Hit/Miss
- `download-source` - IndexedDB/Firebase/Cache

#### B. Workspace et parsing
```javascript
// À instrumenter dans OpenFileManager.js et WorkspaceManager.js
- ✅ parseFile() - FAIT
- [ ] setWorkspaceFromObject()
- [ ] saveWorkspace()
- [ ] exportWorkspace()
```

**Métriques à ajouter :**
- ✅ `workspace-objects-count` - FAIT
- `workspace-complexity-score` - Score calculé
- `export-format` - Format d'export (ags/agc)

#### C. Synchronisation
```javascript
// À instrumenter dans ActivitySyncService.js
- [ ] syncActivity()
- [ ] saveToFirebase()
- [ ] loadFromFirebase()
- [ ] resolveConflict()
```

**Métriques à ajouter :**
- `sync-data-size` - Taille des données synchronisées
- `sync-conflicts` - Nombre de conflits
- `sync-status` - Succès/Échec

---

### Phase 2 : Canvas et rendu (Priorité MOYENNE)

#### A. Rendu Canvas
```javascript
// À instrumenter dans canvas-layer.js et controllers
- [ ] renderAll()
- [ ] addObject()
- [ ] removeObject()
- [ ] clearCanvas()
```

**Métriques à ajouter :**
- `canvas-objects-count` - Nombre d'objets
- `canvas-vertices-count` - Nombre de sommets totaux
- `canvas-layers-count` - Nombre de couches

#### B. Opérations géométriques
```javascript
// À instrumenter dans les controllers
- [ ] CreateCircle
- [ ] CreateTriangle
- [ ] Rotate
- [ ] Scale
- [ ] Transform
```

**Métriques à ajouter :**
- `tool-activation-time` - Temps d'activation de l'outil
- `geometry-operations-count` - Nombre d'opérations
- `shape-complexity` - Complexité de la forme

---

### Phase 3 : Tangram et outils spécialisés (Priorité MOYENNE)

#### A. Tangram
```javascript
// À instrumenter dans Tangram/
- [ ] loadSilhouette()
- [ ] checkSolution()
- [ ] calculateScore()
- [ ] generateHint()
```

**Métriques à ajouter :**
- `tangram-pieces-count` - Nombre de pièces
- `tangram-attempts` - Nombre de tentatives
- `tangram-solution-time` - Temps pour trouver la solution
- `tangram-accuracy` - Précision de la solution

#### B. Autres outils
```javascript
- [ ] DistanceTool
- [ ] AngleTool
- [ ] AreaTool
- [ ] SymmetryTool
```

---

### Phase 4 : Cache et optimisation (Priorité BASSE)

#### A. Cache service
```javascript
// À instrumenter dans cache.service.ts
- [ ] get()
- [ ] set()
- [ ] cleanup()
- [ ] getStats()
```

**Métriques à ajouter :**
- `cache-hits` - Nombre de hits
- `cache-misses` - Nombre de misses
- `cache-hit-rate` - Taux de réussite
- `cache-size-mb` - Taille du cache

#### B. IndexedDB
```javascript
// À instrumenter dans indexeddb-activities.js
- [ ] saveActivity()
- [ ] getActivity()
- [ ] getAllActivities()
- [ ] deleteActivity()
```

**Métriques à ajouter :**
- `indexeddb-size` - Taille de la base
- `indexeddb-activity-count` - Nombre d'activités
- `indexeddb-operation-time` - Temps d'opération

---

### Phase 5 : Monitoring système (Priorité BASSE)

#### A. Mémoire
```javascript
// Créer MemoryMonitor.js
- [ ] checkMemoryUsage()
- [ ] detectMemoryLeaks()
- [ ] triggerGarbageCollection()
```

**Métriques à ajouter :**
- `memory-used-mb` - Mémoire utilisée
- `memory-total-mb` - Mémoire totale
- `memory-usage-percent` - Pourcentage d'utilisation
- `memory-leak-detected` - Détection de fuite

#### B. Navigation et interaction
```javascript
// Ajouter dans des composants UI
- [ ] pageLoadTime - Temps de chargement
- [ ] firstInteraction - Première interaction
- [ ] toolSwitchTime - Temps de changement d'outil
```

---

## 🎯 Checklist d'implémentation par fichier

### Template pour chaque fichier

```javascript
// 1. Import PerformanceManager
import { performanceManager } from '@utils/PerformanceManager.js';

// 2. Wrapper les opérations critiques
await performanceManager.measure('operation-name', async () => {
  // Code existant
});

// 3. Ajouter des métriques
await performanceManager.recordCustomMetric(
  'metric-name',
  value,
  'category'
);
```

### Priorités

#### 🔴 URGENT (Cette semaine)
1. Instrumenter `readFileFromServer()` - Opération la plus critique
2. Instrumenter `setWorkspaceFromObject()` - Parsing des données
3. Ajouter métriques de synchronisation dans ActivitySyncService

#### 🟠 IMPORTANT (Ce mois)
1. Canvas rendering - `renderAll()` et opérations associées
2. Tools activation - Tous les controllers d'outils
3. Tangram - Système de vérification de solution

#### 🟡 SOUHAITABLE (Plus tard)
1. Cache hit rate monitoring
2. IndexedDB performance tracking
3. Memory leak detection

---

## 📊 Catégories de métriques Firebase

### Convention de nommage

```
{category}-{metric-name}-{unit}

Exemples :
- workspace-objects-count (count)
- canvas-render-time-ms (milliseconds)
- sync-data-size-bytes (bytes)
- memory-usage-percent (percentage)
```

### Catégories principales

| Catégorie | Description | Exemples |
|-----------|-------------|----------|
| `workspace` | Opérations workspace | objects-count, complexity-score |
| `canvas` | Rendu canvas | objects, vertices, layers |
| `sync` | Synchronisation | data-size, conflicts, status |
| `tools` | Outils géométriques | activation-time, operations-count |
| `tangram` | Spécifique Tangram | pieces, attempts, accuracy |
| `cache` | Système de cache | hits, misses, hit-rate |
| `memory` | Utilisation mémoire | used-mb, usage-percent |
| `network` | Requêtes réseau | request-count, response-time |
| `file` | Opérations fichiers | size-bytes, load-time |

---

## 🧪 Tests et validation

### Avant chaque déploiement

```bash
# 1. Tester localement (dev mode)
npm run dev
# Vérifier les console.log dans le navigateur

# 2. Build production
npm run build

# 3. Tester en production locale
npm run preview

# 4. Vérifier Firebase Console
# Attendre 24h pour voir les premières données
```

### Métriques de succès

- ✅ Toutes les opérations > 50ms sont tracées
- ✅ Au moins 10 métriques personnalisées actives
- ✅ Dashboard Firebase configuré
- ✅ Alertes configurées pour les régressions

---

## 🔍 Surveillance et alertes

### Dans Firebase Console

1. **Performance > Custom traces**
   - Surveiller les traces personnalisées
   - Identifier les régressions

2. **Performance > Network requests**
   - Analyser les requêtes Firebase
   - Détecter les appels lents

3. **Performance > Screen rendering**
   - Mesurer le FCP (First Contentful Paint)
   - Optimiser le temps de chargement

### Alertes recommandées

```
Créer des alertes pour :
- Temps de chargement > 3s
- Temps de parsing > 1s
- Taux d'erreur > 5%
- Canvas render > 100ms
```

---

## 📈 Objectifs de performance

### Cibles par opération

| Opération | Cible | Actuel | Priorité |
|-----------|-------|--------|----------|
| Page load | < 2s | ? | 🔴 |
| Open file | < 1s | ? | 🔴 |
| Parse file | < 500ms | ? | 🔴 |
| Canvas render | < 50ms | ? | 🟠 |
| Tool activation | < 100ms | ? | 🟠 |
| Sync to Firebase | < 2s | ? | 🟠 |
| Tangram check | < 200ms | ? | 🟡 |

---

## 🚀 Timeline

### Semaine 1 (19-26 déc 2025)
- ✅ Infrastructure de base
- ✅ Documentation
- ⏳ Instrumenter opérations fichiers
- ⏳ Instrumenter workspace

### Semaine 2 (27 déc - 2 jan)
- ⏳ Instrumenter canvas
- ⏳ Instrumenter synchronisation
- ⏳ Premiers tests production

### Semaine 3 (3-9 jan)
- ⏳ Instrumenter Tangram
- ⏳ Instrumenter outils géométriques
- ⏳ Analyse des premières données

### Semaine 4 (10-16 jan)
- ⏳ Cache et optimisations
- ⏳ Memory monitoring
- ⏳ Dashboard final

---

## 🔗 Références

- [Guide d'intégration](./firebase-performance-integration.md)
- [Exemples d'utilisation](./firebase-performance-examples.md)
- [Firebase Performance Documentation](https://firebase.google.com/docs/perf-mon)
- [AGENTS.md](../AGENTS.md)

---

**Dernière mise à jour** : 19 décembre 2025
**Version** : 1.0.0
**Responsable** : Équipe dev AG-Tablette
