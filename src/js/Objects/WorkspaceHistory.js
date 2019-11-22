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
        return {
          actions: step.actions.map(action => {
            return {
              className: action.name,
              data: action.saveToObject(),
            };
          }),
          previous_step: step.previous_step,
          next_step: step.next_step,
          start_of_branch: step.start_of_branch,
        };
      }),
    };
    return save;
  }

  initFromObject(object) {
    this.historyIndex = object.historyIndex;
    this.history = object.history.map(step => {
      return {
        actions: step.actions.map(actionData => {
          console.log('actionData ', actionData);
          return StatesManager.getActionInstance(actionData);
        }),
        previous_step: step.previous_step,
        next_step: step.next_step,
        start_of_branch: step.start_of_branch,
      };
      // .filter(step => step);
    });
    console.log(this.history);
    // this.history = this.history.filter(step => {
    //   step.actions.length;
    // });
    this.historyIndex = this.history.length - 1;
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
    let actions = this.history[this.historyIndex].actions,
      reversedActions = [...actions].reverse();
    reversedActions.forEach(action => action.undo());
    this.historyIndex = this.history[this.historyIndex].previous_step;
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
    this.historyIndex =
      this.historyIndex != -1 ? this.history[this.historyIndex].next_step.slice(-1)[0] : 0;
    this.history[this.historyIndex].actions.forEach(action => action.do());
    app.drawAPI.askRefresh();
    this.updateMenuState();
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   * @param {[Action]} actions Les actions constituant l'étape
   */
  addStep(actions) {
    let start_of_branch, previous_step, next_step;
    next_step = [];
    if (this.history.length == 0) {
      start_of_branch = 0;
      previous_step = -1;
    } else {
      if (this.historyIndex == this.history.length - 1) {
        start_of_branch = this.history[this.historyIndex].start_of_branch;
      } else {
        start_of_branch = this.historyIndex;
      }
      previous_step = this.historyIndex;
      this.history[this.historyIndex].next_step.push(this.history.length);
    }

    this.history.push({
      actions: actions,
      previous_step: previous_step,
      next_step: next_step,
      start_of_branch: start_of_branch,
    });
    this.historyIndex = this.history.length - 1;

    console.log(this.history);

    this.updateMenuState();
  }
}
