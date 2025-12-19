# 📊 Firebase Performance - Exemples d'utilisation

## Guide pratique pour instrumenter votre code

Ce fichier contient des exemples concrets d'instrumentation avec Firebase Performance dans AG-Tablette.

---

## 🎯 Exemple 1 : Mesurer une opération simple

### Avant
```javascript
export async function loadActivity(activityId) {
  const activity = await fetch(`/api/activities/${activityId}`);
  return activity.json();
}
```

### Après
```javascript
import { performanceManager } from '@utils/PerformanceManager.js';

export async function loadActivity(activityId) {
  return await performanceManager.measure('load-activity', async () => {
    const activity = await fetch(`/api/activities/${activityId}`);
    return activity.json();
  });
}
```

**Résultat :**
- 🔧 **Dev** : `console.log("load-activity: 245.67ms")`
- 🚀 **Prod** : Trace Firebase "load-activity" avec durée

---

## 🎯 Exemple 2 : Mesurer avec métriques personnalisées

### Contexte : Synchronisation Firebase
```javascript
import { performanceManager } from '@utils/PerformanceManager.js';

export class ActivitySyncService {
  async saveToFirebase(activityData) {
    // Mesurer l'opération principale
    const result = await performanceManager.measure('sync-to-firebase', async () => {
      const docRef = doc(db, 'activities', activityData.id);
      await setDoc(docRef, activityData);
      return docRef;
    });

    // Enregistrer la taille du fichier synchronisé
    const dataSize = JSON.stringify(activityData).length;
    await performanceManager.recordCustomMetric(
      'sync-data-size',
      dataSize,
      'sync'
    );

    // Enregistrer le nombre d'objets
    await performanceManager.recordCustomMetric(
      'sync-objects-count',
      activityData.objects?.length || 0,
      'sync'
    );

    return result;
  }
}
```

**Métriques Firebase :**
- ⏱️ Trace : `sync-to-firebase` (durée)
- 📊 Métrique : `sync-data-size` (bytes)
- 📊 Métrique : `sync-objects-count` (nombre)

---

## 🎯 Exemple 3 : Instrumenter un Controller

### Contexte : Outil Tangram
```javascript
// controllers/Tangram/SolutionChecker.js
import { performanceManager } from '@utils/PerformanceManager.js';

export class SolutionChecker extends Tool {

  async checkSolution() {
    const startTime = performance.now();

    // Mesurer l'algorithme de vérification
    const isCorrect = await performanceManager.measure(
      'tangram-check-solution',
      async () => {
        // 1. Récupérer les pièces
        const pieces = this.workspace.getTangramPieces();

        // 2. Récupérer la silhouette cible
        const target = this.workspace.getTargetSilhouette();

        // 3. Comparer
        return this.compareShapes(pieces, target);
      }
    );

    // Métriques additionnelles
    const pieces = this.workspace.getTangramPieces();
    await performanceManager.recordCustomMetric(
      'tangram-pieces-used',
      pieces.length,
      'tangram'
    );

    const complexity = this.calculateComplexity(pieces);
    await performanceManager.recordCustomMetric(
      'solution-complexity',
      complexity,
      'tangram'
    );

    // Log en développement
    if (import.meta.env.DEV) {
      const duration = performance.now() - startTime;
      console.log(`✅ Solution vérifiée en ${duration.toFixed(2)}ms - Correct: ${isCorrect}`);
    }

    return isCorrect;
  }

  calculateComplexity(pieces) {
    // Logique de calcul de complexité
    return pieces.reduce((sum, piece) => sum + piece.vertices.length, 0);
  }
}
```

---

## 🎯 Exemple 4 : Tracer une opération de rendu Canvas

