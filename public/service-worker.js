/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
// Service Worker pour la mise en cache des fichiers d'activités
const CACHE_NAME = 'ag-tablette-cache-v2';
const ACTIVITY_EXTENSIONS = ['.agg', '.agl'];
const CACHE_MAX_ENTRIES = 200;

self.addEventListener('install', _event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
      await clients.claim();
    })()
  );
});

async function enforceCacheLimit(cache) {
  const keys = await cache.keys();
  if (keys.length <= CACHE_MAX_ENTRIES) return;

  const toDelete = keys.slice(0, keys.length - CACHE_MAX_ENTRIES);
  await Promise.all(toDelete.map((request) => cache.delete(request)));
}

async function fetchAndCache(request, cache) {
  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
    await enforceCacheLimit(cache);
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = request.url;

  if (request.method !== 'GET') return;
  if (!ACTIVITY_EXTENSIONS.some(ext => url.endsWith(ext))) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      if (cached) {
        event.waitUntil(fetchAndCache(request, cache));
        return cached;
      }

      try {
        return await fetchAndCache(request, cache);
      } catch (_error) {
        return new Response('Fichier non disponible hors ligne', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});

// Préparation pour Background Sync API
self.addEventListener('sync', event => {
  if (event.tag === 'sync-activities') {
    event.waitUntil(
      // Appeler une fonction de synchronisation ici (ex: fetch et mise à jour du cache)
      fetch('/api/sync-activities').catch(() => { })
    );
  }
});
// Pour déclencher : navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-activities'));