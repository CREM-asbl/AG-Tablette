import {
  createMonotonicClock,
  createTimelineStep,
} from '../../../services/TimelineService';
import { appActions, fullHistoryState, historyState, settings, tangramState } from '../../../store/appState';
import { gridStore } from '../../../store/gridStore';
import { app } from '../App';
import { Coordinates } from '../Objects/Coordinates';
import { createElem } from '../Tools/utils';
import { SelectManager } from './SelectManager';

const syncToolState = (toolDetail) => {
  if (!toolDetail) return;

  appActions.setActiveTool(toolDetail.name || null);

  if (typeof toolDetail.currentStep !== 'undefined') {
    appActions.setCurrentStep(toolDetail.currentStep);
  }

  const { name, currentStep, ...extraState } = toolDetail;
  if (Object.keys(extraState).length > 0) {
    appActions.setToolState(extraState);
  }
};

const applyHistoricalSettings = (snapshotSettings = {}) => {
  const historicalSettings = { ...snapshotSettings };

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

  const mergedSettings = { ...settings.get(), ...historicalSettings };
  delete mergedSettings.gridType;
  delete mergedSettings.gridSize;
  delete mergedSettings.isVisible;
  delete mergedSettings.gridShown;
  appActions.updateSettings(mergedSettings);
};

/**
 * Représente l'historique complet d'un espace de travail.
 */
export class FullHistoryManager {
  static monotonicNow = createMonotonicClock();

  static startBrowsing() {
    const fullHistory = fullHistoryState.get();
    const numberOfActions = fullHistory.steps.filter(
      (step) => step.type === 'add-fullstep',
    ).length;
    if (numberOfActions === 0) {
      appActions.addNotification({ message: "L'historique est vide." });
      return;
    }
    FullHistoryManager.cleanHisto();
    import('../../fullhistory-tools');
    createElem('fullhistory-tools');

    // if called when already running
    window.clearTimeout(fullHistory.timeoutId);

    appActions.setActiveTool(null);
    appActions.setFullHistoryState({
      index: 0,
      actionIndex: 0,
      numberOfActions: numberOfActions,
      isRunning: true,
      isPlaying: false,
    });

    FullHistoryManager.saveHistory = { ...historyState.get() };
    FullHistoryManager.setWorkspaceToStartSituation();
  }

  static async stopBrowsing() {
    const fullHistory = fullHistoryState.get();
    window.clearTimeout(fullHistory.timeoutId);
    await FullHistoryManager.moveTo(fullHistory.numberOfActions);
    appActions.setActiveTool(null);
    appActions.setFullHistoryState({
      isRunning: false,
    });
    appActions.setHistoryState({ ...FullHistoryManager.saveHistory });
  }

  static pauseBrowsing() {
    appActions.setFullHistoryState({
      isPlaying: false,
    });
    window.clearTimeout(fullHistoryState.get().timeoutId);
  }

  static playBrowsing(onlySingleAction = false) {
    const fullHistory = fullHistoryState.get();
    const delay = FullHistoryManager.getReplayDelayAtIndex(fullHistory.index);
    const timeoutId = setTimeout(
      () => FullHistoryManager.executeAllSteps(onlySingleAction),
      delay,
    );
    appActions.setFullHistoryState({
      timeoutId,
      isPlaying: true,
    });
  }

  static async setWorkspaceToStartSituation() {
    const history = historyState.get();
    await app.workspace.initFromObject(history.startSituation);
    applyHistoricalSettings(history.startSettings || {});
    appActions.bumpCanvasRedraw(['main', 'upper', 'grid', 'tangram']);
  }

