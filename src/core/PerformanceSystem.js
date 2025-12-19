/**
 * Middleware de performance pour les événements natifs
 * ⚠️ MODE DÉVELOPPEMENT UNIQUEMENT ⚠️
 * Pour les métriques production, utilisez PerformanceManager avec Firebase Performance
 *
 * Ce système surveille et analyse les performances en développement.
 * En production, toutes les métriques sont envoyées à Firebase Performance.
 */

/**
 * Classe de monitoring des performances (Développement uniquement)
 */
class PerformanceMonitor {
  constructor() {
    // Désactiver automatiquement en production
    if (!import.meta.env.DEV) {
      console.warn('⚠️ PerformanceMonitor ne doit être utilisé qu\'en développement');
      this.enabled = false;
      return;
    }

    this.metrics = new Map();
    this.thresholds = {
      eventProcessing: 10, // ms
      stateChange: 15, // ms
      toolCreation: 50, // ms
      validation: 5, // ms
    };
    this.enabled = false;
    this.reportInterval = 30000; // 30 secondes
    this.reportTimer = null;
  }

  /**
   * Activer le monitoring (Développement uniquement)
   */
  enable() {
    // Bloquer en production
    if (!import.meta.env.DEV) {
      console.warn('PerformanceMonitor est désactivé en production. Utilisez Firebase Performance.');
      return;
    }

    if (this.enabled) return;

    this.enabled = true;
    this.setupEventListeners();
    this.startReporting();

    console.log('🔍 Performance monitoring activé (mode développement)');
  }

  /**
   * Désactiver le monitoring
   */
  disable() {
    if (!this.enabled) return;

    this.enabled = false;
    this.stopReporting();

    if (import.meta.env.DEV) console.log('Performance monitoring désactivé');
  }

  /**
   * Configurer les écouteurs d'événements pour le monitoring
   */
  setupEventListeners() {
    // Surveiller les événements personnalisés
    const originalDispatchEvent = window.dispatchEvent;
    const self = this;

    window.dispatchEvent = function (event) {
      if (self.enabled && event instanceof CustomEvent) {
        const startTime = performance.now();
        const result = originalDispatchEvent.call(this, event);
        const duration = performance.now() - startTime;

        self.recordMetric('events', event.type, startTime, duration);

        if (duration > self.thresholds.eventProcessing) {
          console.warn(
            `Événement lent détecté: ${event.type} (${duration.toFixed(2)}ms)`,
          );
        }

        return result;
      }
      return originalDispatchEvent.call(this, event);
    };

    // Surveiller les signaux via les événements d'état
    const stateEvents = [
      'app:loading-changed',
      'app:error-changed',
      'environment:changed',
      'tool:activated',
      'workspace:updated',
      'settings:updated',
    ];

    stateEvents.forEach((eventType) => {
      window.addEventListener(eventType, (event) => {
        if (!this.enabled) return;

        const startTime = performance.now();
        setTimeout(() => {
          const duration = performance.now() - startTime;
          this.recordMetric('signals', eventType, startTime, duration);

          if (duration > this.thresholds.stateChange) {
            console.warn(
              `Signal lent détecté: ${eventType} (${duration.toFixed(2)}ms)`,
            );
          }
        }, 0);
      });
    });
  }

