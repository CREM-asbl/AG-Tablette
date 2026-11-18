import * as functions from 'firebase-functions';
import { reportBug as reportBugHandler } from './reportBug';

// Firebase Functions v2 : l'export nommé "reportBug" est la fonction déployée.
export const reportBug = functions.https.onCall(async (request) => {
  return reportBugHandler(request);
});