  static async moveTo(actionIndex, isForSingleActionPlaying = false) {
    FullHistoryManager.pauseBrowsing();
    const fullHistory = fullHistoryState.get();
    let index = fullHistory.steps.findIndex(
      (step) =>
        step.detail?.actionIndex === actionIndex && step.type === 'add-fullstep',
    );
    let data = fullHistory.steps[index]?.detail.data;
    if (isForSingleActionPlaying) {
      index = fullHistory.steps.findIndex(
        (step) => step.detail?.actionIndex === actionIndex,
      );
      data = fullHistory.steps[index - 1]?.detail.data;
    }
    if (data) {
      await app.workspace.initFromObject({ ...data });
      applyHistoricalSettings(data.settings || {});
      appActions.bumpCanvasRedraw(['main', 'upper', 'grid', 'tangram']);
    } else {
      await FullHistoryManager.setWorkspaceToStartSituation();
    }

    // not to re-execute fullStep
    let nextIndex = index;
    if (!isForSingleActionPlaying) nextIndex = Math.max(0, index + 1);
    if (actionIndex === 0) nextIndex = 0;
    appActions.setFullHistoryState({ actionIndex: Math.max(0, actionIndex || 0), index: nextIndex });
    appActions.setActiveTool(null);
  }

  static async executeAllSteps(onlySingleAction = false) {
    const fullHistory = fullHistoryState.get();
    if (fullHistory.index >= fullHistory.steps.length) {
      FullHistoryManager.stopBrowsing();
      return;
    }

    const stopReplay = await FullHistoryManager.executeStep();
    if (stopReplay && onlySingleAction) {
      FullHistoryManager.pauseBrowsing();
      return;
    }

    // Check if it's the last action recorded
    if (stopReplay && fullHistoryState.get().numberOfActions === fullHistoryState.get().actionIndex) {
      FullHistoryManager.stopBrowsing();
      return;
    }

    if (!fullHistoryState.get().isRunning) return;

    const index = fullHistoryState.get().index + 1;
    const delay = FullHistoryManager.getReplayDelayAtIndex(index);
    const timeoutId = setTimeout(
      () => FullHistoryManager.executeAllSteps(onlySingleAction),
      delay,
    );
    appActions.setFullHistoryState({ index, timeoutId });
  }

  static getReplayDelayAtIndex(index) {
    const steps = fullHistoryState.get().steps || [];
    const step = steps[index];
    if (!step) return 0;

    // Cap delays per event type to keep replay responsive.
    // Mouse interaction events (canvasMouseMove, canvasMouseDown, canvasMouseUp, mouse-coordinates-changed)
    // are capped tightly so replay stays fluid. Significant actions (add-fullstep, settings-changed)
    // may have slightly longer pauses to preserve visual rhythm.
    const MAX_MOUSE_DELAY_MS = 50;
    const MAX_ACTION_DELAY_MS = 2000;
    const MAX_DEFAULT_DELAY_MS = 500;

    const isMouse = (
      step.type === 'canvasMouseMove' ||
      step.type === 'canvasMouseDown' ||
      step.type === 'canvasMouseUp' ||
      step.type === 'canvasClick' ||
      step.type === 'mouse-coordinates-changed' ||
      step.type === 'canvasTouchStart' ||
      step.type === 'canvasTouchMove' ||
      step.type === 'canvasTouchEnd'
    );
    const cap = isMouse ? MAX_MOUSE_DELAY_MS
      : step.type === 'add-fullstep' ? MAX_ACTION_DELAY_MS
        : MAX_DEFAULT_DELAY_MS;

    // Prefer recorded deltas for faithful timing; fallback to legacy timestamp diff.
    if (typeof step.timeDelta === 'number' && Number.isFinite(step.timeDelta)) {
      return Math.min(Math.max(0, step.timeDelta), cap);
    }

    const previousStep = steps[index - 1];
    if (
      previousStep &&
      typeof step.timeStamp === 'number' &&
      Number.isFinite(step.timeStamp) &&
      typeof previousStep.timeStamp === 'number' &&
      Number.isFinite(previousStep.timeStamp)
    ) {
      return Math.min(Math.max(0, step.timeStamp - previousStep.timeStamp), cap);
    }

    return isMouse ? 16 : 50;
  }

