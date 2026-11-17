/**
 * Configuration du cache pour les activités
 * Centralise les paramètres de gestion du cache IndexedDB
 */

// Configuration principale du cache
export const CACHE_CONFIG = {
  // Limites par type de contenu
  MAX_ACTIVITIES: 300, // Augmenté de 100 à 300
  MAX_THEMES: 50, // Pas de limite actuellement
  MAX_MODULES: 200, // Pas de limite actuellement

  // Stratégies d'éviction
  EVICTION_STRATEGY: 'LRU', // LRU (Least Recently Used) ou FIFO
  EVICTION_BATCH_SIZE: 20, // Supprimer 20 activités d'un coup pour éviter les suppressions fréquentes

  // Seuils d'alerte
  WARNING_THRESHOLD: 0.8, // Alerter à 80% de la capacité
  CLEANUP_THRESHOLD: 0.9, // Nettoyer à 90% de la capacité

  // Métriques de performance
  ENABLE_METRICS: true, // Collecter des métriques d'utilisation
  COMPRESSION_ENABLED: true, // Utiliser la compression LZ-String

  // Estimation de taille
  AVERAGE_ACTIVITY_SIZE_KB: 50, // Taille moyenne estimée d'une activité en KB
  ESTIMATED_TOTAL_SIZE_MB: function () {
    return (this.MAX_ACTIVITIES * this.AVERAGE_ACTIVITY_SIZE_KB) / 1024;
  },
};

// Validation de la configuration
export function validateCacheConfig() {
  const estimatedSize = CACHE_CONFIG.ESTIMATED_TOTAL_SIZE_MB();

  if (estimatedSize > 50) {
    // 50MB semble raisonnable pour une app web
    console.warn(
      `[CACHE CONFIG] Taille estimée du cache (${estimatedSize}MB) élevée. Considérez réduire MAX_ACTIVITIES.`,
    );
  }

  if (CACHE_CONFIG.MAX_ACTIVITIES < 142) {
    console.warn(
      `[CACHE CONFIG] MAX_ACTIVITIES (${CACHE_CONFIG.MAX_ACTIVITIES}) inférieur au nombre total sur serveur (142). Synchronisation partielle attendue.`,
    );
  }
}

// Strategies d'éviction
export const EVICTION_STRATEGIES = {
  /**
   * Least Recently Used - Supprime les activités les moins récemment utilisées
   */
  LRU: {
    name: 'LRU',
    description: 'Supprime les activités les moins récemment utilisées',

    async selectItemsToEvict(store, count) {
      // Récupérer toutes les activités avec leur timestamp d'accès
      const allItems = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Trier par dernier accès (les plus anciens en premier)
      allItems.sort((a, b) => (a.lastAccess || 0) - (b.lastAccess || 0));

      // Retourner les IDs des éléments à supprimer
      return allItems.slice(0, count).map((item) => item.id);
    },
  },

  /**
   * First In, First Out - Supprime les activités les plus anciennes
   */
  FIFO: {
    name: 'FIFO',
    description: 'Supprime les activités les plus anciennes',

    async selectItemsToEvict(store, count) {
      const allItems = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Trier par timestamp de création
      allItems.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      return allItems.slice(0, count).map((item) => item.id);
    },
  },

  /**
   * Least Frequently Used - Supprime les activités les moins utilisées
   */
  LFU: {
    name: 'LFU',
    description: 'Supprime les activités les moins utilisées',

    async selectItemsToEvict(store, count) {
      const allItems = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Trier par nombre d'accès (les moins utilisés en premier)
      allItems.sort((a, b) => (a.accessCount || 0) - (b.accessCount || 0));

      return allItems.slice(0, count).map((item) => item.id);
    },
  },
};

// Export de la stratégie active
export function getEvictionStrategy() {
  return (
    EVICTION_STRATEGIES[CACHE_CONFIG.EVICTION_STRATEGY] ||
    EVICTION_STRATEGIES.LRU
  );
}
