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
      console.info('Nothing to undo');
      return;
    }
    let index = app.history.index - 1;
    let data = app.history.steps[index];
    if (index == -1) {
      data = app.history.startSituation;
    }
    app.workspace.initFromObject(data);
    let settings, tangram;
    if (!data) {
      settings = {
        ...app.settings,
        gridShown: false,//app.settings.gridShown,
        gridType: 'none',//app.settings.gridType,
        gridSize: 1,//app.settings.gridSize,
      };
      tangram = {
        ...app.defaultState.tangram,
      }
    } else {
      settings = { ...app.settings, ...data.settings };
      if (app.environment.name == 'Tangram') {
        if (data.tangram) {
          tangram = {
            ...app.defaultState.tangram,
            isSilhouetteShown: data.tangram.isSilhouetteShown,
            buttonText: data.tangram.buttonText,
            buttonValue: data.tangram.buttonValue,
          }
        }
      }
    }

    setState({ tool: null, history: { ...app.history, index }, settings, tangram });
    window.dispatchEvent(
      new CustomEvent('add-fullstep', { detail: { name: 'Annuler' } }),
    );
  }

  /**
   * Refaire l'étape qui vient d'être annulée. Cela fait avancer le curseur
   * de l'historique d'un élément.
   */
  static redo() {
    if (!HistoryManager.canRedo()) {
      console.info('Nothing to redo');
      return;
    }
    let index = app.history.index + 1;
    let data = app.history.steps[index];
    if (index == -1) {
      data = app.history.startSituation;
    }
    app.workspace.initFromObject(data);
    let settings = { ...app.settings, ...data.settings };
    let tangram = {
      ...app.defaultState.tangram,
      isSilhouetteShown: data.tangram.isSilhouetteShown,
      buttonText: data.tangram.buttonText,
      buttonValue: data.tangram.buttonValue,
    }
    setState({ tool: null, history: { ...app.history, index }, settings, tangram });
    window.dispatchEvent(
      new CustomEvent('add-fullstep', { detail: { name: 'Refaire' } }),
    );
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
    setState({ history: { ...app.history, steps, index } });
  }

  static saveData() {
    let data = app.workspace.data;
    data.settings = {
      gridShown: app.settings.gridShown,
      gridType: app.settings.gridType,
      gridSize: app.settings.gridSize,
    };
    if (app.environment.name == 'Tangram') {
      data.tangram = {
        isSilhouetteShown: app.tangram?.isSilhouetteShown,
        buttonText: app.tangram?.buttonText,
        buttonValue: app.tangram?.buttonValue,
      };
    }

    return data;
  }
}

window.addEventListener('actions-executed', () => HistoryManager.addStep());

window.addEventListener('undo', () => {
  HistoryManager.undo();
});
window.addEventListener('redo', () => {
  HistoryManager.redo();
});