  static async executeStep(index = fullHistoryState.get().index) {
    const fullHistory = fullHistoryState.get();
    const step = fullHistory.steps[index];
    if (!step) return;

    const { type, detail } = step;
    if (detail && detail.mousePos) {
      detail.mousePos = new Coordinates(detail.mousePos);
    }

    if (detail.actionIndex) {
      appActions.setFullHistoryState({
        actionIndex: detail.actionIndex,
      });
    }

    if (type === 'add-fullstep') {
      const data = detail.data;
      await app.workspace.initFromObject(data);
      applyHistoricalSettings(data?.settings || {});
      if (data.tangram) {
        appActions.setTangramState({ ...data.tangram });
      }
      appActions.bumpCanvasRedraw(['main', 'upper', 'grid', 'tangram']);
      return true;
    } else if (type === 'tool-changed' || type === 'tool-updated') {
      syncToolState(detail);
    } else if (type === 'settings-changed') {
      appActions.updateSettings({ ...detail });
    } else if (type === 'objectSelected') {
      SelectManager.selectObject(app.workspace.lastKnownMouseCoordinates);
    } else if (type === 'mouse-coordinates-changed') {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
      window.dispatchEvent(new CustomEvent('show-cursor'));
    } else if (type === 'setNumberOfParts') {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
      window.dispatchEvent(new CustomEvent('close-popup'));
    } else if (type === 'canvasMouseUp') {
      window.dispatchEvent(new CustomEvent(type));
    } else {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }
    return false;
  }

  static cleanMouseSteps() {
    const fullHistory = fullHistoryState.get();
    let steps = [...fullHistory.steps];
    let isClicked = false;
    for (let i = 0; i < steps.length - 1; i++) {
      const { type, _ } = steps[i];
      const nextType = steps[i + 1].type;

      if (type === 'canvasMouseUp') {
        isClicked = false;
      } else if (type === 'canvasMouseDown') {
        isClicked = true;
      }

      if (
        (type === 'mouse-coordinates-changed' || type === 'canvasMouseMove') &&
        !isClicked &&
        nextType !== 'objectSelected'
      ) {
        steps.splice(i, 1);
        i--;
      }
    }
    appActions.setFullHistoryState({ steps });
  }

  static cleanColorMultiplication() {
    const fullHistory = fullHistoryState.get();
    let steps = [...fullHistory.steps];
    for (let i = 0; i < steps.length - 2; i++) {
      const { type, detail } = steps[i];
      const nextType = steps[i + 1].type;
      const nextNextType = steps[i + 2].type;
      const nextNextDetail = steps[i + 2].detail;

      if (
        type === 'tool-updated' &&
        detail.name === 'color' &&
        detail.currentStep === 'listen' &&
        nextType === 'settings-changed' &&
        nextNextType === 'tool-updated' &&
        nextNextDetail.name === 'color' &&
        nextNextDetail.currentStep === 'listen'
      ) {
        steps.splice(i, 1);
        steps.splice(i, 1);
        i--;
      }
    }
    appActions.setFullHistoryState({ steps });
  }

  static cleanHisto() {
    // Keep full event fidelity: no destructive filtering during replay setup.
  }

