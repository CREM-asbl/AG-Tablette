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
const CACHE_NAME = 'ag-tablette-cache-v1';
const ACTIVITY_EXTENSIONS = ['.agg', '.agl'];

self.addEventListener('install', _event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (ACTIVITY_EXTENSIONS.some(ext => url.endsWith(ext))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(response =>
          response || fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // En cas d'erreur réseau, retourner une réponse d'erreur
            return new Response('Fichier non disponible hors ligne', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          })
        )
      )
    );
  }
});

// Synchronisation en arrière-plan à améliorer plus tard avec Background Sync API