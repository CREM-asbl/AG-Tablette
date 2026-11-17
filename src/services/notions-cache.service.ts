import { cachedSequences, cachedThemes } from '../store/notions';
import {
  getAllModules,
  getAllThemes,
  saveModule,
  saveTheme,
} from '../utils/indexeddb-activities.js';

export async function initializeCachesFromIndexedDB() {
  try {
    const savedThemes = await getAllThemes();
    if (savedThemes && savedThemes.length > 0) {
      cachedThemes.set(savedThemes.map((theme) => ({ id: theme.id, ...theme.data })));
    }

    const savedModules = await getAllModules();
    if (savedModules && savedModules.length > 0) {
      const modulesByTheme = {};
      savedModules.forEach((module) => {
        const themeId = module.data?.theme || module.theme;

        if (!modulesByTheme[themeId]) {
          modulesByTheme[themeId] = [];
        }
        modulesByTheme[themeId].push({ id: module.id, ...module.data });
      });

      const sequences = Object.entries(modulesByTheme).map(([theme, modules]) => ({
        theme,
        modules,
      }));
      cachedSequences.set(sequences);
    }
  } catch (error) {
    console.warn(
      "Erreur lors de l'initialisation des caches depuis IndexedDB:",
      error,
    );
  }
}

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

export async function saveModulesToIndexedDB(modules, themeId) {
  try {
    for (const module of modules) {
      const cleanedModule = JSON.parse(
        JSON.stringify({ ...module, theme: themeId }),
      );
      await saveModule(module.id, cleanedModule);
    }
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde des modules:', error);
  }
}

export async function syncAllThemesAndModules() {
  if (!navigator.onLine) {
    return;
  }

  try {
    const { findAllThemes, getModulesDocFromTheme, debugFirebaseModules } =
      await import('../firebase/firebase-init');

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
            const cached = cachedSequences
              .get()
              .find((sequence) => sequence.theme === theme.id);
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

          const cached = cachedSequences
            .get()
            .find((sequence) => sequence.theme === theme.id);
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