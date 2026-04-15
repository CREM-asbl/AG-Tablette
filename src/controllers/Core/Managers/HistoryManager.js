import { appActions, historyState, settings } from '../../../store/appState';
import { gridStore } from '../../../store/gridStore';
import { app } from '../App';
import { FullHistoryManager } from './FullHistoryManager';

const hasValidCanvasSize = (workspaceData) => {
  const width = workspaceData?.canvasSize?.width;
  const height = workspaceData?.canvasSize?.height;

  return Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0;
};

/**
 * Représente l'historique d'un espace de travail.
 */
export class HistoryManager {
  /**
   * Renvoie true si undo() peut être appelé.
   * @return {Boolean}
   */
  static canUndo() {
    const state = historyState.get();
    return state && state.currentIndex !== undefined && state.currentIndex !== -1;
  }

  /**
   * Renvoie true si redo() peut être appelé.
   * @return {Boolean}
   */
  static canRedo() {
    const state = historyState.get();
    if (!state || !state.steps) return false;
    return state.currentIndex < state.steps.length - 1;
  }

  /**
   * Annuler une étape. Cela fait reculer le curseur de l'historique d'un
   * élément.
   */
  static async undo() {
    if (HistoryManager.isinteracting) return;
    if (!HistoryManager.canUndo()) {
      return;
    }
    HistoryManager.isinteracting = true;

    try {
      const state = historyState.get();
      const index = (state.currentIndex ?? 0) - 1;
      let data;
      if (index === -1) {
        data = state.startSituation;
      } else {
        data = state.steps ? state.steps[index] : null;
      }

      if (!data) {
        await app.workspace.resetWorkspace();
      } else {
        data = { ...data };
        await app.workspace.initFromObject(data);
      }

      let settingsForApp, tangram;

      if (!data || !data.settings) {
        gridStore.setGridType('none');
        gridStore.setGridSize(1);
        settingsForApp = { ...settings.get() };
        delete settingsForApp.gridShown;
        delete settingsForApp.gridType;
        delete settingsForApp.gridSize;
        delete settingsForApp.isVisible;

        tangram = {
          isSilhouetteShown: false,
          currentStep: null,
        };
      } else {
        const historicalSettings = { ...data.settings };

        if (typeof historicalSettings.gridType !== 'undefined') {
          gridStore.setGridType(historicalSettings.gridType);
        } else {
          gridStore.setGridType('none');
        }
        if (typeof historicalSettings.gridSize !== 'undefined') {
          gridStore.setGridSize(historicalSettings.gridSize);
        } else {
          gridStore.setGridSize(1);
        }
        if (typeof historicalSettings.isVisible !== 'undefined') {
          gridStore.setIsVisible(historicalSettings.isVisible);
        } else if (typeof historicalSettings.gridShown !== 'undefined') {
          gridStore.setIsVisible(historicalSettings.gridShown);
        }

        settingsForApp = { ...settings.get(), ...historicalSettings };

        delete settingsForApp.gridType;
        delete settingsForApp.gridSize;
        delete settingsForApp.isVisible;
        delete settingsForApp.gridShown;

        if (app.environment.name === 'Tangram') {
          if (data.tangram) {
            tangram = {
              isSilhouetteShown: data.tangram.isSilhouetteShown,
              currentStep: null,
            };
          }
        }
      }

      appActions.setActiveTool(null);
      appActions.setHistoryState({
        ...state,
        canUndo: index !== -1,
        canRedo: true,
        currentIndex: index,
      });
      appActions.updateSettings(settingsForApp);
      if (tangram) {
        appActions.setTangramState(tangram);
      }
      FullHistoryManager.addStep('add-fullstep', { detail: { name: 'Annuler' } });
    } finally {
      HistoryManager.isinteracting = false;
    }
  }

