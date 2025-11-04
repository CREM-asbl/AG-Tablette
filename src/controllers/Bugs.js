import '@db/firebase-init';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { app } from './Core/App';

export const bugSend = (message, src, line, col, error) => {
  if (location.hostname === 'localhost') return;
  const ids = src.split('/');
  const id = ids[ids.length - 1];
  if (app.bugs?.find(id)) return;
  const state = JSON.stringify(app);
  const data = { message, src, line, col, state };
  setDoc(doc(getFirestore(), 'BUGS', id), data);
  app.bugs = [...(app.bugs || []), id];
};
