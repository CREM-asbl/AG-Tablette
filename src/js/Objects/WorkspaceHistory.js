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

    //Début de la branche en cours
    this.start_of_branch = 0;
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
          return StatesManager.getActionInstance(actionData);
        }),
        previous_step: step.previous_step,
        next_step: step.next_step,
        start_of_branch: step.start_of_branch,
      };
    });

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
    if (this.historyIndex == -1) return this.history.length;
    return this.history[this.historyIndex].next_step.length;
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
    //always get the last next step
    this.historyIndex =
      this.historyIndex != -1
        ? this.history[this.historyIndex].next_step.slice(-1)[0]
        : this.roots.slice(-1)[0];
    this.history[this.historyIndex].actions.forEach(action => action.do());
    app.drawAPI.askRefresh();
    this.updateMenuState();
    console.log(this.history);
  }

  get roots() {
    let roots = [];
    for (const key in this.history) {
      if (this.history[key].previous_step === -1) roots.push(parseInt(key, 10));
    }
    return roots;
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   * @param {[Action]} actions Les actions constituant l'étape
   */
  addStep(actions) {
    let previous_step;
    if (this.history.length == 0) {
      this.history.push({
        actions: actions,
        previous_step: -1,
        next_step: [],
        start_of_branch: 0,
      });
      this.start_of_branch = 0;
    } else {
      previous_step = this.historyIndex;
      if (this.historyIndex != -1)
        this.history[this.historyIndex].next_step.push(this.history.length);
      else this.start_of_branch = Number(this.history.length);
      this.history.push({
        actions: actions,
        previous_step: previous_step,
        next_step: [],
        start_of_branch: this.start_of_branch,
      });
      if (this.historyIndex != -1 && this.historyIndex < this.history.length - 2) {
        this.start_of_branch = previous_step;
        this.history[previous_step].start_of_branch = previous_step;
        for (let value of this.history[previous_step].next_step) {
          while (this.history[value].start_of_branch != value) {
            this.history[value].start_of_branch = previous_step;
            value = this.history[value].next_step[0];
            if (!value) break;
          }
        }
      }
    }
    this.historyIndex = this.history.length - 1;

    this.updateMenuState();
  }
}