  /**
   * Refaire l'étape qui vient d'être annulée. Cela fait avancer le curseur
   * de l'historique d'un élément.
   */
  static async redo() {
    if (HistoryManager.isinteracting) return;
    if (!HistoryManager.canRedo()) {
      return;
    }
    HistoryManager.isinteracting = true;

    try {
      const state = historyState.get();
      const index = state.currentIndex + 1;
      const data = state.steps[index];
      await app.workspace.initFromObject(data);

      const historicalSettings = { ...data.settings };
      let tangram;

      if (typeof historicalSettings.gridType !== 'undefined') {
        gridStore.setGridType(historicalSettings.gridType);
      } else {
        gridStore.setGridType('none');
      }
      if (typeof historicalSettings.gridSize !== 'undefined') {
        gridStore.setGridSize(historicalSettings.gridSize);
      } else {
        gridStore.setGridSize(1);
      }
      if (typeof historicalSettings.isVisible !== 'undefined') {
        gridStore.setIsVisible(historicalSettings.isVisible);
      } else if (typeof historicalSettings.gridShown !== 'undefined') {
        gridStore.setIsVisible(historicalSettings.gridShown);
      }

      const settingsForApp = { ...settings.get(), ...historicalSettings };

      delete settingsForApp.gridType;
      delete settingsForApp.gridSize;
      delete settingsForApp.isVisible;
      delete settingsForApp.gridShown;

      if (app.environment.name === 'Tangram') {
        if (data.tangram) {
          tangram = {
            isSilhouetteShown: data.tangram.isSilhouetteShown,
            currentStep: null,
          };
        }
      }

      appActions.setActiveTool(null);
      appActions.setHistoryState({
        ...state,
        canUndo: true,
        canRedo: index < state.steps.length - 1,
        currentIndex: index,
      });
      appActions.updateSettings(settingsForApp);
      if (tangram) {
        appActions.setTangramState(tangram);
      }
      FullHistoryManager.addStep('add-fullstep', { detail: { name: 'Refaire' } });
    } finally {
      HistoryManager.isinteracting = false;
    }
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   */
  static addStep() {
    const state = historyState.get();
    let { startSituation, startSettings } = state;
    if (startSituation === null || !hasValidCanvasSize(startSituation)) {
      startSituation = HistoryManager.saveData();
      startSettings = { ...settings.get() };
    }

    const steps = [...(state.steps || [])];
    steps.splice(
      state.currentIndex + 1,
      steps.length,
      HistoryManager.saveData(),
    );
    const index = steps.length - 1;

    HistoryManager.reduceSize(steps, index);

    appActions.setHistoryState({
      ...state,
      startSituation,
      startSettings,
      steps,
      currentIndex: index,
      canUndo: index !== -1,
      canRedo: false,
      size: steps.length,
    });
  }

  static saveData() {
    const data = app.workspace.data;
    const gridState = gridStore.getState();

    const settingsForHistory = { ...settings.get() };

    delete settingsForHistory.gridShown;
    delete settingsForHistory.gridType;
    delete settingsForHistory.gridSize;
    delete settingsForHistory.isVisible;

    settingsForHistory.gridType = gridState.gridType;
    settingsForHistory.gridSize = gridState.gridSize;
    settingsForHistory.isVisible = gridState.isVisible;

    data.settings = settingsForHistory;

    if (app.environment.name === 'Tangram') {
      data.tangram = {
        isSilhouetteShown: app.tangram?.isSilhouetteShown,
      };
    }

    return data;
  }

  static isObjectEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
      return false;
    }
    for (const key of keys1) {
      if (object1[key] instanceof Object) {
        if (!HistoryManager.isObjectEqual(object1[key], object2[key])) {
          return false;
        }
      } else if (object1[key] !== object2[key]) {
        return false;
      }
    }

    return true;
  }

  static reduceSizeOfSingleObjectType(objectType, steps, index) {
    if (
      !steps[index] ||
      !steps[index].objects ||
      !steps[index].objects[objectType + 'Data']
    )
      return;
    if (
      !steps[index - 1] ||
      !steps[index - 1].objects ||
      !steps[index - 1].objects[objectType + 'Data']
    )
      return;

    for (const indexOfObject in steps[index].objects[objectType + 'Data']) {
      const objectData =
        steps[index].objects[objectType + 'Data'][indexOfObject];
      let indexOfReference = index - 1;
      let previousObjectData = steps[index - 1].objects[
        objectType + 'Data'
      ].find((sData) => sData.id === objectData.id);
      if (previousObjectData) {
        if (previousObjectData.indexOfReference) {
          indexOfReference = previousObjectData.indexOfReference;
          if (
            !steps[indexOfReference] ||
            !steps[indexOfReference].objects ||
            !steps[indexOfReference].objects[objectType + 'Data']
          )
            continue;
          previousObjectData = steps[indexOfReference].objects[
            objectType + 'Data'
          ].find((sData) => sData.id === objectData.id);
        }
        if (
          previousObjectData &&
          HistoryManager.isObjectEqual(objectData, previousObjectData)
        ) {
          steps[index].objects[objectType + 'Data'][indexOfObject] = {
            id: objectData.id,
            indexOfReference,
          };
        }
      }
    }
  }

  static reduceSize(steps, index) {
    if (index === 0) return;
    HistoryManager.reduceSizeOfSingleObjectType('shapes', steps, index);
    HistoryManager.reduceSizeOfSingleObjectType('segments', steps, index);
    HistoryManager.reduceSizeOfSingleObjectType('points', steps, index);
  }
}

export const initHistoryManager = () => {
  window.addEventListener('actions-executed', () => HistoryManager.addStep());
  window.addEventListener('undo', () => HistoryManager.undo());
  window.addEventListener('redo', () => HistoryManager.redo());
};
