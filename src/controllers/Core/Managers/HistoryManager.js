import { gridStore } from '../../../store/gridStore';
import { app, setState } from '../App';
import { FullHistoryManager } from './FullHistoryManager';

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
    const index = app.history.index - 1;
    let data;
    if (index == -1) {
      data = app.history.startSituation;
    } else {
      data = app.history.steps[index];
    }
    data = { ...data }; // Clone data to avoid modifying history steps directly

    app.workspace.initFromObject(data); // This might use data.settings internally if present

    let settingsForApp, tangram;

    if (!data || !data.settings) {
      // This case handles undoing to the initial state or if settings were not saved in this step.
      // Reset grid to its default state.
      gridStore.setGridType('none'); // This also sets isVisible to false by default in gridStore
      gridStore.setGridSize(1); // Default grid size
      // No specific app settings to restore from this history step, app.settings will be used.
      settingsForApp = { ...app.settings }; // Use current app settings
      // Remove any potential lingering grid properties from current app settings
      delete settingsForApp.gridShown;
      delete settingsForApp.gridType;
      delete settingsForApp.gridSize;
      delete settingsForApp.isVisible;


      tangram = {
        ...app.defaultState.tangram,
      };
    } else {
      // data.settings contains the settings saved at this history point.
      const historicalSettings = { ...data.settings };

      // Restore grid state from historicalSettings into gridStore
      if (typeof historicalSettings.gridType !== 'undefined') {
        gridStore.setGridType(historicalSettings.gridType);
      } else {
        // If not defined in history (e.g. older save), reset to default
        gridStore.setGridType('none');
      }
      if (typeof historicalSettings.gridSize !== 'undefined') {
        gridStore.setGridSize(historicalSettings.gridSize);
      } else {
        gridStore.setGridSize(1);
      }
      // isVisible should be set after setGridType, as setGridType might change isVisible.
      // The key in historical data might be 'isVisible' (new) or 'gridShown' (old).
      if (typeof historicalSettings.isVisible !== 'undefined') {
        gridStore.setIsVisible(historicalSettings.isVisible);
      } else if (typeof historicalSettings.gridShown !== 'undefined') { // Check for old key
        gridStore.setIsVisible(historicalSettings.gridShown);
      }
      // If neither isVisible nor gridShown is present, setGridType would have set a default visibility.

      // Prepare settings to be applied to app.settings:
      // Start with current app.settings, then overlay historical non-grid settings.
      settingsForApp = { ...app.settings, ...historicalSettings };

      // Remove all grid-related properties from settingsForApp, as grid is now managed by gridStore.
      delete settingsForApp.gridType;
      delete settingsForApp.gridSize;
      delete settingsForApp.isVisible;
      delete settingsForApp.gridShown; // Old key

      if (app.environment.name == 'Tangram') {
        if (data.tangram) {
          tangram = {
            ...app.defaultState.tangram,
            isSilhouetteShown: data.tangram.isSilhouetteShown,
          };
        }
      }
    }

    setState({ tool: null, history: { ...app.history, index }, settings: settingsForApp, tangram });
    FullHistoryManager.addStep('add-fullstep', { detail: { name: 'Annuler' } });
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
    const index = app.history.index + 1;
    const data = app.history.steps[index];
    app.workspace.initFromObject(data); // This might use data.settings

    const historicalSettings = { ...data.settings }; // Settings from the history step to redo
    let tangram;

    // Restore grid state from historicalSettings into gridStore
    if (typeof historicalSettings.gridType !== 'undefined') {
      gridStore.setGridType(historicalSettings.gridType);
    } else {
      gridStore.setGridType('none'); // Default if missing
    }
    if (typeof historicalSettings.gridSize !== 'undefined') {
      gridStore.setGridSize(historicalSettings.gridSize);
    } else {
      gridStore.setGridSize(1); // Default if missing
    }
    // isVisible should be set after setGridType. Check for new and old keys.
    if (typeof historicalSettings.isVisible !== 'undefined') {
      gridStore.setIsVisible(historicalSettings.isVisible);
    } else if (typeof historicalSettings.gridShown !== 'undefined') { // Check for old key
      gridStore.setIsVisible(historicalSettings.gridShown);
    }
    // If neither is present, setGridType handles default visibility.

    // Prepare settings to be applied to app.settings:
    // Start with current app.settings, then overlay historical non-grid settings.
    const settingsForApp = { ...app.settings, ...historicalSettings };

    // Remove all grid-related properties from settingsForApp
    delete settingsForApp.gridType;
    delete settingsForApp.gridSize;
    delete settingsForApp.isVisible;
    delete settingsForApp.gridShown; // Old key

    if (app.environment.name == 'Tangram') {
      if (data.tangram) {
        tangram = {
          ...app.defaultState.tangram,
          isSilhouetteShown: data.tangram.isSilhouetteShown,
        };
      }
    }
    setState({ tool: null, history: { ...app.history, index }, settings: settingsForApp, tangram });
    FullHistoryManager.addStep('add-fullstep', { detail: { name: 'Refaire' } });
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   */
  static addStep() {
    const steps = [...app.history.steps];
    steps.splice(
      app.history.index + 1,
      app.history.steps.length,
      HistoryManager.saveData(),
    );
    const index = steps.length - 1;

    HistoryManager.reduceSize(steps, index);
    setState({ history: { ...app.history, steps, index } });
  }

  static saveData() {
    const data = app.workspace.data; // This is the object that will be stored in history.
    // It typically includes shapes, segments, points, etc.
    const gridState = gridStore.getState();

    // Create a settings object for this history entry.
    // Start with a copy of the current application settings (app.settings).
    // These app.settings should ideally no longer contain any grid-related properties
    // as they have been migrated out of App.js.
    const settingsForHistory = { ...app.settings };

    // Defensively remove any old grid-related keys that might still linger in the
    // app.settings copy. This ensures they don't conflict with gridStore's state.
    delete settingsForHistory.gridShown; // Old key for visibility
    delete settingsForHistory.gridType;  // Old key for grid type
    delete settingsForHistory.gridSize;  // Old key for grid size
    delete settingsForHistory.isVisible; // Just in case new key was wrongly in app.settings

    // Now, add the authoritative grid state from gridStore to settingsForHistory.
    settingsForHistory.gridType = gridState.gridType;
    settingsForHistory.gridSize = gridState.gridSize;
    settingsForHistory.isVisible = gridState.isVisible;
    // Note: gridOpacity is not saved here, consistent with the previous behavior
    // which only saved gridShown, gridType, and gridSize.

    // Assign the composed settingsForHistory object to data.settings.
    // This is what will be saved in the history step.
    data.settings = settingsForHistory;

    if (app.environment.name == 'Tangram') {
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
    if (!steps[index] || !steps[index].objects || !steps[index].objects[objectType + 'Data']) return;
    if (!steps[index - 1] || !steps[index - 1].objects || !steps[index - 1].objects[objectType + 'Data']) return;

    for (const indexOfObject in steps[index].objects[objectType + 'Data']) {
      const objectData = steps[index].objects[objectType + 'Data'][indexOfObject];
      let indexOfReference = index - 1;
      let previousObjectData = steps[index - 1].objects[objectType + 'Data'].find(sData => sData.id == objectData.id);
      if (previousObjectData) {
        if (previousObjectData.indexOfReference) {
          indexOfReference = previousObjectData.indexOfReference;
          if (!steps[indexOfReference] || !steps[indexOfReference].objects || !steps[indexOfReference].objects[objectType + 'Data']) continue;
          previousObjectData = steps[indexOfReference].objects[objectType + 'Data'].find(sData => sData.id == objectData.id);
        }
        if (previousObjectData && HistoryManager.isObjectEqual(objectData, previousObjectData)) {
          steps[index].objects[objectType + 'Data'][indexOfObject] = { id: objectData.id, indexOfReference };
        }
      }
    }
  }

  static reduceSize(steps, index) {
    if (index == 0)
      return;
    HistoryManager.reduceSizeOfSingleObjectType('shapes', steps, index);
    HistoryManager.reduceSizeOfSingleObjectType('segments', steps, index);
    HistoryManager.reduceSizeOfSingleObjectType('points', steps, index);
  }
}

window.addEventListener('actions-executed', () => HistoryManager.addStep());
window.addEventListener('undo', () => HistoryManager.undo());
window.addEventListener('redo', () => HistoryManager.redo());