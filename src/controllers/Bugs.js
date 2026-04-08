import { appActions, bugs } from '../store/appState';
import { app } from './Core/App';

export const bugSend = async (message, src, line, col, error) => {
  if (location.hostname === 'localhost') return;
  const ids = src.split('/');
  const id = ids[ids.length - 1];
  if (bugs.get().includes(id)) return;
  const state = JSON.stringify(app);
  const data = { message, src, line, col, state };

  const { doc, getFirestore, setDoc } = await import('firebase/firestore');
  await import('@db/firebase-init');
  setDoc(doc(getFirestore(), 'BUGS', id), data);
  appActions.addBug(id);
};
