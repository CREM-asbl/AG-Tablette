import { app } from './App';
import { Shape } from './Objects/Shape';
import { Segment } from './Objects/Segment';
import { Point } from './Objects/Point';

/**
 * Représente l'historique d'un espace de travail.
 */
export class HistoryManager {
  static transformToObject(actions) {
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
  static canUndo() {
    return app.workspace.history.index != -1;
  }

  /**
   * Renvoie true si redo() peut être appelé.
   * @return {Boolean}
   */
  static canRedo() {
    return app.workspace.history.index < app.workspace.history.data.length - 1;
  }

  /**
   * Annuler une étape. Cela fait reculer le curseur de l'historique d'un
   * élément.
   */
  static undo() {
    if (!HistoryManager.canUndo()) {
      console.error('Nothing to undo');
      return;
    }
    let detail = [...app.workspace.history.data[app.workspace.history.index]].reverse();
    detail.forEach(step =>
      window.dispatchEvent(new CustomEvent('undo-' + step.name, { detail: step })),
    );
    // window.dispatchEvent(new CustomEvent('undo-' + detail.name, { detail: detail }));
    app.workspace.history.index--;
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('history-changed'));
  }

  /**
   * Refaire l'étape qui vient d'être annulée. Cela fait avancer le curseur
   * de l'historique d'un élément.
   */
  static redo() {
    if (!HistoryManager.canRedo()) {
      console.error('Nothing to redo');
      return;
    }
    let detail = app.workspace.history.data[app.workspace.history.index + 1];
    detail.forEach(step =>
      window.dispatchEvent(new CustomEvent('do-' + step.name, { detail: step })),
    );
    window.dispatchEvent(new CustomEvent('refresh'));
    app.workspace.history.index++;
    window.dispatchEvent(new CustomEvent('history-changed'));
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   * @param {[Action]} actions Les actions constituant l'étape
   */
  static addStep(actions) {
    app.workspace.history.data.splice(
      app.workspace.history.index + 1,
      app.workspace.history.data.length,
      HistoryManager.transformToObject(actions),
    );
    app.workspace.history.index = app.workspace.history.data.length - 1;

    window.dispatchEvent(new CustomEvent('history-changed'));
  }

  static deleteLastStep() {
    app.workspace.history.data.length--;
    app.workspace.history.index = app.workspace.history.data.length - 1;

    window.dispatchEvent(new CustomEvent('history-changed'));
  }
}

window.addEventListener('actions', event => HistoryManager.addStep(event.detail));

window.addEventListener('action-aborted', () => HistoryManager.deleteLastStep());

window.addEventListener('undo-action', () => {
  HistoryManager.undo();
});
window.addEventListener('redo-action', () => {
  HistoryManager.redo();
});