  /**
   * Enregistrer une métrique
   * @param {string} category - Catégorie (eventBus, stateManager, etc.)
   * @param {string} operation - Nom de l'opération
   * @param {number} startTime - Temps de début
   * @param {number} duration - Durée en ms (optionnel)
   */
  recordMetric(category, operation, startTime, duration = null) {
    const key = `${category}.${operation}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        averageTime: 0,
        lastTime: 0,
      });
    }

    const metric = this.metrics.get(key);

    if (duration !== null) {
      metric.count++;
      metric.totalTime += duration;
      metric.minTime = Math.min(metric.minTime, duration);
      metric.maxTime = Math.max(metric.maxTime, duration);
      metric.averageTime = metric.totalTime / metric.count;
      metric.lastTime = startTime;
    }
  }

  /**
   * Obtenir les métriques
   * @param {string} category - Catégorie à filtrer (optionnel)
   * @returns {object}
   */
  getMetrics(category = null) {
    const result = {};

    for (const [key, metric] of this.metrics) {
      if (!category || key.startsWith(category)) {
        result[key] = { ...metric };
      }
    }

    return result;
  }

  /**
   * Réinitialiser les métriques
   */
  resetMetrics() {
    this.metrics.clear();
    if (import.meta.env.DEV)
      console.log('Métriques de performance réinitialisées');
  }

  /**
   * Obtenir un rapport de performance
   * @returns {object}
   */
  getReport() {
    const metrics = this.getMetrics();
    const now = Date.now();

    // Analyser les métriques
    const slowOperations = [];
    const frequentOperations = [];

    for (const [key, metric] of Object.entries(metrics)) {
      if (metric.averageTime > 10) {
        slowOperations.push({
          operation: key,
          averageTime: metric.averageTime,
          count: metric.count,
        });
      }

      if (metric.count > 100) {
        frequentOperations.push({
          operation: key,
          count: metric.count,
          averageTime: metric.averageTime,
        });
      }
    }

    return {
      timestamp: now,
      totalOperations: Object.values(metrics).reduce(
        (sum, m) => sum + m.count,
        0,
      ),
      slowOperations: slowOperations.sort(
        (a, b) => b.averageTime - a.averageTime,
      ),
      frequentOperations: frequentOperations.sort((a, b) => b.count - a.count),
      memoryUsage: this.getMemoryUsage(),
      recommendations: this.generateRecommendations(
        slowOperations,
        frequentOperations,
      ),
    };
  }

  /**
   * Obtenir l'utilisation mémoire
   * @returns {object}
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  }

  /**
   * Générer des recommandations d'optimisation
   * @param {array} slowOperations - Opérations lentes
   * @param {array} frequentOperations - Opérations fréquentes
   * @returns {array}
   */
  generateRecommendations(slowOperations, frequentOperations) {
    const recommendations = [];

    if (slowOperations.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `${slowOperations.length} opération(s) lente(s) détectée(s)`,
        details: slowOperations
          .slice(0, 3)
          .map(
            (op) =>
              `${op.operation}: ${op.averageTime.toFixed(2)}ms en moyenne`,
          ),
      });
    }

    if (frequentOperations.length > 0) {
      const highFreqSlow = frequentOperations.filter(
        (op) => op.averageTime > 5,
      );
      if (highFreqSlow.length > 0) {
        recommendations.push({
          type: 'optimization',
          priority: 'medium',
          message: 'Opérations fréquentes qui pourraient être optimisées',
          details: highFreqSlow
            .slice(0, 3)
            .map(
              (op) =>
                `${op.operation}: ${op.count} fois, ${op.averageTime.toFixed(2)}ms/op`,
            ),
        });
      }
    }

    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage && memoryUsage.used > memoryUsage.limit * 0.8) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Utilisation mémoire élevée',
        details: [`${memoryUsage.used}MB utilisés sur ${memoryUsage.limit}MB`],
      });
    }

    return recommendations;
  }

  /**
   * Démarrer les rapports automatiques
   */
  startReporting() {
    if (this.reportTimer) return;

    this.reportTimer = setInterval(() => {
      const report = this.getReport();

      // Afficher seulement si il y a des problèmes
      if (
        report.slowOperations.length > 0 ||
        report.recommendations.some((r) => r.priority === 'high')
      ) {
        console.group('📊 Rapport de performance AG-Tablette');
        if (import.meta.env.DEV)
          console.log('Opérations totales:', report.totalOperations);

        if (report.slowOperations.length > 0) {
          console.warn('Opérations lentes:', report.slowOperations);
        }

        if (report.recommendations.length > 0) {
          if (import.meta.env.DEV)
            console.log('Recommandations:', report.recommendations);
        }

        if (report.memoryUsage) {
          if (import.meta.env.DEV)
            console.log(
              'Mémoire:',
              `${report.memoryUsage.used}MB/${report.memoryUsage.limit}MB`,
            );
        }

        console.groupEnd();
      }

      // Émettre rapport via événements natifs
      window.dispatchEvent(
        new CustomEvent('performance:report', {
          detail: report,
        }),
      );
    }, this.reportInterval);
  }

  /**
   * Arrêter les rapports automatiques
   */
  stopReporting() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
  }

  /**
   * Configurer les seuils d'alerte
   * @param {object} newThresholds - Nouveaux seuils
   */
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    if (import.meta.env.DEV)
      console.log('Seuils de performance mis à jour:', this.thresholds);
  }
}

/**
 * Middleware de cache intelligent pour optimiser les performances
 */
export class SmartCache {
  constructor(maxSize = 100, ttl = 300000) {
    // 5 minutes par défaut
    this.cache = new Map();
    this.accessTimes = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Obtenir une valeur du cache
   * @param {string} key - Clé
   * @returns {any} Valeur ou undefined
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) return undefined;

    // Vérifier l'expiration
    if (Date.now() - item.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Mettre à jour le temps d'accès
    this.accessTimes.set(key, Date.now());
    item.accessCount++;

    return item.value;
  }

  /**
   * Définir une valeur dans le cache
   * @param {string} key - Clé
   * @param {any} value - Valeur
   */
  set(key, value) {
    // Nettoyer si nécessaire
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      timestamp: now,
      accessCount: 1,
    });
    this.accessTimes.set(key, now);
  }

  /**
   * Supprimer une valeur du cache
   * @param {string} key - Clé
   */
  delete(key) {
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  /**
   * Éviter l'élément le moins utilisé
   */
  evictLeastUsed() {
    let leastUsedKey = null;
    let leastUsedTime = Infinity;

    for (const [key, time] of this.accessTimes) {
      if (time < leastUsedTime) {
        leastUsedTime = time;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.delete(leastUsedKey);
    }
  }

  /**
   * Nettoyer les éléments expirés
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.delete(key));
    return expiredKeys.length;
  }

  /**
   * Obtenir les statistiques du cache
   * @returns {object}
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      oldestItem: this.getOldestItemAge(),
      memoryEstimate: this.estimateMemoryUsage(),
    };
  }

  /**
   * Calculer le taux de succès du cache
   * @returns {number}
   */
  calculateHitRate() {
    const totalAccess = Array.from(this.cache.values()).reduce(
      (sum, item) => sum + item.accessCount,
      0,
    );

    return totalAccess > 0 ? (this.cache.size / totalAccess) * 100 : 0;
  }

  /**
   * Obtenir l'âge du plus ancien élément
   * @returns {number} Âge en ms
   */
  getOldestItemAge() {
    let oldest = 0;
    const now = Date.now();

    for (const item of this.cache.values()) {
      const age = now - item.timestamp;
      oldest = Math.max(oldest, age);
    }

    return oldest;
  }

  /**
   * Estimer l'utilisation mémoire
   * @returns {number} Estimation en bytes
   */
  estimateMemoryUsage() {
    let estimate = 0;

    for (const [key, item] of this.cache) {
      estimate += key.length * 2; // String chars sont 2 bytes
      estimate += JSON.stringify(item.value).length * 2;
      estimate += 64; // Overhead approximatif
    }

    return estimate;
  }
}

// Instances singleton
export const performanceMonitor = new PerformanceMonitor();
export const smartCache = new SmartCache();

// Auto-activation en développement uniquement
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Activer après un court délai pour ne pas impacter le chargement initial
  setTimeout(() => {
    performanceMonitor.enable();
    console.log('📊 Monitoring de performance activé (dev mode)');
    console.log('💡 En production, les métriques sont envoyées à Firebase Performance');
  }, 2000);
}