### Contexte : Canvas Layer
```javascript
// components/canvas-layer.js
import { performanceManager } from '@utils/PerformanceManager.js';

export class CanvasLayer extends LitElement {

  async renderComplexScene() {
    // Mesurer le rendu complet
    await performanceManager.measure('canvas-render-complex', async () => {
      // Préparation
      this.canvas.clear();

      // Rendu des objets
      const objects = this.workspace.getAllObjects();
      for (const obj of objects) {
        this.canvas.add(obj);
      }

      // Rendu final
      this.canvas.renderAll();
    });

    // Métriques du canvas
    const objectCount = this.canvas.getObjects().length;
    await performanceManager.recordCustomMetric(
      'canvas-objects',
      objectCount,
      'canvas'
    );

    // Estimation de la complexité
    const totalVertices = this.canvas.getObjects()
      .reduce((sum, obj) => sum + (obj.points?.length || 4), 0);

    await performanceManager.recordCustomMetric(
      'canvas-vertices',
      totalVertices,
      'canvas'
    );
  }

  // Optimisation : throttler le rendu
  requestRender() {
    performanceManager.throttle('canvas-render', () => {
      this.canvas.renderAll();
    }, 16); // 60 FPS max
  }
}
```

---

## 🎯 Exemple 5 : Cache avec métriques

### Contexte : Cache Service
```javascript
// services/cache.service.js
import { performanceManager } from '@utils/PerformanceManager.js';

export class CacheService {
  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  async get(key, fetchFn) {
    // Vérifier le cache
    if (this.cache.has(key)) {
      this.hits++;

      // Métrique : cache hit
      await performanceManager.recordCustomMetric(
        'cache-hits',
        this.hits,
        'cache'
      );

      return this.cache.get(key);
    }

    // Cache miss - charger les données
    this.misses++;

    const data = await performanceManager.measure(
      'cache-fetch-miss',
      async () => await fetchFn()
    );

    // Enregistrer dans le cache
    this.cache.set(key, data);

    // Métriques
    await performanceManager.recordCustomMetric(
      'cache-misses',
      this.misses,
      'cache'
    );

    const hitRate = (this.hits / (this.hits + this.misses)) * 100;
    await performanceManager.recordCustomMetric(
      'cache-hit-rate',
      Math.round(hitRate),
      'cache'
    );

    return data;
  }
}
```

---

## 🎯 Exemple 6 : Débounce et Throttle avec métriques

### Contexte : Sauvegarde automatique
```javascript
// services/auto-save.service.js
import { performanceManager } from '@utils/PerformanceManager.js';

export class AutoSaveService {
  constructor(workspace) {
    this.workspace = workspace;
    this.saveCount = 0;
  }

  // Débounce : attendre que l'utilisateur arrête de modifier
  onWorkspaceChanged() {
    performanceManager.debounce('auto-save', async () => {
      await this.saveWorkspace();
    }, 2000); // 2 secondes après dernière modification
  }

  // Throttle : limiter la fréquence de vérification
  onMouseMove() {
    performanceManager.throttle('object-position-check', () => {
      this.checkObjectPositions();
    }, 100); // Max 10x par seconde
  }

  async saveWorkspace() {
    this.saveCount++;

    await performanceManager.measure('auto-save-workspace', async () => {
      const data = this.workspace.serialize();
      await this.saveToStorage(data);
    });

    // Métrique de fréquence de sauvegarde
    await performanceManager.recordCustomMetric(
      'auto-save-count',
      this.saveCount,
      'workspace'
    );
  }
}
```

---

## 🎯 Exemple 7 : Trace manuelle avec attributs

### Contexte : Opération complexe nécessitant des détails
```javascript
import { traceOperation, recordMetric } from '../firebase/firebase-init.js';

export async function processComplexGeometry(shapes, options) {
  return await traceOperation('process-complex-geometry', async () => {

    // Étape 1 : Validation
    const validShapes = shapes.filter(s => s.isValid());
    await recordMetric('process-complex-geometry', 'valid-shapes', validShapes.length);

    // Étape 2 : Transformation
    const transformed = validShapes.map(s => s.transform(options));
    await recordMetric('process-complex-geometry', 'transformed-shapes', transformed.length);

    // Étape 3 : Optimisation
    const optimized = optimizeShapes(transformed);
    await recordMetric('process-complex-geometry', 'optimized-shapes', optimized.length);

    return optimized;
  });
}
```

---

## 🎯 Exemple 8 : Monitoring de mémoire

