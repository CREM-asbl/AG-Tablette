// Utilitaire IndexedDB pour la gestion des fichiers d'activités
// Utilise l'API native IndexedDB


const DB_NAME = 'agTabletteDB';
const DB_VERSION = 3; // Incrémenté pour ajouter le store sync_metadata
const STORE_NAMES = {
  activities: 'activities',
  themes: 'themes',
  modules: 'modules',
  sync_metadata: 'sync_metadata'
};

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      Object.values(STORE_NAMES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

export async function saveActivity(id, data, version = 1) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.activities, 'readwrite');
  const compressedData = compressToUTF16(JSON.stringify(data));
  // Gestion de la taille du cache : max 100 activités
  const store = tx.objectStore(STORE_NAMES.activities);
  const countRequest = store.count();
  countRequest.onsuccess = () => {
    if (countRequest.result >= 100) {
      // Supprimer la plus ancienne activité
      store.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.key);
        }
      };
    }
    store.put({ id, data: compressedData, version });
  };
  return tx.complete;
}

export async function saveTheme(id, data) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.themes, 'readwrite');
  tx.objectStore(STORE_NAMES.themes).put({ id, data });
  return tx.complete;
}

export async function saveModule(id, data) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.modules, 'readwrite');
  tx.objectStore(STORE_NAMES.modules).put({ id, data });
  return tx.complete;
}

export async function getActivity(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAMES.activities).objectStore(STORE_NAMES.activities).get(id);
    request.onsuccess = () => {
      const result = request.result;
      if (result && result.data) {
        try {
          result.data = JSON.parse(decompressFromUTF16(result.data));
        } catch (e) {
          // Si la donnée n'est pas compressée (legacy), on la garde telle quelle
        }
      }
      resolve(result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getTheme(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAMES.themes).objectStore(STORE_NAMES.themes).get(id);
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getModule(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAMES.modules).objectStore(STORE_NAMES.modules).get(id);
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllActivities() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE_NAMES.activities).objectStore(STORE_NAMES.activities);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllThemes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE_NAMES.themes).objectStore(STORE_NAMES.themes);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllModules() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE_NAMES.modules).objectStore(STORE_NAMES.modules);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== GESTION DES MÉTADONNÉES DE SYNCHRONISATION =====

/**
 * Configuration du cache de synchronisation
 */
const SYNC_CONFIG = {
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
  METADATA_KEY: 'sync_metadata'
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
  const tx = db.transaction(STORE_NAMES.sync_metadata, 'readwrite');
  const store = tx.objectStore(STORE_NAMES.sync_metadata);

  const dataToSave = {
    id: SYNC_CONFIG.METADATA_KEY,
    lastSyncDate: metadata.lastSyncDate || Date.now(),
    serverFiles: metadata.serverFiles || [],
    serverThemes: metadata.serverThemes || [],
    expiryDate: metadata.expiryDate || (Date.now() + SYNC_CONFIG.CACHE_TTL),
    ...metadata
  };

  return new Promise((resolve, reject) => {
    const request = store.put(dataToSave);
    request.onsuccess = () => resolve(dataToSave);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Récupère les métadonnées de synchronisation
 * @returns {Promise<Object|null>} Les métadonnées ou null si pas trouvées/expirées
 */
export async function getSyncMetadata() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAMES.sync_metadata).objectStore(STORE_NAMES.sync_metadata).get(SYNC_CONFIG.METADATA_KEY);
    request.onsuccess = () => {
      const result = request.result;

      // Vérifier si les métadonnées existent et ne sont pas expirées
      if (result && result.expiryDate && result.expiryDate > Date.now()) {
        resolve(result);
      } else {
        // Cache expiré ou inexistant
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
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
    console.warn('[SYNC-CACHE] Erreur lors de la vérification de sync récente:', error);
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
        deleteRequest.onsuccess = () => resolve(true);
        deleteRequest.onerror = () => reject(deleteRequest.error);
      } else {
        resolve(false);
      }
    };
    request.onerror = () => reject(request.error);
  });
}
