// Service de synchronisation pour les activités
// Gère la synchronisation en arrière-plan des fichiers d'activités

import { findAllFiles, findAllThemes, getModulesDocFromTheme, readFileFromServer } from '../firebase/firebase-init.js';
import { getAllActivities, saveActivity, saveModule, saveTheme } from '../utils/indexeddb-activities.js';

let syncInProgress = false;

export async function syncActivitiesInBackground() {
  if (syncInProgress) {
    console.log('Synchronisation déjà en cours...');
    return;
  }

  if (!navigator.onLine) {
    console.log('Pas de connexion internet, synchronisation annulée');
    return;
  }

  try {
    syncInProgress = true;
    console.log('Début de la synchronisation des activités, thèmes et modules...');

    // Synchronisation des fichiers d'activités
    const serverFiles = await findAllFiles();
    const localActivities = await getAllActivities();
    const localMap = new Map(localActivities.map(activity => [activity.id, activity]));
    let addedCount = 0;

    for (const serverFile of serverFiles) {
      try {
        const localActivity = localMap.get(serverFile.id);
        if (!localActivity) {
          console.log(`Téléchargement de la nouvelle activité: ${serverFile.id}`);
          const activityData = await readFileFromServer(serverFile.id);
          await saveActivity(serverFile.id, activityData);
          addedCount++;
        } else {
          console.log(`Activité ${serverFile.id} déjà présente localement`);
        }
      } catch (fileError) {
        console.warn(`Erreur lors de la synchronisation de ${serverFile.id}:`, fileError);
      }
    }

    // Synchronisation des thèmes
    const serverThemes = await findAllThemes();
    for (const theme of serverThemes) {
      try {
        await saveTheme(theme.id, theme);
        // Synchronisation des modules pour chaque thème
        const modules = await getModulesDocFromTheme(theme.id);
        for (const module of modules) {
          await saveModule(module.id, module);
        }
      } catch (themeError) {
        console.warn(`Erreur lors de la synchronisation du thème ${theme.id}:`, themeError);
      }
    }

    console.log(`Synchronisation terminée: ${addedCount} nouvelles activités, ${serverThemes.length} thèmes, modules synchronisés.`);

    window.dispatchEvent(new CustomEvent('activities-synced', {
      detail: { added: addedCount, themes: serverThemes.length }
    }));

  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
  } finally {
    syncInProgress = false;
  }
}


export function initActivitySync() {
  // Synchronisation automatique lors de la reconnexion
  window.addEventListener('online', () => {
    console.log('Connexion rétablie, lancement de la synchronisation...');
    setTimeout(syncActivitiesInBackground, 1000); // Délai pour s'assurer que la connexion est stable
  });

  // Synchronisation au démarrage de l'application (si connecté)
  if (navigator.onLine) {
    setTimeout(syncActivitiesInBackground, 2000); // Délai pour laisser l'app se charger
  }
}

initActivitySync();

export function isSyncInProgress() {
  return syncInProgress;
}