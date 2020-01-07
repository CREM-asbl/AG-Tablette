import { StatesManager } from '../StatesManager';
import { app } from '../App';

/**
 * Représente une étape d'execution de l'historique complet
 */
export class HistoryStep {
  constructor(data, type, timestamp = 0) {
    console.log(arguments);

    // required data
    this.data = data;

    // event, form_change, selection
    this.type = type;

    // timestamp of the step
    this.timestamp = timestamp;
  }

  saveToObject() {
    let save = {
      data: this.data,
      type: this.type,
      timestamp: this.timestamp,
    };
    return save;
  }

  initFromObject(save) {
    this.data = save.data;
    this.type = save.type;
    this.timestamp = save.timestamp;
  }

  /**
   * Annuler une étape. Cela fait reculer le curseur de l'historique d'un
   * élément.
   */
  undo() {
    if (app.state) app.state.start(false);
    if (!this.canUndo()) {
      console.error('Nothing to undo');
      return;
    }
    let actions = this.history[this.historyIndex].actions,
      reversedActions = [...actions].reverse();
    reversedActions.forEach(action => action.undo());
    this.historyIndex = this.history[this.historyIndex].previous_step;
    app.drawAPI.askRefresh();
    app.drawAPI.askRefresh('upper');
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
