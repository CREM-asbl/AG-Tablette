import { app, setState } from '../App';
import { Workspace } from '../Objects/Workspace';

export const setWorkspace = workspace => {
  if (!workspace || !workspace.id) {
    console.error('Workspace object is not valid');
    return;
  }
  app.workspace = workspace;
  window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
}

export const setWorkspaceFromObject = (data, center = true) => {
  const ws = new Workspace();
  setWorkspace(ws);
  ws.initFromObject(data, center);
}

window.addEventListener('app-started', () => {
  if (!app.fileFromServer) {
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
  }
}, { once: true });

window.addEventListener('new-window', () => {
  app.mainCanvasLayer.removeAllObjects();
  app.upperCanvasLayer.removeAllObjects();
  app.tangramCanvasLayer?.removeAllObjects();
  app.invisibleCanvasLayer?.removeAllObjects();
  setState({
    filename: null,
    history: app.defaultState.history,
    fullHistory: app.defaultState.fullHistory,
    stepSinceSave: app.defaultState.stepSinceSave,
  });
});
