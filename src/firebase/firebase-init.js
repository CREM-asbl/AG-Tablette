import { zip } from 'fflate';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  persistentLocalCache,
  query,
  where,
} from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import { app } from '../controllers/Core/App';
import { loadEnvironnement } from '../controllers/Core/Environment';
import { OpenFileManager } from '../controllers/Core/Managers/OpenFileManager';
import {
  getActivity,
  getAllModules,
  getAllThemes,
  saveActivity,
} from '../utils/indexeddb-activities.js';
import config from './firebase-config.json';

const firebaseApp = initializeApp(config);
const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache(),
});
const storage = getStorage(firebaseApp);

if (location.hostname != 'localhost') {
  const analytics = getAnalytics();
  const perf = getPerformance(firebaseApp);
}

export async function openFileFromServer(activityName) {
  try {
    // Validation des paramètres
    if (!activityName || typeof activityName !== 'string') {
      throw new Error("Nom d'activité invalide");
    }

    const data = await getFileDocFromFilename(activityName);
    if (data) {
      await loadEnvironnement(data.environment);
      const fileDownloadedObject = await readFileFromServer(data.id);

      // Si l'application est déjà démarrée, on parse directement le fichier
      // sinon on attend l'événement app-started
      if (app.started) {
        OpenFileManager.parseFile(fileDownloadedObject, activityName);
      } else {
        window.addEventListener(
          'app-started',
          () => OpenFileManager.parseFile(fileDownloadedObject, activityName),
          { once: true },
        );
      }
    } else {
      throw new Error(`Fichier non trouvé: ${activityName}`);
    }
  } catch (error) {

    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: { message: `Erreur lors du chargement: ${error.message}` },
      }),
    );
  }
}

// Cache pour les fichiers téléchargés
const fileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Utilitaire de retry avec backoff exponentiel
 */
async function retryWithBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      const delay = baseDelay * Math.pow(2, attempt - 1);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function readFileFromServer(filename) {
  try {
    // Validation du nom de fichier
    if (!filename || typeof filename !== 'string') {
      throw new Error('Nom de fichier invalide');
    }

    // Vérifier d'abord IndexedDB (accès hors ligne)
    try {
      const localActivity = await getActivity(filename);
      if (localActivity) {

        // Notification supprimée pour transparence utilisateur
        return localActivity.data;
      }
    } catch (indexedDBError) {

    }

    // Vérifier le cache mémoire
    const cacheKey = `file_${filename}`;
    const cachedData = fileCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {

      return cachedData.data;
    }

    // Télécharger avec retry
    const fileDownloaded = await retryWithBackoff(
      async () => {
        const URL = await getDownloadURL(ref(storage, filename));
        const response = await fetch(URL);

        if (!response.ok) {
          throw new Error(
            `Erreur HTTP: ${response.status} - ${response.statusText}`,
          );
        }

        return response;
      },
      3,
      1000,
    );

    // Parser le JSON immédiatement
    const jsonData = await fileDownloaded.json();

    // Sauvegarder dans IndexedDB pour accès hors ligne
    try {
      const version = jsonData.version || 1;
      await saveActivity(filename, jsonData, version);

    } catch (saveError) {

    }

    // Mettre en cache le contenu JSON plutôt que la réponse
    fileCache.set(cacheKey, {
      data: jsonData,
      timestamp: Date.now(),
    });

    return jsonData;
  } catch (error) {


    // En cas d'erreur réseau, tenter une dernière fois IndexedDB
    try {
      const fallbackActivity = await getActivity(filename);
      if (fallbackActivity) {

        return fallbackActivity.data;
      }
    } catch (fallbackError) {

    }

    throw error;
  }
}

