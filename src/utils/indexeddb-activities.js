// Utilitaire IndexedDB pour la gestion des fichiers d'activités
// Utilise l'API native IndexedDB

import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import {
  CACHE_CONFIG,
  getEvictionStrategy,
  validateCacheConfig,
} from './cache-config.js';

const DB_NAME = 'agTabletteDB';
const DB_VERSION = 3; // Incrémenté pour ajouter le store sync_metadata
const STORE_NAMES = {
  activities: 'activities',
  themes: 'themes',
  modules: 'modules',
  sync_metadata: 'sync_metadata',
};

// Validation de la configuration au chargement
validateCacheConfig();

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sauvegarde une activité avec gestion intelligente du cache
 * @param {string} id - Identifiant de l'activité
 * @param {Object} data - Données de l'activité
 * @param {number} version - Version de l'activité
 * @returns {Promise} Promesse de sauvegarde
 */
export async function saveActivity(id, data, version = 1) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.activities, 'readwrite');
  const store = tx.objectStore(STORE_NAMES.activities);

  // Préparer les données avec métadonnées
  const now = Date.now();
  console.log('[DEBUG] saveActivity config:', CACHE_CONFIG.COMPRESSION_ENABLED);
  const compressedData = CACHE_CONFIG.COMPRESSION_ENABLED
    ? compressToUTF16(JSON.stringify(data))
    : JSON.stringify(data);
  console.log('[DEBUG] compressedData type:', typeof compressedData);

  const activityRecord = {
    id,
    data: compressedData,
    version,
    timestamp: now,
    lastAccess: now,
    accessCount: 1,
    compressed: CACHE_CONFIG.COMPRESSION_ENABLED,
  };

  // Vérifier si on dépasse la limite
  const count = await new Promise((resolve, reject) => {
    const countRequest = store.count();
    countRequest.onsuccess = () => resolve(countRequest.result);
    countRequest.onerror = () => reject(countRequest.error);
  });

  // Gestion intelligente du cache
  if (count >= CACHE_CONFIG.MAX_ACTIVITIES) {
    await performIntelligentEviction(
      store,
      count - CACHE_CONFIG.MAX_ACTIVITIES + CACHE_CONFIG.EVICTION_BATCH_SIZE,
    );
  }

  // Sauvegarder l'activité
  return new Promise((resolve, reject) => {
    const request = store.put(activityRecord);
    request.onsuccess = () => {
      if (CACHE_CONFIG.ENABLE_METRICS) {
      }
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Effectue une éviction intelligente des activités selon la stratégie configurée
 * @param {IDBObjectStore} store - Store IndexedDB
 * @param {number} itemsToRemove - Nombre d'éléments à supprimer
 */
async function performIntelligentEviction(store, itemsToRemove) {
  try {
    const strategy = getEvictionStrategy();
    const idsToRemove = await strategy.selectItemsToEvict(store, itemsToRemove);

    if (CACHE_CONFIG.ENABLE_METRICS) {
    }

    // Supprimer les activités sélectionnées
    for (const id of idsToRemove) {
      await new Promise((resolve, reject) => {
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    }
  } catch (error) {
    console.error("[CACHE] Erreur lors de l'éviction intelligente:", error);
    // Fallback vers l'ancienne méthode
    await performSimpleEviction(store, itemsToRemove);
  }
}

/**
 * Éviction simple (fallback) - supprime les premiers éléments trouvés
 * @param {IDBObjectStore} store - Store IndexedDB
 * @param {number} itemsToRemove - Nombre d'éléments à supprimer
 */
async function performSimpleEviction(store, itemsToRemove) {
  let removedCount = 0;
  const cursor = store.openCursor();

  return new Promise((resolve, reject) => {
    cursor.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && removedCount < itemsToRemove) {
        cursor.delete();
        removedCount++;
        cursor.continue();
      } else {
        resolve();
      }
    };
    cursor.onerror = () => reject(cursor.error);
  });
}

export async function saveTheme(id, data) {
  const db = await openDB();
  try {
    const tx = db.transaction(STORE_NAMES.themes, 'readwrite');
    tx.objectStore(STORE_NAMES.themes).put({ id, data });
    return await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function saveModule(id, data) {
  const db = await openDB();
  try {
    const tx = db.transaction(STORE_NAMES.modules, 'readwrite');
    tx.objectStore(STORE_NAMES.modules).put({ id, data });
    return await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Récupère une activité et met à jour ses métadonnées d'accès
 * @param {string} id - Identifiant de l'activité
 * @returns {Promise<Object|null>} Données de l'activité ou null
 */
export async function getActivity(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.activities, 'readwrite');
  const store = tx.objectStore(STORE_NAMES.activities);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const result = request.result;
      if (result && result.data) {
        // Clone pour la mise à jour des métadonnées (garder la version compressée)
        const recordForUpdate = { ...result };

        try {
          // Décompression si nécessaire
          const rawData = result.compressed
            ? decompressFromUTF16(result.data)
            : result.data;

          result.data =
            typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

          // Mettre à jour les métadonnées d'accès (async, ne pas attendre)
          if (CACHE_CONFIG.ENABLE_METRICS) {
            updateAccessMetadata(store, id, recordForUpdate);
          }
        } catch (e) {
          console.warn(`[CACHE] Erreur décompression activité ${id}:`, e);
          // Si la donnée n'est pas compressée (legacy), on la garde telle quelle
        }
      }
      db.close();
      resolve(result || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Met à jour les métadonnées d'accès d'une activité
 * @param {IDBObjectStore} store - Store IndexedDB
 * @param {string} id - ID de l'activité
 * @param {Object} currentRecord - Enregistrement actuel
 */
function updateAccessMetadata(store, id, currentRecord) {
  try {
    const updatedRecord = {
      ...currentRecord,
      lastAccess: Date.now(),
      accessCount: (currentRecord.accessCount || 0) + 1,
    };

    store.put(updatedRecord);
  } catch (error) {
    console.warn(`[CACHE] Erreur mise à jour métadonnées ${id}:`, error);
  }
}

export async function getTheme(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAMES.themes)
      .objectStore(STORE_NAMES.themes)
      .get(id);
    request.onsuccess = () => {
      db.close();
      resolve(request.result?.data || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getModule(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAMES.modules)
      .objectStore(STORE_NAMES.modules)
      .get(id);
    request.onsuccess = () => {
      db.close();
      resolve(request.result?.data || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getAllActivities() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db
      .transaction(STORE_NAMES.activities)
      .objectStore(STORE_NAMES.activities);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getAllThemes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db
      .transaction(STORE_NAMES.themes)
      .objectStore(STORE_NAMES.themes);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getAllModules() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db
      .transaction(STORE_NAMES.modules)
      .objectStore(STORE_NAMES.modules);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// ===== GESTION DES MÉTADONNÉES DE SYNCHRONISATION =====

/**
 * Configuration du cache de synchronisation
 */
const SYNC_CONFIG = {
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
  METADATA_KEY: 'sync_metadata',
};

/**
 * Sauvegarde les métadonnées de synchronisation
 * @param {Object} metadata - Les métadonnées à sauvegarder
 * @param {number} metadata.lastSyncDate - Timestamp de la dernière synchronisation
 * @param {Array} metadata.serverFiles - Liste des fichiers serveur avec versions
 * @param {Array} metadata.serverThemes - Liste des thèmes serveur
 * @param {number} metadata.expiryDate - Date d'expiration du cache
 */
export async function saveSyncMetadata(metadata) {
  const db = await openDB();
  try {
    const tx = db.transaction(STORE_NAMES.sync_metadata, 'readwrite');
    const store = tx.objectStore(STORE_NAMES.sync_metadata);

    const dataToSave = {
      id: SYNC_CONFIG.METADATA_KEY,
      lastSyncDate: metadata.lastSyncDate || Date.now(),
      serverFiles: metadata.serverFiles || [],
      serverThemes: metadata.serverThemes || [],
      expiryDate: metadata.expiryDate || Date.now() + SYNC_CONFIG.CACHE_TTL,
      ...metadata,
    };

    return await new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => resolve(dataToSave);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Récupère les métadonnées de synchronisation
 * @returns {Promise<Object|null>} Les métadonnées ou null si pas trouvées/expirées
 */
export async function getSyncMetadata() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAMES.sync_metadata)
      .objectStore(STORE_NAMES.sync_metadata)
      .get(SYNC_CONFIG.METADATA_KEY);
    request.onsuccess = () => {
      const result = request.result;
      db.close();

      // Vérifier si les métadonnées existent et ne sont pas expirées
      if (result && result.expiryDate && result.expiryDate > Date.now()) {
        resolve(result);
      } else {
        // Cache expiré ou inexistant
        resolve(null);
      }
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Vérifie si une synchronisation récente a eu lieu
 * @param {number} maxAgeHours - Âge maximum en heures (défaut: 24h)
 * @returns {Promise<boolean>} True si une sync récente a eu lieu
 */
export async function isRecentSyncAvailable(maxAgeHours = 24) {
  try {
    const metadata = await getSyncMetadata();
    if (!metadata || !metadata.lastSyncDate) {
      return false;
    }

    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convertir en millisecondes
    const timeSinceLastSync = Date.now() - metadata.lastSyncDate;

    return timeSinceLastSync < maxAge;
  } catch (error) {
    console.warn(
      '[SYNC-CACHE] Erreur lors de la vérification de sync récente:',
      error,
    );
    return false;
  }
}

/**
 * Supprime les métadonnées de synchronisation expirées
 */
export async function clearExpiredSyncMetadata() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.sync_metadata, 'readwrite');
  const store = tx.objectStore(STORE_NAMES.sync_metadata);

  return new Promise((resolve, reject) => {
    const request = store.get(SYNC_CONFIG.METADATA_KEY);
    request.onsuccess = () => {
      const result = request.result;
      if (result && result.expiryDate && result.expiryDate <= Date.now()) {
        // Métadonnées expirées, les supprimer
        const deleteRequest = store.delete(SYNC_CONFIG.METADATA_KEY);
        deleteRequest.onsuccess = () => {
          db.close();
          resolve(true);
        };
        deleteRequest.onerror = () => {
          db.close();
          reject(deleteRequest.error);
        };
      } else {
        db.close();
        resolve(false);
      }
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Obtient des statistiques détaillées sur l'utilisation du cache
 * @returns {Promise<Object>} Statistiques complètes
 */
export async function getCacheStatistics() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAMES.activities, 'readonly');
    const store = tx.objectStore(STORE_NAMES.activities);

    // Récupérer toutes les activités
    const allActivities = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();

    // Calculer les statistiques
    const now = Date.now();
    const stats = {
      totalActivities: allActivities.length,
      maxCapacity: CACHE_CONFIG.MAX_ACTIVITIES,
      usagePercentage: Math.round(
        (allActivities.length / CACHE_CONFIG.MAX_ACTIVITIES) * 100,
      ),

      // Analyse temporelle
      activitiesAddedToday: 0,
      activitiesAddedThisWeek: 0,
      activitiesNotAccessedThisWeek: 0,

      // Analyse d'utilisation
      mostUsedActivities: [],
      leastUsedActivities: [],
      oldestActivities: [],
      newestActivities: [],

      // Métriques techniques
      compressionRatio: 0,
      estimatedSizeMB: 0,
      averageAccessCount: 0,

      // Configuration actuelle
      config: {
        maxActivities: CACHE_CONFIG.MAX_ACTIVITIES,
        evictionStrategy: CACHE_CONFIG.EVICTION_STRATEGY,
        compressionEnabled: CACHE_CONFIG.COMPRESSION_ENABLED,
      },
    };

    // Traiter chaque activité
    let totalAccessCount = 0;
    let totalSizeEstimate = 0;

    allActivities.forEach((activity) => {
      const timestamp = activity.timestamp || 0;
      const lastAccess = activity.lastAccess || 0;
      const accessCount = activity.accessCount || 0;

      totalAccessCount += accessCount;

      // Estimer la taille
      const sizeEstimate = activity.data ? activity.data.length : 0;
      totalSizeEstimate += sizeEstimate;

      // Analyse temporelle
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      if (timestamp > dayAgo) stats.activitiesAddedToday++;
      if (timestamp > weekAgo) stats.activitiesAddedThisWeek++;
      if (lastAccess < weekAgo) stats.activitiesNotAccessedThisWeek++;
    });

    // Calculer les moyennes
    stats.averageAccessCount =
      allActivities.length > 0
        ? Math.round(totalAccessCount / allActivities.length)
        : 0;

    stats.estimatedSizeMB =
      Math.round((totalSizeEstimate / (1024 * 1024)) * 100) / 100;

    // Top/Bottom lists
    const sortedByAccess = [...allActivities].sort(
      (a, b) => (b.accessCount || 0) - (a.accessCount || 0),
    );
    const sortedByTimestamp = [...allActivities].sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
    );

    stats.mostUsedActivities = sortedByAccess.slice(0, 5).map((a) => ({
      id: a.id,
      accessCount: a.accessCount || 0,
      lastAccess: new Date(a.lastAccess || 0),
    }));

    stats.leastUsedActivities = sortedByAccess.slice(-5).map((a) => ({
      id: a.id,
      accessCount: a.accessCount || 0,
      lastAccess: new Date(a.lastAccess || 0),
    }));

    stats.newestActivities = sortedByTimestamp.slice(0, 5).map((a) => ({
      id: a.id,
      timestamp: new Date(a.timestamp || 0),
      version: a.version || 1,
    }));

    stats.oldestActivities = sortedByTimestamp.slice(-5).map((a) => ({
      id: a.id,
      timestamp: new Date(a.timestamp || 0),
      version: a.version || 1,
    }));

    return stats;
  } catch (error) {
    console.error('[CACHE] Erreur lors du calcul des statistiques:', error);
    return {
      error: error.message,
      totalActivities: 0,
      maxCapacity: CACHE_CONFIG.MAX_ACTIVITIES,
      usagePercentage: 0,
    };
  }
}
