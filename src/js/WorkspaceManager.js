import { app } from './App';
import { Workspace } from './Objects/Workspace';

export class WorkspaceManager {
  static init() {
    window.addEventListener('app-started', () => {
      WorkspaceManager.setWorkspace(WorkspaceManager.getNewWorkspace('Grandeur'));
    });
  }

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
    app.popups.grid.updatePopup();
    // workspace.history.updateMenuState();
    app.refreshWindow();
  }

  /**
   * Créer un nouvel objet Workspace
   * @param  {String} [envName='Grandeur'] Nom de l'environnement
   * @return {Workspace}
   */
  static getNewWorkspace(envName = 'Grandeur') {
    return new Workspace();
  }

  static setWorkspaceFromJSON(json) {
    let ws = new Workspace();
    ws.initFromJSON(json);
    WorkspaceManager.setWorkspace(ws);
  }
}
