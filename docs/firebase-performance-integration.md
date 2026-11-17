# 🚀 Firebase Performance - Guide d'intégration

## Vue d'ensemble

AG-Tablette intègre maintenant Firebase Performance pour monitorer les performances en production. Le système est conçu pour :

✅ **Développement** : Logs console détaillés via `PerformanceSystem.js`
✅ **Production** : Métriques automatiques vers Firebase Performance via `PerformanceManager.js`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AG-Tablette Performance                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Mode DÉVELOPPEMENT              Mode PRODUCTION             │
│  ───────────────────             ─────────────              │
│                                                               │
│  PerformanceSystem.js            PerformanceManager.js       │
│  • Console logs                  • Firebase Performance      │
│  • Métriques détaillées          • Traces automatiques       │
│  • Alertes temps-réel            • Métriques agrégées        │
│  • Recommandations               • Analytics production      │
│                                                               │
│  PerformanceManager.js                                       │
│  • Throttle/Debounce                                         │
│  • Cache local                                               │
│  • Optimisations                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Utilisation

### 1. Mesurer une opération

```javascript
import { performanceManager } from '../utils/PerformanceManager.js';

// Mesure automatique avec envoi Firebase en production
await performanceManager.measure('load-activity', async () => {
  const activity = await loadActivity(activityId);
  return activity;
});
```

**Comportement :**
- **Dev** : `console.log("load-activity: 45.23ms")`
- **Prod** : Trace Firebase "load-activity" avec durée enregistrée

### 2. Enregistrer une métrique personnalisée

```javascript
import { performanceManager } from '../utils/PerformanceManager.js';

// Nombre d'objets sur le canvas
await performanceManager.recordCustomMetric(
  'canvas-objects-count',
  workspace.objects.length,
  'canvas'
);

// Taille du fichier synchronisé
await performanceManager.recordCustomMetric(
  'sync-file-size',
  fileSize,
  'sync'
);
```

### 3. Tracer une opération complexe manuellement

```javascript
import { traceOperation } from '../firebase/firebase-init.js';

// Trace Firebase avec gestion d'erreur
const result = await traceOperation('tangram-solution-check', async () => {
  const isCorrect = await checkTangramSolution();
  return isCorrect;
});
```

## 🎯 Opérations à instrumenter (prioritaires)

### Catégorie : Chargement fichiers
```javascript
// Dans OpenFileManager.js
await performanceManager.measure('open-file-from-server', async () => {
  await openFileFromServer(activityName);
});

await performanceManager.measure('read-file-from-server', async () => {
  await readFileFromServer(filename);
});
```

### Catégorie : Rendu Canvas
```javascript
// Dans canvas-layer.js
await performanceManager.measure('canvas-render-all', async () => {
  this.canvas.renderAll();
});

// Métrique personnalisée
await performanceManager.recordCustomMetric(
  'canvas-objects',
  this.canvas.getObjects().length,
  'canvas'
);
```

### Catégorie : Synchronisation
```javascript
// Dans ActivitySyncService.js
await performanceManager.measure('sync-to-firebase', async () => {
  await this.saveToFirebase(activityData);
});
```

### Catégorie : Opérations géométriques
```javascript
// Dans les controllers
await performanceManager.measure('tangram-check-solution', async () => {
  return await this.checkSolution();
});

await performanceManager.measure('create-complex-shape', async () => {
  return this.createShape(complexity);
});
```

## 📈 Visualisation dans Firebase Console

1. **Accéder à Firebase Console** : https://console.firebase.google.com
2. **Sélectionner le projet AG-Tablette**
3. **Menu : Performance**

### Métriques disponibles

#### Traces automatiques (par défaut)
- Page Load Time
- First Contentful Paint
- DOM Interactive
- Network requests (fetch automatique)

#### Traces personnalisées (nos implémentations)
- `open-file-from-server`
- `read-file-from-server`
- `canvas-render-all`
- `sync-to-firebase`
- `tangram-check-solution`
- etc.

#### Métriques personnalisées
- `canvas-objects-count`
- `sync-file-size`
- `workspace-complexity`

## 🔧 Configuration

