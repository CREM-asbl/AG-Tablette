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
    WorkspaceManager.setWorkspace(new Workspace());
  }
}, {once: true});

window.addEventListener('new-window', () => {
  app.mainCanvasLayer.removeAllObjects();
  app.upperCanvasLayer.removeAllObjects();
  app.tangramCanvasLayer?.removeAllObjects();
  app.gridCanvasLayer?.removeAllObjects();
  app.tools.forEach(tool => tool.isVisible = true);
  app.environment.families.forEach(family => family.isVisible = true);
  setState({
    filename: null,
    history: app.defaultState.history,
    fullHistory: app.defaultState.fullHistory,
    settings: {
      ...app.settings,
      gridShown: app.defaultState.settings.gridShown,
      gridType: app.defaultState.settings.gridType,
      gridSize: app.defaultState.settings.gridSize,
    },
    stepSinceSave: app.defaultState.stepSinceSave,
    tools: [...app.tools],
  });
  WorkspaceManager.setWorkspace(new Workspace());
});
