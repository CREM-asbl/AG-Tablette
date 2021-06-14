import firebase from "firebase/app"
import config from "./firebase-config.json"
import 'firebase/analytics'
import 'firebase/performance'

import { app, setState } from '../Core/App';

import 'firebase/firestore';
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

export function getDataFromDocId(id) {
  app.db.collection("Activites").doc(id).get().then((doc) => {
    if (doc.exists) {
      window.dispatchEvent(new CustomEvent('doc-request-done', { detail: { status: 'successful', docData: doc.data() } }));
    } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
    }
  });
}

export function getFilesInfosFromEnvironment() {
  app.db.collection("Activites").where('Environment', '==', app.environment.name).get().then((querySnapshot) => {
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
      setState({ environment: await loadEnvironnement(data.Environment) });
      let fileContent = await readFileFromServer(data.url);

      // à retirer quand tout est centralisé dans app
      app.upperDrawingEnvironment = new DrawingEnvironment();
      app.mainDrawingEnvironment = new DrawingEnvironment();
      app.backgroundDrawingEnvironment = new DrawingEnvironment();
      app.invisibleDrawingEnvironment = new DrawingEnvironment();
      // ---

      window.addEventListener('app-started', () => OpenFileManager.parseFile(fileContent), {once: true});
    }
  }, { once: true });
  getDataFromDocId(id);
  // console.log("Document data:", data);
}