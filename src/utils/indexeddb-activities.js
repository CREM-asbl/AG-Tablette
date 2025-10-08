// Utilitaire IndexedDB pour la gestion des fichiers d'activités
// Utilise l'API native IndexedDB


const DB_NAME = 'agTabletteDB';
const DB_VERSION = 2;
const STORE_NAMES = {
  activities: 'activities',
  themes: 'themes',
  modules: 'modules'
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
