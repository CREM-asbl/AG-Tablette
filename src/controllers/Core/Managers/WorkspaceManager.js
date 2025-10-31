import { app } from '../App';
import { Workspace } from '../Objects/Workspace';

export const setWorkspace = workspace => {
  if (!workspace || !workspace.id) {
    console.error('Workspace object is not valid');
    return;
  }
  app.workspace = workspace;
  window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
}

export const setWorkspaceFromObject = async (data, center = true) => {
  const ws = new Workspace();
  setWorkspace(ws);
  await ws.initFromObject(data, center);
}

window.addEventListener('app-started', () => {
  if (!app.fileFromServer) {
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
  }
}, { once: true });
