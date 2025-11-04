import { signal } from '@lit-labs/signals';
import {
  getAllModules,
  getAllThemes,
  saveModule,
  saveTheme,
} from '../utils/indexeddb-activities.js';

// Signal pour le thème sélectionné
export const selectedNotion = signal(null);

// Signal pour stocker les thèmes en cache
export const cachedThemes = signal([]);

// Signal pour stocker les séquences en cache
export const cachedSequences = signal([]);

// Signal pour stocker les fichiers en cache
export const cachedFiles = signal([]);

/**
 * Initialise les caches depuis IndexedDB au démarrage de l'application
 */
export async function initializeCachesFromIndexedDB() {
  try {
    // Charger les thèmes depuis IndexedDB
    const savedThemes = await getAllThemes();
    if (savedThemes && savedThemes.length > 0) {
      cachedThemes.set(savedThemes.map((t) => ({ id: t.id, ...t.data })));
    }

    // Charger les modules depuis IndexedDB
    const savedModules = await getAllModules();

    if (savedModules && savedModules.length > 0) {
      // Grouper les modules par thème
      const modulesByTheme = {};
      savedModules.forEach((module) => {
        const themeId = module.data?.theme || module.theme;

        if (!modulesByTheme[themeId]) {
          modulesByTheme[themeId] = [];
        }
        modulesByTheme[themeId].push({ id: module.id, ...module.data });
      });
      // Convertir en format cachedSequences
      const sequences = Object.entries(modulesByTheme).map(
        ([theme, modules]) => ({
          theme,
          modules,
        }),
      );
      cachedSequences.set(sequences);
    }
  } catch (error) {
    console.warn(
      "Erreur lors de l'initialisation des caches depuis IndexedDB:",
      error,
    );
  }
}
/**
 * Filtre strictement les propriétés pour ne garder que les données JSON-serializables
 */

/**
 * Sauvegarde les thèmes dans IndexedDB quand ils sont mis à jour
 * Filtre les propriétés non sérialisables
 */
export async function saveThemesToIndexedDB(themes) {
  try {
    for (const theme of themes) {
      let serializableTheme;
      try {
        serializableTheme = JSON.parse(JSON.stringify(theme));
      } catch (err) {
        console.warn('Thème non sérialisable ignoré:', theme.id, err);
        continue;
      }
      await saveTheme(theme.id, serializableTheme);
    }
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde des thèmes:', error);
  }
}

/**
 * Sauvegarde les modules dans IndexedDB quand ils sont mis à jour
 */
export async function saveModulesToIndexedDB(modules, themeId) {
  try {
    for (const module of modules) {
      // Nettoyer les données pour éviter les erreurs de sérialisation
      const cleanedModule = JSON.parse(
        JSON.stringify({ ...module, theme: themeId }),
      );
      await saveModule(module.id, cleanedModule);
    }
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde des modules:', error);
  }
}

/**
 * Synchronisation globale des thèmes et modules au démarrage
 * Précharge tous les thèmes et leurs modules dans IndexedDB et en mémoire
 */
export async function syncAllThemesAndModules() {
  if (!navigator.onLine) {
    return;
  }
  try {
    const { findAllThemes, getModulesDocFromTheme, debugFirebaseModules } =
      await import('../firebase/firebase-init');

    // Diagnostic Firebase avant synchronisation
    await debugFirebaseModules();

    const themes = await findAllThemes();

    if (themes && themes.length > 0) {
      await saveThemesToIndexedDB(themes);
      cachedThemes.set(themes);
      const allSequences = [];
      for (const theme of themes) {
        try {
          const modules = await getModulesDocFromTheme(theme.id);

          if (modules && modules.length > 0) {
            await saveModulesToIndexedDB(modules, theme.id);
            allSequences.push({ theme: theme.id, modules });
          } else {
            // Conserver les modules déjà présents en cache si aucun module trouvé
            const cached = cachedSequences
              .get()
              .find((seq) => seq.theme === theme.id);
            if (cached && cached.modules?.length > 0) {
              allSequences.push(cached);
            } else {
              console.warn(
                `⚠️ Aucun module disponible pour le thème '${theme.id}' (ni en ligne, ni en cache).`,
              );
            }
          }
        } catch (err) {
          console.error(
            `❌ Erreur lors de la récupération des modules pour le thème '${theme.id}':`,
            err,
          );

          // En cas d'erreur, essayer de conserver le cache existant
          const cached = cachedSequences
            .get()
            .find((seq) => seq.theme === theme.id);
          if (cached && cached.modules?.length > 0) {
            allSequences.push(cached);
          }
        }
      }
      if (allSequences.length > 0) {
        cachedSequences.set(allSequences);
      } else {
        console.warn(
          "Aucun module n'a pu être synchronisé, cache mémoire conservé.",
        );
      }
    } else {
      console.warn('Aucun thème trouvé lors de la synchronisation globale.');
    }
  } catch (error) {
    console.warn(
      'Erreur lors de la synchronisation globale des thèmes/modules:',
      error,
    );
  }
}

// Fonction pour basculer la sélection d'un thème
export const toggleNotion = (notionName) => {
  if (selectedNotion.get() === notionName) {
    selectedNotion.set(null);
  } else {
    selectedNotion.set(notionName);
  }
};

export const selectedSequence = signal('');

export const toggleSequence = (sequenceTitle) => {
  const current = selectedSequence.get();

  if (current !== sequenceTitle) {
    // Sélectionner la nouvelle séquence
    selectedSequence.set(sequenceTitle);
  } else {
    // Si on clique sur l'élément déjà sélectionné, on le désélectionne
    selectedSequence.set('');
  }
};

// Appel automatique au démarrage
async function startCachesAndSync() {
  await initializeCachesFromIndexedDB();
  await syncAllThemesAndModules();
}
startCachesAndSync();
