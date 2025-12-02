// Service de synchronisation pour les activités
// Gère la synchronisation en arrière-plan des fichiers d'activités

import {
  findAllFiles,
  findAllThemes,
  getModulesDocFromTheme,
  readFileFromServer,
} from '../firebase/firebase-init.js';
import {
  setSyncCompleted,
  setSyncProgress,
  syncInProgress,
} from '../store/syncState.js';
import {
  getAllActivities,
  getSyncMetadata,
  isRecentSyncAvailable,
  saveActivity,
  saveModule,
  saveSyncMetadata,
  saveTheme,
} from '../utils/indexeddb-activities.js';

// Configuration du service
const CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
  AUTO_SYNC_DELAY: 5000,
  RECONNECT_DELAY: 1000,
  SYNC_COOLDOWN: 24 * 60 * 60 * 1000, // 24 heures entre les synchronisations
  DEBUG:
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.search.includes('debug=true')),
};

/**
 * Utilitaires pour le service de synchronisation
 */
const utils = {
  log: (message, ...args) => {
    if (CONFIG.DEBUG) {
    }
  },

  warn: (message, ...args) => {
    console.warn(`[SYNC] ${message}`, ...args);
  },

  error: (message, ...args) => {
    console.error(`[SYNC] ${message}`, ...args);
  },

  /**
   * Attendre un délai
   * @param {number} ms Délai en millisecondes
   * @returns {Promise<void>}
   */
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Calculer la progression totale incluant fichiers, thèmes et modules
   * @param {number} filesProcessed Nombre de fichiers traités
   * @param {number} totalFiles Nombre total de fichiers
   * @param {number} themesProcessed Nombre de thèmes traités
   * @param {number} totalThemes Nombre total de thèmes
   * @returns {number} Pourcentage global
   */
  calculateProgress: (
    filesProcessed,
    totalFiles,
    themesProcessed,
    totalThemes,
  ) => {
    // Pondération: 70% pour les fichiers, 30% pour les thèmes/modules
    const fileWeight = 0.7;
    const themeWeight = 0.3;

    const fileProgress =
      totalFiles > 0 ? (filesProcessed / totalFiles) * fileWeight * 100 : 0;
    const themeProgress =
      totalThemes > 0 ? (themesProcessed / totalThemes) * themeWeight * 100 : 0;

    return Math.round(fileProgress + themeProgress);
  },
};

