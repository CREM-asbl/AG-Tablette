import { zip } from 'fflate';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocFromCache,
  getDocs,
  getDocsFromCache,
  initializeFirestore,
  limit,
  orderBy,
  persistentLocalCache,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';
import { getDownloadURL, getMetadata, getStorage, ref } from 'firebase/storage';
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

const isDev = import.meta.env?.DEV;
const logDevWarning = (message, error) => {
  if (isDev) {
    console.warn(message, error);
  }
};

// Initialisation Firebase Performance
let analytics = null;
let perf = null;

if (location.hostname !== 'localhost') {
  analytics = getAnalytics();
  perf = getPerformance(firebaseApp);
}

// Exporter pour utilisation dans l'application
export { perf };

async function loadAppControllerDependencies() {
  const [{ app }, { loadEnvironnement }, { OpenFileManager }] = await Promise.all([
    import('../controllers/Core/App'),
    import('../controllers/Core/Environment'),
    import('../controllers/Core/Managers/OpenFileManager'),
  ]);

  return { app, loadEnvironnement, OpenFileManager };
}

async function getAppInstance() {
  const { app } = await import('../controllers/Core/App');
  return app;
}

export async function openFileFromServer(activityName) {
  try {
    // Validation des paramètres
    if (!activityName || typeof activityName !== 'string') {
      throw new Error("Nom d'activité invalide");
    }

    // Doc Firestore, imports des contrôleurs ET contenu local en parallèle
    const [{ app, loadEnvironnement, OpenFileManager }, data, localActivity] =
      await Promise.all([
        loadAppControllerDependencies(),
        getFileDocFromFilename(activityName),
        getActivity(activityName).catch(() => null),
      ]);

    // Déterminer l'environnement : priorité au doc Firestore, fallback sur le contenu local
    let environment = data?.environment;
    if (!environment && localActivity?.data?.envName) {
      environment = localActivity.data.envName;
    }

    if (environment) {
      // Environnement et fichier local/réseau en parallèle : latence = max
      const results = await Promise.allSettled([
        loadEnvironnement(environment),
        readFileFromServer(data?.id || activityName),
      ]);
      const failure = results.find((r) => r.status === 'rejected');
      if (failure) throw failure.reason;
      const fileDownloadedObject = results[1].value;

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
export async function retryWithBackoff(fn, maxAttempts = 3, baseDelay = 300) {
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

// Tolérance d'horloge locale/serveur (alignée sur serverTimestampTolerance de
// activity-sync) : un décalage ≤ 5 s ne doit pas forcer un re-téléchargement.
const CLOCK_SKEW_TOLERANCE = 5000;

/**
 * Télécharge l'activité, la sauvegarde dans IndexedDB et alimente le cache
 * mémoire. Retourne le JSON téléchargé.
 */
async function downloadActivity(filename, fileRef, serverMetadata) {
  const fileDownloaded = await retryWithBackoff(
    async () => {
      const URL = await getDownloadURL(fileRef);
      // Pas de `cache: 'reload'` : cela court-circuite le cache HTTP à chaque
      // accès. La fraîcheur est vérifiée via getMetadata, pas via fetch.
      const response = await fetch(URL);

      if (!response.ok) {
        throw new Error(
          `Erreur HTTP: ${response.status} - ${response.statusText}`,
        );
      }

      return response;
          },
          3,
        );

  // Parser le JSON immédiatement
  const jsonData = await fileDownloaded.json();

  // Sauvegarder dans IndexedDB pour accès hors ligne
  try {
    // Utiliser la date du serveur comme timestamp de référence si disponible
    const timestampToSave =
      serverMetadata && serverMetadata.updated
        ? new Date(serverMetadata.updated).getTime()
        : Date.now();

    const version = jsonData.version || 1;
    await saveActivity(filename, jsonData, version, timestampToSave);
  } catch (saveError) {
    logDevWarning(
      '[firebase-init] IndexedDB save failed for activity cache:',
      saveError,
    );
  }

  // Mettre en cache le contenu JSON plutôt que la réponse
  fileCache.set(`file_${filename}`, {
    data: jsonData,
    timestamp: Date.now(),
  });

  return jsonData;
}

/**
 * Stale-while-revalidate : vérifie la fraîcheur côté serveur et rafraîchit la
 * copie locale en tâche de fond. Jamais bloquant — la copie locale est déjà
 * servie à l'appelant.
 */
function refreshActivityInBackground(filename, fileRef, localTimestamp) {
  (async () => {
    let serverMetadata = null;
    try {
      serverMetadata = await getMetadata(fileRef);
    } catch (metaError) {
      logDevWarning(
        `[firebase-init] getMetadata failed for ${filename}:`,
        metaError,
      );
      return;
    }

    if (!serverMetadata || !serverMetadata.updated) {
      return;
    }

    const serverLastModified = new Date(serverMetadata.updated).getTime();
    if (localTimestamp + CLOCK_SKEW_TOLERANCE >= serverLastModified) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log(
        `[firebase-init] Mise à jour en arrière-plan pour ${filename}: local ${new Date(localTimestamp).toLocaleString()} < server ${new Date(serverLastModified).toLocaleString()}`,
      );
    }

    await downloadActivity(filename, fileRef, serverMetadata);
  })().catch((error) => {
    logDevWarning(
      `[firebase-init] background refresh failed for ${filename}:`,
      error,
    );
  });
}

export async function readFileFromServer(filename, options = {}) {
  try {
    // Validation du nom de fichier
    if (!filename || typeof filename !== 'string') {
      throw new Error('Nom de fichier invalide');
    }

    const { forceDownload = false } = options;
    const fileRef = ref(storage, filename);

    // 1. IndexedDB d'abord : lecture locale sans aucun aller-retour réseau
    let localActivity = null;
    try {
      localActivity = await getActivity(filename);
    } catch (indexedDBError) {
      logDevWarning(
        '[firebase-init] IndexedDB read failed for activity cache:',
        indexedDBError,
      );
    }

    if (localActivity && !forceDownload) {
      // Stale-while-revalidate : servir la copie locale immédiatement,
      // vérifier la fraîcheur côté serveur en tâche de fond.
      if (navigator.onLine) {
        refreshActivityInBackground(
          filename,
          fileRef,
          localActivity.timestamp || 0,
        );
      }
      return localActivity.data;
    }

    // 2. Cache mémoire du processus (frais depuis < 5 min)
    const cacheKey = `file_${filename}`;
    if (!forceDownload) {
      const cachedData = fileCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        return cachedData.data;
      }
    }

    // 3. Première lecture uniquement : métadonnées + téléchargement
    let serverMetadata = null;
    try {
      if (navigator.onLine) {
        serverMetadata = await getMetadata(fileRef);
      }
    } catch (metaError) {
      logDevWarning(
        `[firebase-init] getMetadata failed for ${filename}:`,
        metaError,
      );
    }

    return await downloadActivity(filename, fileRef, serverMetadata);
  } catch (error) {
    // En cas d'erreur réseau, tenter une dernière fois IndexedDB
    try {
      const fallbackActivity = await getActivity(filename);
      if (fallbackActivity) {
        return fallbackActivity.data;
      }
    } catch (fallbackError) {
      logDevWarning(
        '[firebase-init] IndexedDB fallback read failed:',
        fallbackError,
      );
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

    // Cache Firestore local d'abord (persistentLocalCache) : lecture locale,
    // sans aller-retour réseau. Repli serveur seulement si absent du cache.
    const docRef = doc(db, 'files', id);
    let docSnap = null;
    try {
      docSnap = await getDocFromCache(docRef);
    } catch {
      docSnap = null; // doc jamais mis en cache localement
    }

    if (!docSnap || !docSnap.exists()) {
      if (!navigator.onLine) {
        throw new Error(
          `Hors ligne et document absent du cache local: ${id}`,
        );
      }

      docSnap = await retryWithBackoff(() => getDoc(docRef), 3);

      if (!docSnap.exists()) {
        throw new Error(`Document non trouvé: ${id}`);
      }

      const app = await getAppInstance();
      app.fileFromServer = true;
    }

    const result = { id, ...docSnap.data() };

    // Mettre en cache mémoire
    fileCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    if (!navigator.onLine) {
      logDevWarning(
        '[firebase-init] getFileDocFromFilename failed offline:',
        id,
        '— le document n\'a peut-être jamais été consulté en ligne',
      );
    } else {
      logDevWarning('[firebase-init] getFileDocFromFilename failed:', error);
    }
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
    logDevWarning('[firebase-init] IndexedDB read failed for themes:', err);
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
      logDevWarning(
        '[firebase-init] IndexedDB save failed for themes:',
        saveError,
      );
    }

    return themesWithId;
  } catch (error) {
    logDevWarning('[firebase-init] findAllThemes failed:', error);
    return [];
  }
}

export async function findAllFiles() {
  const files = await getDocs(collection(db, 'files'));
  const filesWithId = [];
  files.forEach((doc) => filesWithId.push({ id: doc.id, ...doc.data() }));
  return filesWithId;
}

export async function getFilesCount() {
  try {
    const snapshot = await getCountFromServer(collection(db, 'files'));
    return snapshot.data().count;
  } catch (error) {
    logDevWarning('[firebase-init] getFilesCount failed:', error);
    return null;
  }
}

export async function findAllFilesPaged({ pageSize = 200, onPage } = {}) {
  let lastDoc = null;
  let totalFetched = 0;

  while (true) {
    const constraints = [orderBy('__name__'), limit(pageSize)];
    if (lastDoc) constraints.push(startAfter(lastDoc));

    const snapshot = await getDocs(
      query(collection(db, 'files'), ...constraints),
    );

    if (snapshot.empty) break;

    const filesWithId = [];
    snapshot.forEach((doc) =>
      filesWithId.push({ id: doc.id, ...doc.data() }),
    );

    totalFetched += filesWithId.length;
    if (onPage) await onPage(filesWithId);

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < pageSize) break;
  }

  return totalFetched;
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
      logDevWarning(
        '[firebase-init] Permission check failed for modules collection:',
        permError,
      );
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
        void collectionRef;
      } catch (collError) {
        logDevWarning(
          '[firebase-init] Collection check failed for modules:',
          collError,
        );
      }

      return [];
    }
  } catch (error) {
    logDevWarning('[firebase-init] debugFirebaseModules failed:', error);
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
    logDevWarning(
      '[firebase-init] Serialization cleanup failed, falling back:',
      error,
    );

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
    logDevWarning('[firebase-init] IndexedDB read failed for modules:', err);
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
        logDevWarning(
          '[firebase-init] IndexedDB save failed for modules:',
          saveError,
        );
      }
    } else {

    }

    return moduleDocsWithId;
  } catch (error) {
    logDevWarning('[firebase-init] getModulesDocFromTheme failed:', error);
    return [];
  }
}

