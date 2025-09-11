import { zip } from 'fflate';
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, initializeFirestore, persistentLocalCache, query, where } from "firebase/firestore";
import { getPerformance } from "firebase/performance";
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import { app } from '../controllers/Core/App';
import { loadEnvironnement } from '../controllers/Core/Environment';
import { OpenFileManager } from '../controllers/Core/Managers/OpenFileManager';
import config from './firebase-config.json';

const firebaseApp = initializeApp(config);
const db = initializeFirestore(firebaseApp, { localCache: persistentLocalCache() });
const storage = getStorage(firebaseApp);

if (location.hostname != 'localhost') {
  const analytics = getAnalytics();
  const perf = getPerformance(firebaseApp);
}

export async function openFileFromServer(activityName) {
  try {
    // Validation des paramètres
    if (!activityName || typeof activityName !== 'string') {
      throw new Error('Nom d\'activité invalide');
    }

    const data = await getFileDocFromFilename(activityName);
    if (data) {
      await loadEnvironnement(data.environment);
      let fileDownloadedObject = await readFileFromServer(data.id);

      // Si l'application est déjà démarrée, on parse directement le fichier
      // sinon on attend l'événement app-started
      if (app.started) {
        OpenFileManager.parseFile(fileDownloadedObject, activityName);
      } else {
        window.addEventListener('app-started', () => OpenFileManager.parseFile(fileDownloadedObject, activityName), { once: true });
      }
    } else {
      throw new Error(`Fichier non trouvé: ${activityName}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du fichier depuis le serveur:', error);
    window.dispatchEvent(new CustomEvent('show-notif', {
      detail: { message: `Erreur lors du chargement: ${error.message}` }
    }));
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
      console.warn(`Tentative ${attempt} échouée, retry dans ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function readFileFromServer(filename) {
  try {
    // Validation du nom de fichier
    if (!filename || typeof filename !== 'string') {
      throw new Error('Nom de fichier invalide');
    }

    // Vérifier le cache
    const cacheKey = `file_${filename}`;
    const cachedData = fileCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Fichier ${filename} récupéré depuis le cache`);
      return cachedData.data;
    }

    // Télécharger avec retry
    const fileDownloaded = await retryWithBackoff(async () => {
      const URL = await getDownloadURL(ref(storage, filename));
      const response = await fetch(URL);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }

      return response;
    }, 3, 1000);

    // Parser le JSON immédiatement
    const jsonData = await fileDownloaded.json();

    // Mettre en cache le contenu JSON plutôt que la réponse
    fileCache.set(cacheKey, {
      data: jsonData,
      timestamp: Date.now()
    });

    return jsonData;
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier depuis le serveur:', error);
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
    if (cachedMetadata && Date.now() - cachedMetadata.timestamp < CACHE_DURATION) {
      console.log(`Métadonnées ${id} récupérées depuis le cache`);
      return cachedMetadata.data;
    }

    // Récupérer avec retry
    const result = await retryWithBackoff(async () => {
      const docRef = doc(db, "files", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        app.fileFromServer = true;
        return { id, ...docSnap.data() };
      } else {
        throw new Error(`Document non trouvé: ${id}`);
      }
    }, 3, 1000);

    // Mettre en cache
    fileCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    return null;
  }
}

export async function findAllThemes() {
  let themes = await getDocs(collection(db, "themes"));
  let themesWithId = [];
  themes.forEach(doc => themesWithId.push({ id: doc.id, ...doc.data() }));
  return themesWithId;
}

export async function findAllFiles() {
  let files = await getDocs(collection(db, "files"));
  let filesWithId = [];
  files.forEach(doc => filesWithId.push({ id: doc.id, ...doc.data() }));
  return filesWithId;
}

export function getThemeDocFromThemeName(themeName) {
  let themeDoc = doc(db, 'themes', themeName);
  return themeDoc;
}

export function getModuleDocFromModuleName(moduleName) {
  let moduleDoc = doc(db, 'modules', moduleName);
  return moduleDoc;
}

export async function getModulesDocFromTheme(themeDoc) {
  let moduleDocs = await getDocs(query(collection(db, "modules"), where("theme", "==", themeDoc)));
  let moduleDocsWithId = [];
  moduleDocs.forEach(doc => moduleDocsWithId.push({ id: doc.id, ...doc.data() }));
  return moduleDocsWithId;
}

export async function getFilesDocFromModule(moduleDoc) {
  let fileDocs = await getDocs(query(collection(db, "files"), where("module", "==", moduleDoc)));
  let fileDocsWithId = [];
  fileDocs.forEach(doc => fileDocsWithId.push({ id: doc.id, ...doc.data() }));
  return fileDocsWithId;
}

export async function downloadFileZip(zipname, files) {
  try {
    // Vérifier si la liste des fichiers est vide
    if (!files || files.length === 0) {
      throw new Error("Aucun fichier à télécharger");
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
          data: new Uint8Array(fileData)
        };
      } catch (error) {
        console.error(`Erreur pour le fichier ${fileId}:`, error);
        return null;
      }
    });

    // Attendre le téléchargement de tous les fichiers
    const downloadedFiles = await Promise.all(filePromises);

    // Filtrer les fichiers qui n'ont pas pu être téléchargés
    const validFiles = downloadedFiles.filter(file => file !== null);

    if (validFiles.length === 0) {
      throw new Error("Aucun fichier n'a pu être téléchargé");
    }

    // Créer un objet avec les fichiers à compresser
    const zipData = {};
    validFiles.forEach(file => {
      zipData[file.name] = file.data;
    });

    // Créer le fichier ZIP avec fflate
    return new Promise((resolve, reject) => {
      zip(zipData, (err, data) => {
        if (err) {
          reject(new Error("Erreur lors de la création du ZIP: " + err.message));
          return;
        }

        // Créer un Blob à partir des données compressées
        const blob = new Blob([data], { type: 'application/zip' });

        // Télécharger le fichier
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = zipname;
        link.click();
        link.remove();

        resolve();
      });
    });
  } catch (error) {
    console.error("Erreur lors de la création du fichier ZIP:", error);
    throw error;
  }
}