export async function syncActivitiesInBackground(forceSync = false) {
  // Utiliser le store centralisé au lieu d'une variable globale
  if (syncInProgress.value) {
    utils.log('Synchronisation déjà en cours...');
    return;
  }

  if (!navigator.onLine) {
    utils.log('Pas de connexion internet, synchronisation annulée');
    return;
  }

  // Vérifier si une synchronisation récente a eu lieu (sauf si forcée)
  if (!forceSync) {
    const recentSyncAvailable = await isRecentSyncAvailable(24); // 24 heures
    if (recentSyncAvailable) {
      utils.log(
        'Synchronisation récente détectée, synchronisation ignorée. Utilisez forceSync=true pour forcer.',
      );
      return;
    }
  }

  let attempt = 0;
  while (attempt < CONFIG.RETRY_ATTEMPTS) {
    try {
      utils.log('Initialisation du signal à 0%');
      setSyncProgress(0);
      utils.log(
        'Début de la synchronisation des activités, thèmes et modules...',
      );

      // Récupérer les données nécessaires
      const [serverFiles, serverThemes] = await Promise.all([
        findAllFiles(),
        findAllThemes(),
      ]);

      const localActivities = await getAllActivities();
      const localMap = new Map(
        localActivities.map((activity) => [activity.id, activity]),
      );

      let addedCount = 0;
      let processedFiles = 0;
      let processedThemes = 0;

      const totalFiles = serverFiles.length;
      const totalThemes = serverThemes.length;

      // Synchronisation des fichiers d'activités avec gestion de timeout
      for (const serverFile of serverFiles) {
        try {
          const localActivity = localMap.get(serverFile.id);
          const serverVersion = serverFile.version || 1;
          const localVersion = localActivity?.version || 0;

          if (!localActivity || serverVersion > localVersion) {
            utils.log(
              `Téléchargement ou mise à jour de l'activité: ${serverFile.id}`,
            );

            // Ajouter timeout pour éviter les blocages
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), CONFIG.TIMEOUT),
            );

            const activityData = await Promise.race([
              readFileFromServer(serverFile.id, { forceDownload: true }),
              timeoutPromise,
            ]);

            await saveActivity(serverFile.id, activityData, serverVersion);
            addedCount++;
          } else {
            utils.log(
              `Activité ${serverFile.id} déjà présente localement (version à jour)`,
            );
          }

          processedFiles++;
          const progressPercent = utils.calculateProgress(
            processedFiles,
            totalFiles,
            processedThemes,
            totalThemes,
          );
          utils.log(
            `Progression: ${progressPercent}% (${processedFiles}/${totalFiles} fichiers, ${processedThemes}/${totalThemes} thèmes)`,
          );

          // Mise à jour du signal de progression
          setSyncProgress(progressPercent);
        } catch (fileError) {
          utils.warn(
            `Erreur lors de la synchronisation de ${serverFile.id}:`,
            fileError,
          );
          processedFiles++; // Compter quand même pour continuer la progression
        }
      }


      /**
       * Nettoie les données pour la sérialisation IndexedDB
       * @param {Object} data Données à nettoyer
       * @returns {Object} Données sérialisables
       */
      const cleanData = (data) => {
        try {
          return JSON.parse(JSON.stringify(data));
        } catch (e) {
          utils.warn('Erreur lors du nettoyage des données:', e);
          return data;
        }
      };

      // Synchronisation des thèmes avec mise à jour de progression
      for (const theme of serverThemes) {
        try {
          await saveTheme(theme.id, cleanData(theme));

          // Synchronisation des modules pour chaque thème
          const modules = await getModulesDocFromTheme(theme.id);
          for (const module of modules) {
            await saveModule(module.id, cleanData(module));
          }

          processedThemes++;
          const progressPercent = utils.calculateProgress(
            processedFiles,
            totalFiles,
            processedThemes,
            totalThemes,
          );
          setSyncProgress(progressPercent);
        } catch (themeError) {
          utils.warn(
            `Erreur lors de la synchronisation du thème ${theme.id}:`,
            themeError,
          );
          processedThemes++; // Compter quand même pour continuer
        }
      }

      utils.log(
        `Synchronisation terminée: ${addedCount} nouvelles activités, ${serverThemes.length} thèmes, modules synchronisés.`,
      );

      // Sauvegarder les métadonnées de synchronisation pour éviter les syncs inutiles
      try {
        await saveSyncMetadata({
          lastSyncDate: Date.now(),
          serverFiles: serverFiles.map((f) => ({
            id: f.id,
            version: f.version || 1,
          })),
          serverThemes: serverThemes.map((t) => ({
            id: t.id,
            version: t.version || 1,
          })),
          expiryDate: Date.now() + CONFIG.SYNC_COOLDOWN,
          syncedFilesCount: addedCount,
          totalFilesCount: serverFiles.length,
          totalThemesCount: serverThemes.length,
        });
        utils.log('Métadonnées de synchronisation sauvegardées avec succès');
      } catch (metadataError) {
        utils.warn(
          'Erreur lors de la sauvegarde des métadonnées:',
          metadataError,
        );
      }

      utils.log('Synchronisation terminée, appel de setSyncCompleted()');
      setSyncCompleted();

      return; // Succès, sortir de la boucle de retry
    } catch (error) {
      attempt++;
      utils.error(
        `Erreur lors de la synchronisation (tentative ${attempt}/${CONFIG.RETRY_ATTEMPTS}):`,
        error,
      );

      if (attempt < CONFIG.RETRY_ATTEMPTS) {
        utils.log(`Nouvelle tentative dans ${CONFIG.RETRY_DELAY}ms...`);
        await utils.delay(CONFIG.RETRY_DELAY);
      } else {
        utils.error(
          'Échec de la synchronisation après',
          CONFIG.RETRY_ATTEMPTS,
          'tentatives',
        );
        // Réinitialiser l'état en cas d'échec final
        setSyncCompleted();
        throw error;
      }
    }
  }
}