export async function getFilesDocFromModule(moduleDoc) {
  const filesQuery = query(
    collection(db, 'files'),
    where('module', '==', moduleDoc),
  );

  // Cache Firestore local d'abord : lecture locale non bloquante.
  try {
    const cachedDocs = await getDocsFromCache(filesQuery);
    const cachedWithId = [];
    cachedDocs.forEach((d) => cachedWithId.push({ id: d.id, ...d.data() }));
    if (cachedWithId.length > 0) {
      return cachedWithId;
    }
  } catch {
    // requête jamais exécutée localement → repli serveur
  }

  const fileDocs = await getDocs(filesQuery);
  const fileDocsWithId = [];
  fileDocs.forEach((d) => fileDocsWithId.push({ id: d.id, ...d.data() }));
  return fileDocsWithId;
}

/**
 * Utilitaires Firebase Performance
 */

/**
 * Créer une trace personnalisée Firebase Performance
 * @param {string} traceName - Nom de la trace
 * @param {Function} fn - Fonction à tracer
 * @returns {Promise<any>} Résultat de la fonction
 */
export async function traceOperation(traceName, fn) {
  // En développement, pas de trace Firebase
  if (import.meta.env.DEV || !perf) {
    return await fn();
  }

  const { trace } = await import('firebase/performance');
  const traceInstance = trace(perf, traceName);

  try {
    traceInstance.start();
    const result = await fn();
    traceInstance.stop();
    return result;
  } catch (error) {
    traceInstance.stop();
    throw error;
  }
}