export async function getFileDocFromFilename(id) {
  try {
    // Validation de l'ID
    if (!id || typeof id !== 'string') {
      throw new Error('ID de document invalide');
    }

    // Vérifier le cache pour les métadonnées
    const cacheKey = `metadata_${id}`;
    const cachedMetadata = fileCache.get(cacheKey);
    if (
      cachedMetadata &&
      Date.now() - cachedMetadata.timestamp < CACHE_DURATION
    ) {

      return cachedMetadata.data;
    }

    // Récupérer avec retry
    const result = await retryWithBackoff(
      async () => {
        const docRef = doc(db, 'files', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          app.fileFromServer = true;
          return { id, ...docSnap.data() };
        } else {
          throw new Error(`Document non trouvé: ${id}`);
        }
      },
      3,
      1000,
    );

    // Mettre en cache
    fileCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {

    return null;
  }
}

export async function findAllThemes() {
  // Essayer d'abord IndexedDB
  try {
    const localThemes = await getAllThemes();
    if (localThemes && localThemes.length > 0) {

      return localThemes.map((t) => ({ id: t.id, ...t.data }));
    }
  } catch (err) {

  }

  // Vérifier si on est en ligne avant d'essayer le serveur
  if (!navigator.onLine) {

    return [];
  }

  try {
    // Fallback serveur avec retry
    const themes = await retryWithBackoff(
      async () => {
        return await getDocs(collection(db, 'themes'));
      },
      2,
      1000,
    );

    const themesWithId = [];
    themes.forEach((doc) => themesWithId.push({ id: doc.id, ...doc.data() }));

    // Sauvegarder dans IndexedDB pour les prochaines fois
    try {
      const { saveTheme } = await import('../utils/indexeddb-activities.js');
      for (const theme of themesWithId) {
        await saveTheme(theme.id, theme);
      }

    } catch (saveError) {

    }

    return themesWithId;
  } catch (error) {

    return [];
  }
}

export async function findAllFiles() {
  const files = await getDocs(collection(db, 'files'));
  const filesWithId = [];
  files.forEach((doc) => filesWithId.push({ id: doc.id, ...doc.data() }));
  return filesWithId;
}

export function getThemeDocFromThemeName(themeName) {
  const themeDoc = doc(db, 'themes', themeName);
  return themeDoc;
}

export function getModuleDocFromModuleName(moduleName) {
  const moduleDoc = doc(db, 'modules', moduleName);
  return moduleDoc;
}

// Fonction de diagnostic pour vérifier la collection modules
export async function debugFirebaseModules() {
  try {


    // Tester les permissions de lecture
    try {
      await getDocs(
        query(
          collection(db, 'modules'),
          where('__name__', '!=', 'impossible_doc_name'),
        ),
      );

    } catch (permError) {

      return [];
    }

    // Récupérer TOUS les modules sans filtre
    const allModulesSnapshot = await getDocs(collection(db, 'modules'));


    if (allModulesSnapshot.size > 0) {
      const modulesList = [];
      allModulesSnapshot.forEach((doc) => {
        const moduleData = { id: doc.id, ...doc.data() };
        modulesList.push(moduleData);
      });

      // Grouper par thème pour voir la répartition
      const modulesByTheme = {};
      modulesList.forEach((module) => {
        // Gérer les DocumentReference pour les thèmes
        let themeKey;
        if (
          module.theme &&
          typeof module.theme === 'object' &&
          module.theme.id
        ) {
          themeKey = module.theme.id; // DocumentReference
        } else if (typeof module.theme === 'string') {
          themeKey = module.theme; // String directe
        } else {
          themeKey = 'SANS_THEME';
        }

        if (!modulesByTheme[themeKey]) modulesByTheme[themeKey] = [];
        modulesByTheme[themeKey].push(module);
      });


      return modulesList;
    } else {


      // Vérifier si la collection existe
      try {
        const collectionRef = collection(db, 'modules');

      } catch (collError) {

      }

      return [];
    }
  } catch (error) {
    return [];
  }
}

/**
 * Nettoie les données pour les rendre sérialisables dans IndexedDB
 * Supprime les fonctions, symboles et autres objets non sérialisables
 */
function cleanDataForSerialization(obj) {
  try {
    // Utiliser JSON.parse(JSON.stringify()) pour supprimer les propriétés non sérialisables
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {

    // En cas d'erreur, retourner un objet basique avec seulement les propriétés importantes
    return {
      id: obj.id,
      theme: obj.theme,
      hidden: obj.hidden,
      files: Array.isArray(obj.files) ? obj.files : [],
    };
  }
}

export async function getModulesDocFromTheme(themeDoc) {
  const themeId = typeof themeDoc === 'string' ? themeDoc : themeDoc.id;



  // Essayer d'abord IndexedDB
  try {
    const localModules = await getAllModules();


    if (localModules.length > 0) {
      // Debug de la structure des modules


      // Corriger l'accès aux données selon la structure réelle
      const filtered = localModules.filter((m) => {
        let moduleTheme;

        // Gérer les différents formats de données
        if (m.data?.theme) {
          if (typeof m.data.theme === 'object' && m.data.theme.id) {
            moduleTheme = m.data.theme.id; // DocumentReference
          } else {
            moduleTheme = m.data.theme; // String
          }
        } else if (m.theme) {
          if (typeof m.theme === 'object' && m.theme.id) {
            moduleTheme = m.theme.id; // DocumentReference
          } else {
            moduleTheme = m.theme; // String
          }
        }


        return moduleTheme === themeId;
      });

      if (filtered.length > 0) {

        return filtered.map((m) => ({ id: m.id, ...m.data }));
      } else {

      }
    }
  } catch (err) {

  }

  // Vérifier si on est en ligne avant d'essayer le serveur
  if (!navigator.onLine) {

    return [];
  }

  try {


    // Créer une référence au document thème pour la comparaison
    const themeRef = doc(db, 'themes', themeId);

    // Fallback serveur avec retry - utiliser la référence du document
    const moduleDocs = await retryWithBackoff(
      async () => {
        return await getDocs(
          query(collection(db, 'modules'), where('theme', '==', themeRef)),
        );
      },
      2,
      1000,
    );

    const moduleDocsWithId = [];
    moduleDocs.forEach((doc) => {
      const moduleData = { id: doc.id, ...doc.data() };
      // Convertir la DocumentReference en string pour la cohérence
      if (
        moduleData.theme &&
        typeof moduleData.theme === 'object' &&
        moduleData.theme.id
      ) {
        moduleData.theme = moduleData.theme.id;
      }
      moduleDocsWithId.push(moduleData);
    });



    // Sauvegarder dans IndexedDB pour les prochaines fois - seulement si on a des modules
    if (moduleDocsWithId.length > 0) {
      try {
        const { saveModule } = await import('../utils/indexeddb-activities.js');
        for (const module of moduleDocsWithId) {
          // Nettoyer les données avant sauvegarde pour éviter les erreurs de sérialisation
          const cleanedModule = cleanDataForSerialization({
            ...module,
            theme: themeId,
          });
          await saveModule(module.id, cleanedModule);
        }

      } catch (saveError) {

      }
    } else {

    }

    return moduleDocsWithId;
  } catch (error) {

    return [];
  }
}

export async function getFilesDocFromModule(moduleDoc) {
  const fileDocs = await getDocs(
    query(collection(db, 'files'), where('module', '==', moduleDoc)),
  );
  const fileDocsWithId = [];
  fileDocs.forEach((doc) => fileDocsWithId.push({ id: doc.id, ...doc.data() }));
  return fileDocsWithId;
}

export async function downloadFileZip(zipname, files) {
  try {
    // Vérifier si la liste des fichiers est vide
    if (!files || files.length === 0) {
      throw new Error('Aucun fichier à télécharger');
    }

    // Télécharger les fichiers depuis le stockage Firebase
    const filePromises = files.map(async (fileId) => {
      try {
        const fileURL = await getDownloadURL(ref(storage, fileId));
        const response = await fetch(fileURL);

        if (!response.ok) {
          throw new Error(`Erreur lors du téléchargement du fichier ${fileId}`);
        }

        const fileData = await response.arrayBuffer();
        return {
          name: fileId,
          data: new Uint8Array(fileData),
        };
      } catch (error) {

        return null;
      }
    });

    // Attendre le téléchargement de tous les fichiers
    const downloadedFiles = await Promise.all(filePromises);

    // Filtrer les fichiers qui n'ont pas pu être téléchargés
    const validFiles = downloadedFiles.filter((file) => file !== null);

    if (validFiles.length === 0) {
      throw new Error("Aucun fichier n'a pu être téléchargé");
    }

    // Créer un objet avec les fichiers à compresser
    const zipData = {};
    validFiles.forEach((file) => {
      zipData[file.name] = file.data;
    });

    // Créer le fichier ZIP avec fflate
    return new Promise((resolve, reject) => {
      zip(zipData, (err, data) => {
        if (err) {
          reject(
            new Error('Erreur lors de la création du ZIP: ' + err.message),
          );
          return;
        }

        // Créer un Blob à partir des données compressées
        const blob = new Blob([data], { type: 'application/zip' });

        // Télécharger le fichier
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = zipname;
        link.click();
        link.remove();

        resolve();
      });
    });
  } catch (error) {

    throw error;
  }
}
