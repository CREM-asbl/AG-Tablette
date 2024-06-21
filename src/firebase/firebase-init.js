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
  const data = await getFileDocFromFilename(activityName);
  if (data) {
    let fileDownloaded = await readFileFromServer(data.id);
    let fileDownloadedObject = await fileDownloaded.json();
    window.addEventListener('app-started', () => OpenFileManager.parseFile(fileDownloadedObject, activityName), { once: true });
    loadEnvironnement(data.environment);
  }
}

export async function readFileFromServer(filename) {
  let URL = await getDownloadURL(ref(storage, filename));
  let fileDownloaded = await fetch(URL);
  return fileDownloaded;
}

export async function getFileDocFromFilename(id) {
  const docRef = doc(db, "files", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    app.fileFromServer = true;
    return { id, ...docSnap.data() };
  } else {
    console.info("No such document!");
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
  const blob = await downloadZip(files).blob();

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = zipname;
  link.click();
  link.remove();
}