### firebase-init.js
```javascript
// Firebase Performance est initialisé automatiquement
import { perf } from './firebase/firebase-init.js';

// Disponible uniquement en production (hostname !== 'localhost')
```

### Seuils d'alerte (PerformanceSystem - dev uniquement)
```javascript
import { performanceMonitor } from './core/PerformanceSystem.js';

// Configurer les seuils en développement
performanceMonitor.setThresholds({
  eventProcessing: 10,  // ms
  stateChange: 15,      // ms
  toolCreation: 50,     // ms
  validation: 5         // ms
});
```

## 🚨 Bonnes pratiques

### ✅ À faire

1. **Mesurer les opérations critiques**
   ```javascript
   await performanceManager.measure('critical-operation', asyncFn);
   ```

2. **Nommer les traces de façon descriptive**
   ```javascript
   // ✅ Bon
   'load-tangram-silhouette'

   // ❌ Mauvais
   'op1'
   ```

3. **Catégoriser les métriques**
   ```javascript
   await performanceManager.recordCustomMetric(
     'metric-name',
     value,
     'category' // 'canvas', 'sync', 'tools', 'network'
   );
   ```

4. **Entourer les blocs asynchrones**
   ```javascript
   await performanceManager.measure('operation', async () => {
     await step1();
     await step2();
     return result;
   });
   ```

### ❌ À éviter

1. **Ne pas mesurer les micro-opérations**
   ```javascript
   // ❌ Trop granulaire
   await performanceManager.measure('get-x-coordinate', () => obj.x);
   ```

2. **Ne pas créer trop de traces**
   - Limite Firebase : 500 traces personnalisées par app
   - Focus sur les opérations importantes

3. **Ne pas utiliser PerformanceSystem en production**
   ```javascript
   // ❌ Désactivé automatiquement
   if (!import.meta.env.DEV) {
     performanceMonitor.enable(); // Ne fait rien
   }
   ```

## 🐛 Debugging

### Vérifier que Firebase Performance fonctionne

```javascript
// Dans la console du navigateur (production)
import { perf } from './firebase/firebase-init.js';
console.log(perf); // Devrait afficher l'objet Performance
```

### Logs de développement

```javascript
// Activer les logs détaillés en dev
import { performanceMonitor } from './core/PerformanceSystem.js';

// Obtenir le rapport complet
const report = performanceMonitor.getReport();
console.log(report);

// Métriques par catégorie
const canvasMetrics = performanceMonitor.getMetrics('canvas');
console.log(canvasMetrics);
```

## 📊 Exemple d'implémentation complète

```javascript
// controllers/Tangram/SolutionChecker.js
import { performanceManager } from '../../utils/PerformanceManager.js';

export class SolutionChecker {
  async checkSolution(pieces, targetSilhouette) {
    // Mesurer l'opération principale
    const result = await performanceManager.measure(
      'tangram-check-solution',
      async () => {
        // Étape 1 : Validation
        const validation = await this.validatePieces(pieces);

        // Étape 2 : Comparaison
        const comparison = await this.compareSilhouette(
          pieces,
          targetSilhouette
        );

        // Étape 3 : Calcul score
        const score = this.calculateScore(comparison);

        return { validation, comparison, score };
      }
    );

    // Enregistrer des métriques additionnelles
    await performanceManager.recordCustomMetric(
      'pieces-count',
      pieces.length,
      'tangram'
    );

    await performanceManager.recordCustomMetric(
      'solution-score',
      result.score,
      'tangram'
    );

    return result;
  }
}
```

## 🔗 Ressources

- [Firebase Performance Documentation](https://firebase.google.com/docs/perf-mon)
- [Performance API Web](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [AG-Tablette AGENTS.md](../AGENTS.md)

## 🚀 Prochaines étapes

1. ✅ Intégration Firebase Performance
2. ⏳ Instrumenter les opérations critiques (voir liste ci-dessus)
3. ⏳ Analyser les premières métriques production
4. ⏳ Définir des seuils d'alerte dans Firebase Console
5. ⏳ Créer un dashboard de monitoring

---

**Dernière mise à jour** : 19 décembre 2025
**Version** : 1.0.0
