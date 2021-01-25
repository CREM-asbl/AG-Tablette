import { app } from '../App';

/**
 * Représente l'historique d'un espace de travail.
 */
export class HistoryManager {
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
    return app.workspace.history.index < app.workspace.history.length - 1;
  }

  // static updateHistory(action) {
  //   app.workspace.history.data[HistoryManager.historyIndex][
  //     HistoryManager.stepIndex
  //   ] = HistoryManager.transformToObject(action);
  // }

  // static updateBackup() {
  //   let wsData = app.workspace.data;
  //   app.workspace.shapes = [];
  //   app.workspace.shapeGroups = [];
  //   app.setState();
  //   app.workspace.history.index = -1;
  //   for (let i = 0; i < app.workspace.history.length; i++) {
  //     HistoryManager.redo();
  //   }
  //   wsData.history.data = app.workspace.history.data;
  //   app.lastFileVersion = app.version;
  //   app.workspace.initFromObject(wsData);
  // }

  /**
   * Annuler une étape. Cela fait reculer le curseur de l'historique d'un
   * élément.
   */
  static undo() {
    if (!HistoryManager.canUndo()) {
      console.error('Nothing to undo');
      return;
    }
    app.workspace.history.index--;
    let data = app.workspace.history.data[app.workspace.history.index];
    app.mainDrawingEnvironment.loadFromData(data);
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
    app.workspace.history.index++;
    let data = app.workspace.history.data[app.workspace.history.index];
    app.mainDrawingEnvironment.loadFromData(data);
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('history-changed'));
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   */
  static addStep() {
    app.workspace.history.data.splice(
      app.workspace.history.index + 1,
      app.workspace.history.length,
      app.mainDrawingEnvironment.saveData()
    );
    app.workspace.history.index = app.workspace.history.length - 1;

    window.dispatchEvent(new CustomEvent('history-changed'));
  }

  static deleteLastStep() {
    app.workspace.history.length--;
    app.workspace.history.index = app.workspace.history.length - 1;

    window.dispatchEvent(new CustomEvent('history-changed'));
  }
}

window.addEventListener('actions-executed', () => HistoryManager.addStep());

window.addEventListener('update-history', event =>
  HistoryManager.updateHistory(event.detail)
);

window.addEventListener('action-aborted', () =>
  HistoryManager.deleteLastStep()
);

window.addEventListener('undo-action', () => {
  HistoryManager.undo();
});
window.addEventListener('redo-action', () => {
  HistoryManager.redo();
});