### Contexte : Détecter les fuites mémoire
```javascript
import { performanceManager } from '@utils/PerformanceManager.js';

export class MemoryMonitor {

  async checkMemoryUsage() {
    if (!performance.memory) {
      console.warn('Performance.memory non disponible');
      return;
    }

    const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
    const limit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);

    // Enregistrer les métriques
    await performanceManager.recordCustomMetric('memory-used-mb', used, 'memory');
    await performanceManager.recordCustomMetric('memory-total-mb', total, 'memory');

    const usagePercent = Math.round((used / limit) * 100);
    await performanceManager.recordCustomMetric('memory-usage-percent', usagePercent, 'memory');

    // Alerte si utilisation > 80%
    if (usagePercent > 80) {
      console.warn(`⚠️ Utilisation mémoire élevée: ${usagePercent}%`);

      // Trigger garbage collection si disponible
      if (window.gc) {
        window.gc();
      }
    }

    return { used, total, limit, usagePercent };
  }

  // Appeler périodiquement
  startMonitoring(intervalMs = 30000) {
    setInterval(() => this.checkMemoryUsage(), intervalMs);
  }
}
```

---

## 🎯 Exemple 9 : Batch operations avec métriques

### Contexte : Import multiple de fichiers
```javascript
import { performanceManager } from '@utils/PerformanceManager.js';

export class BatchImporter {

  async importMultipleFiles(files) {
    const startTime = performance.now();
    const results = [];

    // Mesurer l'opération complète
    await performanceManager.measure('batch-import-files', async () => {

      // Traiter par lots de 10
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        // Mesurer chaque lot
        const batchResults = await performanceManager.measure(
          `batch-import-${i / batchSize}`,
          async () => {
            return await Promise.all(
              batch.map(file => this.importFile(file))
            );
          }
        );

        results.push(...batchResults);
      }
    });

    const duration = performance.now() - startTime;

    // Métriques finales
    await performanceManager.recordCustomMetric(
      'batch-import-file-count',
      files.length,
      'import'
    );

    await performanceManager.recordCustomMetric(
      'batch-import-duration-ms',
      Math.round(duration),
      'import'
    );

    const avgTimePerFile = duration / files.length;
    await performanceManager.recordCustomMetric(
      'batch-import-avg-per-file-ms',
      Math.round(avgTimePerFile),
      'import'
    );

    return results;
  }
}
```

---

## 📊 Catégories de métriques recommandées

### Canvas
- `canvas-objects-count` - Nombre d'objets
- `canvas-vertices-count` - Nombre de sommets
- `canvas-render-duration-ms` - Durée du rendu

### Sync
- `sync-data-size-bytes` - Taille des données
- `sync-objects-count` - Nombre d'objets synchronisés
- `sync-duration-ms` - Durée de la synchronisation

### Workspace
- `workspace-complexity` - Complexité (score personnalisé)
- `workspace-objects-count` - Nombre d'objets
- `auto-save-frequency` - Fréquence de sauvegarde

### Tools
- `tool-activation-duration-ms` - Temps d'activation
- `tool-operation-count` - Nombre d'opérations
- `tangram-solution-checks` - Vérifications de solution

### Cache
- `cache-hits` - Nombre de hits
- `cache-misses` - Nombre de misses
- `cache-hit-rate-percent` - Taux de réussite

### Memory
- `memory-used-mb` - Mémoire utilisée
- `memory-usage-percent` - Pourcentage d'utilisation

---

## 🚦 Checklist d'instrumentation

Avant de déployer :

- [ ] Opérations critiques mesurées (> 50ms)
- [ ] Métriques personnalisées ajoutées
- [ ] Catégories bien nommées
- [ ] Noms de traces descriptifs
- [ ] Pas de mesures dans les micro-opérations
- [ ] Tests locaux effectués
- [ ] Documentation mise à jour

---

## 🔗 Ressources

- [Documentation principale](./firebase-performance-integration.md)
- [AGENTS.md](../AGENTS.md) - Conventions du projet
- [Firebase Console](https://console.firebase.google.com)

---

**Dernière mise à jour** : 19 décembre 2025
