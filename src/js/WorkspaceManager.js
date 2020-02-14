import { app } from './App';
import { Workspace } from './Objects/Workspace';

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
    window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
    window.dispatchEvent(new CustomEvent('workspace-settings-changed'));
    app.refreshWindow();
  }

  static setWorkspaceFromObject(data) {
    let ws = new Workspace();
    WorkspaceManager.setWorkspace(ws);
    ws.initFromObject(data);
    window.dispatchEvent(new CustomEvent('workspace-settings-changed'));
    app.refreshWindow();
  }
}

window.addEventListener('app-started', () => {
  WorkspaceManager.setWorkspace(new Workspace());
});

window.addEventListener('new-window', () => {
  WorkspaceManager.setWorkspace(new Workspace());
});
