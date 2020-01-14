import { app } from '../App';
import { Shape } from '../Objects/Shape';
import { Segment } from '../Objects/Segment';
import { Point } from '../Objects/Point';

/**
 * Représente l'historique d'un espace de travail.
 */
export class WorkspaceHistory {
  constructor() {
    //Historique des actions
    this.history = [];

    //Index de la dernière tâche réalisée
    this.historyIndex = -1;

    window.addEventListener('app-started', () => {
      // Si gestion de actions au cas par cas
      // Object.keys(app.actions).forEach(action => {
      //   window.addEventListener(app.actions[action].name, event =>
      //     this.addStep(event.detail),
      //   );
      // });
      window.addEventListener('actions', event => this.addStep(event.detail));
    });
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
      history: this.history,
    };
    return save;
  }

  initFromObject(object) {
    this.historyIndex = object.historyIndex;
    this.history = object.history;

    this.updateMenuState();
  }

  transformToObject(actions) {
    let savedActions = [];
    actions.forEach((action, idx) => {
      savedActions[idx] = {};
      for (let [key, value] of Object.entries(action)) {
        if (value instanceof Shape || value instanceof Segment || value instanceof Point)
          value = value.saveToObject();
        else if (value instanceof Array)
          value = value.map(elem => {
            if (elem instanceof Shape || elem instanceof Segment || elem instanceof Point)
              return elem.saveToObject();
            else return elem;
          });
        savedActions[idx][key] = value;
      }
    });
    return savedActions;
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
    return this.historyIndex < this.history.length - 1;
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
    let detail = [...this.history[this.historyIndex]].reverse();
    detail.forEach(step =>
      window.dispatchEvent(new CustomEvent('undo-' + step.name, { detail: step })),
    );
    // window.dispatchEvent(new CustomEvent('undo-' + detail.name, { detail: detail }));
    this.historyIndex--;
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
    let detail = this.history[this.historyIndex + 1];
    detail.forEach(step =>
      window.dispatchEvent(new CustomEvent('do-' + step.name, { detail: step })),
    );
    app.drawAPI.askRefresh();
    this.historyIndex++;
    this.updateMenuState();
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   * @param {[Action]} actions Les actions constituant l'étape
   */
  addStep(actions) {
    this.history.splice(
      this.historyIndex + 1,
      this.history.length,
      this.transformToObject(actions),
    );
    this.historyIndex = this.history.length - 1;

    this.updateMenuState();
  }
}
