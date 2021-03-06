import { app } from './App';
import { Workspace } from './Objects/Workspace';
import { uniqId } from './Tools/general';

export class WorkspaceManager {
  constructor() {
    //Local storage reference
    this.ls = window.localStorage;

    //Init localStorage if necessary
    if (this.ls.getItem('AG_WorkspacesAmount') == null) {
      this.ls.setItem('AG_WorkspacesAmount', 0);
    }
  }

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
    workspace.history.updateMenuState();
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

  /* #################################################################### */
  /* ########################### LOCALSTORAGE ########################### */
  /* #################################################################### */

  /**
   * Sauvegarder un espace de travail dans le localStorage.
   * @param  {Workspace} workspace
   * @param  {String} [name="Unnamed"] Nom de l'espace de travail
   * @param  {Boolean} [eraseIfExisting=true] True: si un workspace avec le
   *  même id est déjà sauvegardé, on écrase cette sauvegarde. False: on
   *  génère un nouvel id pour le workspace reçu.
   * @return {String} l'id du workspace enregistré.
   */
  saveWorkspaceToLocalStorage(workspace, name = 'Unnamed', eraseIfExisting = true) {
    let json = workspace.saveToJSON(),
      index = this.getWorkspaceIndexInLocalStorage(workspace.id);
    if (index == -1 || !eraseIfExisting) {
      index = parseInt(this.ls.getItem('AG_WorkspacesAmount'));
      this.ls.setItem('AG_WorkspacesAmount', index + 1);
      if (!eraseIfExisting && index != -1) workspace.id = uniqId();
    }

    this.ls.setItem('AG_WSList_WS' + index + '_uniqid', workspace.id);
    this.ls.setItem('AG_WSList_WS' + index + '_name', name);
    this.ls.setItem('AG_WSList_WS' + index + '_data', json);
  }

  /**
   * Récupérer un workspace sauvegardé dans le localStorage à partir de son
   * identifiant unique.
   * @param  {String} uniqid    l'identifiant unique
   * @return {Workspace}        le Workspace, ou null si l'id n'est pas bon.
   */
  getWorkspaceFromLocalStorage(uniqid) {
    let wsAmount = parseInt(this.ls.getItem('AG_WorkspacesAmount'));
    for (let i = 0; i < wsAmount; i++) {
      let val = this.ls.getItem('AG_WSList_WS' + i + '_uniqid');
      if (val == uniqid) {
        let json = this.ls.getItem('AG_WSList_WS' + i + '_data'),
          ws = new Workspace();
        ws.initFromJSON(json);
        return ws;
      }
    }
    return null;
  }

  /**
   * Renvoie la liste des workspace enregistrés (id et nom).
   * @return {[{id, name}]}
   */
  getStoredWorkspaces() {
    let wsAmount = parseInt(this.ls.getItem('AG_WorkspacesAmount')),
      names = [];
    for (let i = 0; i < wsAmount; i++) {
      names.push({
        id: this.ls.getItem('AG_WSList_WS' + i + '_uniqid'),
        name: this.ls.getItem('AG_WSList_WS' + i + '_name'),
      });
    }
    return names;
  }

  /**
   * Récupérer l'index d'un Workspace dans le localStorage. Retourne -1 si le
   * Workspace n'a pas été trouvé.
   * @param  {String} uniqid l'id du workspace
   * @return {int}           son index
   */
  getWorkspaceIndexInLocalStorage(uniqid) {
    let wsAmount = parseInt(this.ls.getItem('AG_WorkspacesAmount'));
    for (let i = 0; i < wsAmount; i++) {
      let val = this.ls.getItem('AG_WSList_WS' + i + '_uniqid');
      if (val == uniqid) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Supprimer un workspace du localStorage
   * @param  {[type]} uniqid id unique du workspace
   */
  deleteWorkspaceFromLocalStorage(uniqid) {
    let wsAmount = parseInt(this.ls.getItem('AG_WorkspacesAmount')),
      index = this.getWorkspaceIndexInLocalStorage(uniqid);
    if (index == -1) {
      console.error('Workspace not found');
      return;
    }

    //Décale les Workspace suivants vers la gauche.
    for (let i = index + 1; i < wsAmount; i++) {
      let uniqid = this.ls.getItem('AG_WSList_WS' + i + '_data'),
        name = this.ls.getItem('AG_WSList_WS' + i + '_data'),
        json = this.ls.getItem('AG_WSList_WS' + i + '_data');

      this.ls.setItem('AG_WSList_WS' + (i - 1) + '_uniqid', uniqid);
      this.ls.setItem('AG_WSList_WS' + (i - 1) + '_name', name);
      this.ls.setItem('AG_WSList_WS' + (i - 1) + '_data', json);
    }

    this.ls.setItem('AG_WorkspacesAmount', wsAmount - 1);
  }

  setWorkspaceFromJSON(json) {
    let ws = new Workspace();
    ws.initFromJSON(json);
    this.setWorkspace(ws);
  }
}
