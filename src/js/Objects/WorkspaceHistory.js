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
      Object.keys(app.actions).forEach(action => {
        window.addEventListener(app.actions[action].instance.name, event =>
          this.addStep(event.detail),
        );
      });
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

  transformToObject(detail) {
    let savedDetail = {};
    for (let [key, value] of Object.entries(detail)) {
      if (value instanceof Shape || value instanceof Segment || value instanceof Point)
        value = value.saveToObject();
      savedDetail[key] = value;
    }
    return savedDetail;
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
    let detail = this.history[this.historyIndex];
    window.dispatchEvent(new CustomEvent('undo-' + detail.name, { detail: detail }));
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
    window.dispatchEvent(new CustomEvent('do-' + detail.name, { detail: detail }));
    app.drawAPI.askRefresh();
    this.historyIndex++;
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
  addStep(detail) {
    this.history.splice(this.historyIndex + 1, this.history.length, this.transformToObject(detail));
    this.historyIndex = this.history.length - 1;

    this.updateMenuState();
  }
}
