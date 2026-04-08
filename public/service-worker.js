// Ce fichier est un stub de transition.
// Il désenregistre l'ancien service worker pour laisser place
// au nouveau SW généré par @vite-pwa/astro (sw.js).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Supprimer tous les anciens caches
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      // Prendre le contrôle puis se désenregistrer
      await clients.claim();
      await self.registration.unregister();
    })()
  );
});
