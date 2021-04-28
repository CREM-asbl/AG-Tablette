import { app, setState } from '../App';

/**
 * Représente l'historique d'un espace de travail.
 */
export class HistoryManager {
  /**
   * Renvoie true si undo() peut être appelé.
   * @return {Boolean}
   */
  static canUndo() {
    return app.history.index != -1;
  }

  /**
   * Renvoie true si redo() peut être appelé.
   * @return {Boolean}
   */
  static canRedo() {
    return app.history.index < app.history.steps.length - 1;
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
    let index = app.history.index - 1;
    let data = app.history.steps[index];
    if (index == -1) {
      data = app.history.startSituation;
    }
    app.workspace.initFromObject(data);
    setState({ tool: null, history: {...app.history, index} });
    if (!data) {
      setState({settings: {...app.defaultSettings}});
    } else {
      setState({settings: {...data.settings}});
    }
    window.dispatchEvent(new CustomEvent('add-fullstep', {detail: {name: 'Annuler'}}));
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
    let index = app.history.index + 1;
    let data = app.history.steps[index];
    if (index == -1) {
      data = app.history.startSituation;
    }
    app.workspace.initFromObject(data);
    setState({ tool: null, history: {...app.history, index}, settings: {...data.settings}});
    window.dispatchEvent(new CustomEvent('add-fullstep', {detail: {name: 'Refaire'}}));
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   */
  static addStep() {
    let steps = [...app.history.steps];
    steps.splice(
      app.history.index + 1,
      app.history.steps.length,
      HistoryManager.saveData(),
    );
    let index = steps.length - 1;
    setState({ history: {...app.history, steps, index}});
  }


  static saveData() {
    let data = app.workspace.data;
    data.settings = {...app.settings};

    return data;
  }
}

window.addEventListener('actions-executed', () => HistoryManager.addStep());

window.addEventListener('update-history', (event) =>
  HistoryManager.updateHistory(event.detail),
);

window.addEventListener('undo', () => {
  HistoryManager.undo();
});
window.addEventListener('redo', () => {
  HistoryManager.redo();
});
