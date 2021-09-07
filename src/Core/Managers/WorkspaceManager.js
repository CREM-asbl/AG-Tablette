import { app, setState } from '../App';
import { Workspace } from '../Objects/Workspace';

export class WorkspaceManager {
  /**
   * Définir l'espace de travail actuel
   * @param {Workspace} workspace
   */
  static setWorkspace(workspace) {
    if (!workspace || !workspace.id) {
      console.error('Workspace object is not valid');
      return;
    }
    app.workspace = workspace;
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    window.dispatchEvent(new CustomEvent('workspace-changed'));
  }

  static setWorkspaceFromObject(data) {
    let ws = new Workspace();
    WorkspaceManager.setWorkspace(ws);
    ws.initFromObject(data);
  }
}

window.addEventListener('app-started', () => {
  if (!app.fileFromServer) {
    console.log('new empty workspace');
    WorkspaceManager.setWorkspace(new Workspace());
  }
}, {once: true});

window.addEventListener('new-window', () => {
  // setTimeout(() => {
  app.mainDrawingEnvironment.removeAllObjects();
  app.upperDrawingEnvironment.removeAllObjects();
  app.backgroundDrawingEnvironment.removeAllObjects();
  setState({
    history: app.defaultState.history,
    fullHistory: app.defaultState.fullHistory,
    settings: {
      ...app.settings,
      gridShown: app.defaultState.settings.gridShown,
      gridType: app.defaultState.settings.gridType,
      gridSize: app.defaultState.settings.gridSize,
    },
    stepSinceSave: app.defaultState.stepSinceSave,
  });
  WorkspaceManager.setWorkspace(new Workspace());
  // }, 0);
});
