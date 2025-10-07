// Initialisation du système de cache hors ligne
import '../services/activity-sync.js';

export function initOfflineSupport() {
  console.log('Système de support hors ligne initialisé');

  // Afficher une notification à l'utilisateur sur les capacités hors ligne
  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator && navigator.onLine) {
      // Attendre un peu pour ne pas surcharger le démarrage
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('show-notif', {
          detail: {
            message: 'Mode hors ligne activé : les activités téléchargées sont disponibles sans connexion',
            type: 'info'
          }
        }));
      }, 3000);
    }
  });

  // Gérer les transitions online/offline
  window.addEventListener('online', () => {
    window.dispatchEvent(new CustomEvent('show-notif', {
      detail: {
        message: 'Connexion rétablie - Synchronisation en cours...',
        type: 'success'
      }
    }));
  });

  window.addEventListener('offline', () => {
    window.dispatchEvent(new CustomEvent('show-notif', {
      detail: {
        message: 'Mode hors ligne activé - Les activités déjà téléchargées restent disponibles',
        type: 'warning'
      }
    }));
  });
}

// Auto-initialisation
initOfflineSupport();