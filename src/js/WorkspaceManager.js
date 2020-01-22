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

  /**
   * Créer un nouvel objet Workspace
   * @param  {String} [envName='Grandeurs'] Nom de l'environnement
   * @return {Workspace}
   */
  static getNewWorkspace(envName = 'Grandeurs') {
    return new Workspace();
  }

  static setWorkspaceFromJSON(json) {
    let ws = new Workspace();
    ws.initFromJSON(json);
    WorkspaceManager.setWorkspace(ws);
  }
}

window.addEventListener('app-started', () => {
  WorkspaceManager.setWorkspace(WorkspaceManager.getNewWorkspace('Grandeurs'));
});
