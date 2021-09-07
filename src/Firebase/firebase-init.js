import firebase from "firebase/compat/app"
import config from "./firebase-config.json"
import 'firebase/compat/analytics'
import 'firebase/compat/performance'

import { app, setState } from '../Core/App';

import 'firebase/compat/firestore';
import { OpenFileManager } from '../Core/Managers/OpenFileManager';
import { loadEnvironnement } from '../Core/Environments/Environment';
import { DrawingEnvironment } from '../Core/Objects/DrawingEnvironment';

firebase.initializeApp(config)

if (location.hostname != 'localhost') {
  firebase.analytics()
  firebase.performance()
}

export function connectDB() {

  if (app.db) {
    return;
  }

  const db = firebase.firestore();

  app.db = db;
}

async function handleNotionRequest(searchAssociated, requestFunction) {
  let querySnapshot = await requestFunction();
  let notionInfo = [];
  querySnapshot.forEach(doc => notionInfo.push({id: doc.id, ...doc.data()}));
  if (notionInfo.length > 0) {
    if (searchAssociated) {
      let notionInfosWithSequences = await findAlsoSequence(notionInfo, false);
      return notionInfosWithSequences;
    }
    return notionInfo;
  } else {
    // window.dispatchEvent(new CustomEvent('filesInfos-request-done', { detail: { status: 'failed' } }));
    // console.log('request error');
  }
}

export async function findAllNotions(searchAssociated = true) {
  connectDB();
  let notionInfos = await handleNotionRequest(searchAssociated, () => app.db.collection("Notions").get());
  return notionInfos;
}

async function handleSequenceRequest(searchAssociated, requestFunction) {
  let querySnapshot = await requestFunction();
  let sequenceInfo = [];
  querySnapshot.forEach(doc => sequenceInfo.push({id: doc.id, ...doc.data()}));
  if (sequenceInfo.length > 0) {
    if (searchAssociated) {
      let sequenceInfosWithFiles = await findAlsoFile(sequenceInfo, false);
      let sequenceInfosWithNotion = await findAlsoNotion(sequenceInfosWithFiles, false);
      return sequenceInfosWithNotion;
    }
    return sequenceInfo;
  } else {
    // window.dispatchEvent(new CustomEvent('filesInfos-request-done', { detail: { status: 'failed' } }));
    // console.log('request error');
  }
}

export async function findSequencesByIds(ids, searchAssociated = true) {
  connectDB();
  let sequenceInfos = await handleSequenceRequest(searchAssociated, () => app.db.collection("Sequences").where(firebase.firestore.FieldPath.documentId(), 'in', ids).get());
  return sequenceInfos;
}

async function handleFileRequest(searchAssociated, requestFunction) {
  let querySnapshot = await requestFunction();
  let filesInfos = [];
  querySnapshot.forEach(doc => filesInfos.push({id: doc.id, ...doc.data()}));
  if (filesInfos.length > 0) {
    if (searchAssociated) {
      let fileInfosWithSequence = await findAlsoSequence(filesInfos);
      return fileInfosWithSequence;
    }
    return filesInfos;
  } else {
    console.error('no file found');
  }
}

export async function findFilesByIds(ids, searchAssociated = true) {
  connectDB();
  let filesInfos = await handleFileRequest(searchAssociated, () => app.db.collection("Files").where(firebase.firestore.FieldPath.documentId(), 'in', ids).get());
  return filesInfos;
}

export function getDataFromDocId(id) {
  app.db.collection("Files").doc(id).get().then((doc) => {
    if (doc.exists) {
      window.dispatchEvent(new CustomEvent('doc-request-done', { detail: { status: 'successful', docData: doc.data() } }));
    } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
    }
  });
}

export function getFilesInfosFromEnvironment() {
  app.db.collection("Files").where('Environment', '==', app.environment.name).get().then((querySnapshot) => {
    let filesInfos = [];
    querySnapshot.forEach(doc => filesInfos.push(doc.data()));
    if (filesInfos.length > 0) {
      window.dispatchEvent(new CustomEvent('filesInfos-request-done', { detail: { status: 'successful', filesInfos: filesInfos } }));
    } else {
      console.log('request error');
    }
  });
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

export function openFileFromId(id) {
  connectDB();
  window.addEventListener('doc-request-done', async event => {
    if (event.detail.status == 'successful') {
      let data = event.detail.docData;
      let fileContent = await readFileFromServer(data.URL);
      window.addEventListener('app-started', () => OpenFileManager.parseFile(fileContent), {once: true});

      setState({ environmentLoading: true });
      setState({ environment: await loadEnvironnement(data.Environment) });

      // à retirer quand tout est centralisé dans app
      app.upperDrawingEnvironment = new DrawingEnvironment();
      app.mainDrawingEnvironment = new DrawingEnvironment();
      app.backgroundDrawingEnvironment = new DrawingEnvironment();
      app.invisibleDrawingEnvironment = new DrawingEnvironment();
      // ---
    }
  }, { once: true });
  getDataFromDocId(id);
  // console.log("Document data:", data);
}