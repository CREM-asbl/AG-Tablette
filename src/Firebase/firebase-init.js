// import firebase from 'firebase/compat/app';
// import 'firebase/compat/analytics';
// import 'firebase/compat/performance';

import { app, setState } from '../Core/App';
import { OpenFileManager } from '../Core/Managers/OpenFileManager';
import { loadEnvironnement } from '../Core/Environments/Environment';
import config from './firebase-config.json';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDoc, getDocs, doc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";

const firebaseApp = initializeApp(config);
const db = getFirestore(firebaseApp);

if (location.hostname != 'localhost') {
  // firebase.analytics();
  // firebase.performance();
  const analytics = getAnalytics();
  const perf = getPerformance(firebaseApp);
}

async function handleNotionRequest(searchAssociated, query) {
  const querySnapshot = await getDocs(query);

  let notionInfos = [];
  querySnapshot.forEach(doc => notionInfos.push({id: doc.id, ...doc.data()}));
  if (notionInfos.length > 0) {
    // if (searchAssociated) {
    //   let notionInfosWithSequences = await findAlsoSequence(notionInfo, false);
    //   return notionInfosWithSequences;
    // }
    return notionInfos;
  } else {
    console.log('request error');
  }
}

export async function findAllNotions(searchAssociated = true) {
  // connectDB();
  let notionInfos = await handleNotionRequest(searchAssociated, query(collection(db, "Notions")));
  return notionInfos;
}

async function handleSequenceRequest(searchAssociated, query) {
  const querySnapshot = await getDocs(query);

  let sequenceInfos = [];
  querySnapshot.forEach(doc => sequenceInfos.push({id: doc.id, ...doc.data()}));
  if (sequenceInfos.length > 0) {
    // if (searchAssociated) {
    //   let sequenceInfosWithFiles = await findAlsoFile(sequenceInfo, false);
    //   let sequenceInfosWithNotion = await findAlsoNotion(sequenceInfosWithFiles, false);
    //   return sequenceInfosWithNotion;
    // }
    return sequenceInfos;
  } else {
    console.log('request error');
  }
}

export async function findSequencesByIds(ids, searchAssociated = true) {
  // connectDB();
  let sequenceInfos = await handleSequenceRequest(searchAssociated, query(collection(db, "Sequences")));//, where(FieldPath.documentId(), 'in', ids)));
  sequenceInfos = sequenceInfos.filter(sequenceInfo => ids.includes(sequenceInfo.id));
  return sequenceInfos;
}

async function handleFileRequest(searchAssociated, query) {
  const querySnapshot = await getDocs(query);

  let fileInfos = [];
  querySnapshot.forEach(doc => fileInfos.push({id: doc.id, ...doc.data()}));
  if (fileInfos.length > 0) {
    // if (searchAssociated) {
    //   let fileInfosWithFiles = await findAlsoFile(sequenceInfo, false);
    //   let fileInfosWithNotion = await findAlsoNotion(fileInfosWithFiles, false);
    //   return fileInfosWithNotion;
    // }
    return fileInfos;
  } else {
    console.log('request error');
  }
}

export async function findFilesByIds(ids, searchAssociated = true) {
  let fileInfos = await handleFileRequest(searchAssociated, query(collection(db, "Files")));//, where(FieldPath.documentId(), 'in', ids)));
  fileInfos = fileInfos.filter(fileInfo => ids.includes(fileInfo.id));
  return fileInfos;
}

export async function openFileFromId(id) {
  const data = await getDataFromDocId(id);
  if (data) {
    let fileContent = await readFileFromServer(data.URL);
    window.addEventListener('app-started', () => OpenFileManager.parseFile(fileContent), {once: true});

    setState({ environmentLoading: true });
    setState({ environment: await loadEnvironnement(data.Environment) });

    const DrawingEnvironmentModule = await import('../Core/Objects/DrawingEnvironment.js');

    // à retirer quand tout est centralisé dans app
    app.upperDrawingEnvironment = new DrawingEnvironmentModule.DrawingEnvironment();
    app.mainDrawingEnvironment = new DrawingEnvironmentModule.DrawingEnvironment();
    app.backgroundDrawingEnvironment = new DrawingEnvironmentModule.DrawingEnvironment();
    app.invisibleDrawingEnvironment = new DrawingEnvironmentModule.DrawingEnvironment();
    // ---
  }
}

export async function getDataFromDocId(id) {
  const docRef = doc(db, "Files", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // doc.data() will be undefined in this case
    console.log("No such document!");
  }
}

export async function readFileFromServer(filename) {
  const response = await fetch(filename, { mode: 'cors' });
  if (response.ok) {
    let object = await response.json();
    if (object) return object;
    else console.error('Failed to parse file', smallFilename);
  } else {
    console.error('Failed to get file', smallFilename);
  }
}

// export function getFilesInfosFromEnvironment() {
//   app.db.collection("Files").where('Environment', '==', app.environment.name).get().then((querySnapshot) => {
//     let filesInfos = [];
//     querySnapshot.forEach(doc => filesInfos.push(doc.data()));
//     if (filesInfos.length > 0) {
//       window.dispatchEvent(new CustomEvent('filesInfos-request-done', { detail: { status: 'successful', filesInfos: filesInfos } }));
//     } else {
//       console.log('request error');
//     }
//   });
// }
