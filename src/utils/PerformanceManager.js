/**
 * Gestionnaire de performance pour optimiser les opérations coûteuses
 * Implémente throttling, debouncing et cache pour améliorer les performances
 */

class PerformanceManager {
  constructor() {
    this.throttleTimers = new Map();
    this.debounceTimers = new Map();
    this.cache = new Map();
    this.cacheMaxSize = 100;
    this.cacheMaxAge = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Throttle une fonction - limite sa fréquence d'exécution
   * @param {string} key - Clé unique pour identifier la fonction
   * @param {Function} fn - Fonction à throttler
   * @param {number} delay - Délai minimum entre les exécutions (ms)
   */
  throttle(key, fn, delay = 16) {
    if (this.throttleTimers.has(key)) {
      return; // Déjà en cours d'exécution
    }

    this.throttleTimers.set(key, setTimeout(() => {
      fn();
      this.throttleTimers.delete(key);
    }, delay));
  }

  /**
   * Debounce une fonction - retarde son exécution jusqu'à ce qu'elle ne soit plus appelée
   * @param {string} key - Clé unique pour identifier la fonction
   * @param {Function} fn - Fonction à debouncer
   * @param {number} delay - Délai d'attente (ms)
   */
  debounce(key, fn, delay = 300) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    this.debounceTimers.set(key, setTimeout(() => {
      fn();
      this.debounceTimers.delete(key);
    }, delay));
  }

  /**
   * Cache le résultat d'une fonction coûteuse
   * @param {string} key - Clé de cache
   * @param {Function} fn - Fonction à exécuter si pas en cache
   * @returns {any} - Résultat de la fonction
   */
  async memoize(key, fn) {
    // Vérifier le cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.value;
    }

    // Exécuter la fonction et mettre en cache
    const result = await fn();
    this.setCache(key, result);
    return result;
  }

  /**
   * Mettre en cache une valeur
   * @param {string} key - Clé de cache
   * @param {any} value - Valeur à cacher
   */
  setCache(key, value) {
    // Nettoyer le cache si trop plein
    if (this.cache.size >= this.cacheMaxSize) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Nettoyer les entrées de cache expirées
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheMaxAge) {
        this.cache.delete(key);
      }
    }

    // Si toujours trop plein, supprimer les plus anciennes
    if (this.cache.size >= this.cacheMaxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, Math.floor(this.cacheMaxSize / 2));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Annuler tous les timers en attente
   */
  cancelAll() {
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();
    this.debounceTimers.clear();
  }

  /**
   * Vider le cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Mesurer les performances d'une fonction
   * @param {string} label - Label pour identifier la mesure
   * @param {Function} fn - Fonction à mesurer
   */
  async measure(label, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  /**
   * Batch multiple opérations pour réduire les reflows/repaints
   * @param {Function[]} operations - Tableau d'opérations à executer
   */
  batch(operations) {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        operations.forEach(op => op());
        resolve();
      });
    });
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      activeThrottles: this.throttleTimers.size,
      activeDebounces: this.debounceTimers.size
    };
  }
}

// Instance singleton
export const performanceManager = new PerformanceManager();

/**
 * Décorateur pour throttler automatiquement les méthodes
 * @param {number} delay - Délai de throttling
 */
export function throttled(delay = 16) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args) {
      const key = `${target.constructor.name}.${propertyKey}`;
      performanceManager.throttle(key, () => {
        originalMethod.apply(this, args);
      }, delay);
    };
    
    return descriptor;
  };
}

/**
 * Décorateur pour debouncer automatiquement les méthodes
 * @param {number} delay - Délai de debouncing
 */
export function debounced(delay = 300) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args) {
      const key = `${target.constructor.name}.${propertyKey}`;
      performanceManager.debounce(key, () => {
        originalMethod.apply(this, args);
      }, delay);
    };
    
    return descriptor;
  };
}

/**
 * Décorateur pour mesurer automatiquement les performances
 */
export function measured(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args) {
    const label = `${target.constructor.name}.${propertyKey}`;
    return await performanceManager.measure(label, () => {
      return originalMethod.apply(this, args);
    });
  };
  
  return descriptor;
}
