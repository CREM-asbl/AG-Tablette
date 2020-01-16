import { app } from './App';
import { Workspace } from './Objects/Workspace';

export class WorkspaceManager {
  constructor() {}

  /**
   * Définir l'espace de travail actuel
   * @param {Workspace} workspace
   */
  setWorkspace(workspace) {
    if (!workspace || !workspace.id) {
      console.error('Workspace object is not valid');
      return;
    }
    app.workspace = workspace;
    app.popups.grid.updatePopup();
    console.trace();
    // workspace.history.updateMenuState();
    app.refreshWindow();
  }

  /**
   * Créer un nouvel objet Workspace
   * @param  {String} [envName='Grandeur'] Nom de l'environnement
   * @return {Workspace}
   */
  getNewWorkspace(envName = 'Grandeur') {
    return new Workspace(app.envManager.getNewEnv(envName));
  }

  setWorkspaceFromJSON(json) {
    let ws = new Workspace();
    ws.initFromJSON(json);
    this.setWorkspace(ws);
  }
}
