import { StatesManager } from '../StatesManager';
import { app } from '../App';
/**
 * Représente l'historique d'un espace de travail.
 */
export class WorkspaceHistory {
  constructor() {
    //Historique des actions
    this.history = [];

    //Index de la dernière tâche réalisée
    this.historyIndex = -1;
  }

  /**
   * Met à jour les boutons "Annuler" et "Refaire" du menu (définir l'attribut
   * disabled de ces deux boutons)
   */
  updateMenuState() {
    app.appDiv.canUndo = this.canUndo();
    app.appDiv.canRedo = this.canRedo();
  }

  saveToObject() {
    let save = {
      historyIndex: this.historyIndex,
      history: this.history.map(step => {
        return step.map(action => {
          return {
            className: action.constructor.name,
            data: action.saveToObject(),
          };
        });
      }),
    };
    return save;
  }

  initFromObject(object) {
    this.historyIndex = object.historyIndex;
    this.history = object.history.map(step => {
      return step.map(actionData => {
        if (!StatesManager.actions[actionData.className]) {
          console.error('unknown action class: ' + actionData.className);
          console.log(actionData);
          return null;
        }

        let action = StatesManager.actions[actionData.className].getInstance();
        action.initFromObject(actionData.data);
        return action;
      });
    });
    this.updateMenuState();
  }

  /**
   * Renvoie true si undo() peut être appelé.
   * @return {Boolean}
   */
  canUndo() {
    return this.historyIndex != -1;
  }

  /**
   * Renvoie true si redo() peut être appelé.
   * @return {Boolean}
   */
  canRedo() {
    return this.historyIndex + 1 < this.history.length;
  }

  /**
   * Annuler une étape. Cela fait reculer le curseur de l'historique d'un
   * élément.
   */
  undo() {
    if (!this.canUndo()) {
      console.error('Nothing to undo');
      return;
    }
    let actions = this.history[this.historyIndex--],
      reversedActions = [...actions].reverse();
    reversedActions.forEach(action => action.undo());
    app.drawAPI.askRefresh();
    this.updateMenuState();
  }

  /**
   * Refaire l'étape qui vient d'être annulée. Cela fait avancer le curseur
   * de l'historique d'un élément.
   */
  redo() {
    if (!this.canRedo()) {
      console.error('Nothing to redo');
      return;
    }
    this.history[++this.historyIndex].forEach(action => action.do());
    app.drawAPI.askRefresh();
    this.updateMenuState();
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   * @param {[Action]} actions Les actions constituant l'étape
   */
  addStep(actions) {
    this.history.splice(this.historyIndex + 1);
    this.history.push(actions);
    this.historyIndex++;

    this.updateMenuState();
  }
}