/**
 * Synchronisation intelligente avec vérification de cache
 * Cette fonction vérifie d'abord si une synchronisation récente a eu lieu
 * @param {Object} options - Options de synchronisation
 * @param {boolean} options.force - Forcer la synchronisation même si récente
 * @param {number} options.maxAgeHours - Âge maximum en heures pour considérer une sync comme récente
 * @returns {Promise<string>} Résultat de la synchronisation
 */
export async function smartSync(options = {}) {
  const { force = false, maxAgeHours = 24 } = options;

  if (!navigator.onLine) {
    utils.log('Pas de connexion internet disponible');
    return 'offline';
  }

  if (syncInProgress.value) {
    utils.log('Synchronisation déjà en cours');
    return 'in_progress';
  }

  try {
    // Vérifier d'abord si une synchronisation récente a eu lieu
    if (!force) {
      const recentSyncAvailable = await isRecentSyncAvailable(maxAgeHours);
      const metadata = await getSyncMetadata();

      if (recentSyncAvailable && metadata) {
        utils.log(
          `Synchronisation récente trouvée (${new Date(metadata.lastSyncDate).toLocaleString()}), synchronisation ignorée`,
        );
        utils.log(
          `Prochaine synchronisation automatique après: ${new Date(metadata.expiryDate).toLocaleString()}`,
        );
        return 'recent';
      }
    }

    // Lancer la synchronisation complète
    await syncActivitiesInBackground(force);
    return 'completed';
  } catch (error) {
    utils.error('Erreur lors de la synchronisation intelligente:', error);
    return 'error';
  }
}

/**
 * Obtient les informations de la dernière synchronisation
 * @returns {Promise<Object|null>} Informations de sync ou null
 */
export async function getLastSyncInfo() {
  try {
    const metadata = await getSyncMetadata();
    if (!metadata) {
      return null;
    }

    return {
      lastSyncDate: new Date(metadata.lastSyncDate),
      syncedFilesCount: metadata.syncedFilesCount || 0,
      totalFilesCount: metadata.totalFilesCount || 0,
      totalThemesCount: metadata.totalThemesCount || 0,
      expiryDate: new Date(metadata.expiryDate),
      isExpired: metadata.expiryDate <= Date.now(),
      nextSyncDue: metadata.expiryDate <= Date.now(),
    };
  } catch (error) {
    utils.warn(
      'Erreur lors de la récupération des informations de sync:',
      error,
    );
    return null;
  }
}

export function initActivitySync() {
  utils.log('Initialisation du service de synchronisation...');

  // Synchronisation automatique lors de la reconnexion
  window.addEventListener('online', () => {
    utils.log(
      'Connexion rétablie, lancement de la synchronisation intelligente...',
    );
    setTimeout(() => smartSync(), CONFIG.RECONNECT_DELAY);
  });

  // Synchronisation au démarrage de l'application (si connecté)
  if (navigator.onLine) {
    utils.log(
      'Application en ligne, synchronisation intelligente programmée dans',
      CONFIG.AUTO_SYNC_DELAY + 'ms...',
    );
    setTimeout(() => smartSync(), CONFIG.AUTO_SYNC_DELAY);
  } else {
    utils.log('Application hors ligne, synchronisation désactivée');
  }
}

utils.log('Service activity-sync.js chargé');
initActivitySync();

export function isSyncInProgress() {
  return syncInProgress.value;
}
