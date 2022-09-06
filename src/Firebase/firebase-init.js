import { getAnalytics } from "firebase/analytics";
import { initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import { getPerformance } from "firebase/performance";
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import { setState } from '../Core/App';
import { loadEnvironnement } from '../Core/Environments/Environment';
import { OpenFileManager } from '../Core/Managers/OpenFileManager';
import config from './firebase-config.json';

const firebaseApp = initializeApp(config);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

if (location.hostname != 'localhost') {
  // firebase.analytics();
  // firebase.performance();
  const analytics = getAnalytics();
  const perf = getPerformance(firebaseApp);
}

export async function openFileFromServer(activityName) {
  const data = await getFileDocFromFilename(activityName);
  if (data) {
    let fileContent = await readFileFromServer(data.id);
    window.addEventListener('app-started', () => OpenFileManager.parseFile(fileContent), {once: true});

    setState({ appLoading: true });
    setState({ environment: await loadEnvironnement(data.environment) });
  }
}

export async function readFileFromServer(filename) {
  let URL = await getDownloadURL(ref(storage, filename));
  let fileDownloaded = await fetch(URL);
  let fileDownloadedObject = await fileDownloaded.json();
  return fileDownloadedObject;
}

export async function getFileDocFromFilename(id) {
  const docRef = doc(db, "files", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {id, ...docSnap.data()};
  } else {
    // doc.data() will be undefined in this case
    console.info("No such document!");
  }
}

export async function findAllThemes() {
  let themes = await getDocs(collection(db, "themes"));
  let themesWithId = [];
  themes.forEach(doc => themesWithId.push({id: doc.id, ...doc.data()}));
  return themesWithId;
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
  moduleDocs.forEach(doc => moduleDocsWithId.push({id:doc.id, ...doc.data()}));
  return moduleDocsWithId;
}

export async function getFilesDocFromModule(moduleDoc) {
  let fileDocs = await getDocs(query(collection(db, "files"), where("module", "==", moduleDoc)));
  let fileDocsWithId = [];
  fileDocs.forEach(doc => fileDocsWithId.push({id:doc.id, ...doc.data()}));
  return fileDocsWithId;
}
