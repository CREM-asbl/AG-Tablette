import { registerSW } from 'virtual:pwa-register';

/**
 * Enregistrement du Service Worker PWA via @vite-pwa/astro.
 * Stratégie "prompt" : l'utilisateur est invité à recharger quand une
 * nouvelle version est disponible.
 */
const updateSW = registerSW({
  immediate: true,

  onRegisteredSW(swScriptUrl) {
    if (import.meta.env.DEV) {
      console.log('[PWA] Service Worker enregistré :', swScriptUrl);
    }
  },

  onOfflineReady() {
    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: {
          message: 'Application prête pour le mode hors ligne',
          type: 'info',
        },
      }),
    );
  },

  onNeedRefresh() {
    if (confirm('Mise à jour disponible.\nMettre à jour ?')) {
      updateSW(true);
    }
  },
});