  /**
   * @param {String} type  Le type d'event (pas d'office égal à celui de l'event déclencheur)
   * @param {Event}  event L'event déclencheur
   */
  static addStep(type, event) {
    const fullHistory = fullHistoryState.get();
    if (fullHistory.isRunning) return;
    const detail = { ...event.detail };
    if (type === 'objectSelected') detail.object = undefined;
    const stepsCount = fullHistory.steps ? fullHistory.steps.length : 0;
    if (type === 'add-fullstep') {
      detail.actionIndex =
        (fullHistory.steps || []).filter((step) => {
          return step.type === 'add-fullstep';
        }).length + 1;
      const data = app.workspace.data;
      data.history = undefined;
      data.settings = { ...settings.get() };
      data.tangram = { ...tangramState.get() };
      detail.data = data;
      appActions.setStepSinceSave(true);
    } else if (stepsCount <= 1) {
      detail.actionIndex = stepsCount;
    } else {
      detail.actionIndex =
        (fullHistory.steps || []).filter((step) => {
          return step.type === 'add-fullstep';
        }).length + 1;
    }
    if (
      (type === 'tool-changed' || type === 'tool-updated') &&
      (!detail.name || detail.name === 'solveChecker')
    ) {
      return;
    }
    const timeStamp = FullHistoryManager.monotonicNow();
    const previousStep = (fullHistory.steps || [])[stepsCount - 1];
    const timelineStep = createTimelineStep({
      type,
      detail,
      actionIndex: detail.actionIndex,
      previousStep,
      timeStamp,
      stepIndex: stepsCount,
    });

    const steps = [...(fullHistory.steps || []), timelineStep];
    appActions.setFullHistoryState({ steps });
  }
}

export const initFullHistoryManager = () => {
  FullHistoryManager.startTimestamp = Date.now();
  FullHistoryManager.monotonicNow = createMonotonicClock();

  // mouse events
  window.addEventListener('canvasClick', (event) =>
    FullHistoryManager.addStep('canvasClick', event),
  );
  window.addEventListener('canvasMouseDown', (event) =>
    FullHistoryManager.addStep('canvasMouseDown', event),
  );
  window.addEventListener('canvasMouseUp', (event) =>
    FullHistoryManager.addStep('canvasMouseUp', event),
  );
  window.addEventListener('canvasMouseMove', (event) =>
    FullHistoryManager.addStep('canvasMouseMove', event),
  );
  window.addEventListener('canvasMouseWheel', (event) =>
    FullHistoryManager.addStep('canvasMouseWheel', event),
  );
  window.addEventListener('canvasTouchStart', (event) =>
    FullHistoryManager.addStep('canvasTouchStart', event),
  );
  window.addEventListener('canvasTouchMove', (event) =>
    FullHistoryManager.addStep('canvasTouchMove', event),
  );
  window.addEventListener('canvasTouchEnd', (event) =>
    FullHistoryManager.addStep('canvasTouchEnd', event),
  );
  window.addEventListener('canvastouchcancel', (event) =>
    FullHistoryManager.addStep('canvastouchcancel', event),
  );
  window.addEventListener('objectSelected', (event) =>
    FullHistoryManager.addStep('objectSelected', event),
  );

  // use for animation states
  window.addEventListener('mouse-coordinates-changed', (event) =>
    FullHistoryManager.addStep('mouse-coordinates-changed', event),
  );

  window.addEventListener('actions-executed', (event) =>
    FullHistoryManager.addStep('add-fullstep', { detail: event.detail }),
  );

  window.addEventListener('create-silhouette', (event) =>
    FullHistoryManager.addStep('create-silhouette', event),
  );

  // undo - redo
  window.addEventListener('undo', (event) =>
    FullHistoryManager.addStep('undo', event),
  );
  window.addEventListener('redo', (event) =>
    FullHistoryManager.addStep('redo', event),
  );

  window.addEventListener('close-popup', (event) =>
    FullHistoryManager.addStep('close-popup', event),
  );

  window.addEventListener('tool-changed', () => {
    FullHistoryManager.addStep('tool-changed', { detail: app.tool });
  });
  window.addEventListener('tool-updated', () => {
    FullHistoryManager.addStep('tool-updated', { detail: app.tool });
  });
  window.addEventListener('settings-changed', () => {
    FullHistoryManager.addStep('settings-changed', { detail: app.settings });
  });

  window.addEventListener('start-browsing', () => {
    FullHistoryManager.startBrowsing();
  });
};