/**
 * Enregistrer une métrique personnalisée sur une trace
 * @param {string} traceName - Nom de la trace
 * @param {string} metricName - Nom de la métrique
 * @param {number} value - Valeur de la métrique
 */
export async function recordMetric(traceName, metricName, value) {
  if (import.meta.env.DEV || !perf) return;

  try {
    const { trace } = await import('firebase/performance');
    const traceInstance = trace(perf, traceName);
    traceInstance.putMetric(metricName, value);
  } catch (error) {
    console.error('Erreur enregistrement métrique Firebase:', error);
  }
}

/**
 * Créer une trace HTTP automatique (requête réseau)
 * Firebase Performance trace automatiquement fetch() mais cette fonction
 * permet d'ajouter des attributs personnalisés
 * @param {string} url - URL de la requête
 * @param {object} attributes - Attributs personnalisés
 */
export function setHttpTraceAttributes(url, attributes = {}) {
  if (import.meta.env.DEV || !perf) return;

  // Firebase Performance trace automatiquement les fetch()
  // mais on peut ajouter des attributs via les headers personnalisés
  // Les attributs seront visibles dans la console Firebase
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
        logDevWarning(
          `[firebase-init] Download failed for file ${fileId}:`,
          error,
        );
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
    logDevWarning('[firebase-init] downloadFileZip failed:', error);
    throw error;
  }
}
