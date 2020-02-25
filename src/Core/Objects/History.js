import { app } from '../App';
import { HistoryManager } from '../Managers/HistoryManager';

/**
 * Représente l'historique d'un espace de travail.
 */
export class History {
  constructor() {
    //Historique des actions
    this.data = [];

    //Index de la dernière tâche réalisée
    this.index = -1;
  }

  transformFromPreviousVersion() {
    if (app.lastFileVersion == '1.0.0') {
      let newData = [];
      for (
        let i = this.roots.slice(-1)[0];
        i < this.data.length;
        i = this.data[i].next_step.slice(-1)[0]
      ) {
        if (this.index == i) this.index = newData.length;
        newData.push(
          this.data[i].actions.map(step => {
            return { name: step.className, ...step.data };
          }),
        );
      }
      this.data = newData;
      HistoryManager.updateBackup();
    }
  }

  get roots() {
    let roots = [];
    for (const key in this.data) {
      if (this.data[key].previous_step === -1) roots.push(parseInt(key, 10));
    }
    return roots;
  }

  get length() {
    return this.data.length;
  }

  saveToObject() {
    let save = {
      index: this.index,
      data: this.data,
    };
    return save;
  }

  initFromObject(object) {
    this.index = object.index;
    this.data = object.data;
    if (app.lastFileVersion == '1.0.0') {
      this.transformFromPreviousVersion();
    }
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
