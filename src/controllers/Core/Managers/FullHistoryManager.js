import { app, setState } from '../App';
import { Coordinates } from '../Objects/Coordinates';
import { createElem } from '../Tools/general';
import { SelectManager } from './SelectManager';

/**
 * Représente l'historique complet d'un espace de travail.
 */
export class FullHistoryManager {
  static startBrowsing() {
    let numberOfActions = app.fullHistory.steps.filter((step) => step.type == 'add-fullstep').length;
    if (numberOfActions == 0) {
      window.dispatchEvent(
        new CustomEvent('show-notif', { detail: { message: "L'historique est vide." } })
      );
      return;
    }
    FullHistoryManager.cleanHisto();
    import('../../fullhistory-tools');
    createElem('fullhistory-tools');

    // if called when already running
    window.clearTimeout(app.fullHistory.timeoutId);

    setState({
      tool: null,
      fullHistory: {
        ...app.fullHistory,
        index: 0,
        actionIndex: 0,
        numberOfActions: numberOfActions,
        isRunning: true,
        isPlaying: false,
      },
    });

    FullHistoryManager.saveHistory = { ...app.history };
    FullHistoryManager.setWorkspaceToStartSituation();
    FullHistoryManager.nextTime = 0;
  }

  static stopBrowsing() {
    window.clearTimeout(app.fullHistory.timeoutId);
    FullHistoryManager.moveTo(app.fullHistory.numberOfActions);
    setState({
      tool: null,
      fullHistory: {
        ...app.fullHistory,
        isRunning: false,
      },
      history: { ...FullHistoryManager.saveHistory },
    });
  }

  static pauseBrowsing() {
    setState({
      fullHistory: {
        ...app.fullHistory,
        isPlaying: false,
      },
    });
    window.clearTimeout(app.fullHistory.timeoutId);
  }

  static playBrowsing(onlySingleAction = false) {
    let timeoutId = setTimeout(
      () => FullHistoryManager.executeAllSteps(onlySingleAction),
      FullHistoryManager.nextTime + 50,
    );
    setState({
      fullHistory: {
        ...app.fullHistory,
        timeoutId,
        isPlaying: true,
      },
    });
  }

  static setWorkspaceToStartSituation() {
    app.workspace.initFromObject(app.history.startSituation);
    setState({ settings: { ...app.history.startSettings } });
  }

  static moveTo(actionIndex, isForSingleActionPlaying = false) {
    FullHistoryManager.pauseBrowsing();
    let index = app.fullHistory.steps.findIndex(
      (step) => step.detail?.actionIndex === actionIndex && step.type == 'add-fullstep');
    let data = app.fullHistory.steps[index]?.detail.data;
    if (isForSingleActionPlaying) {
      index = app.fullHistory.steps.findIndex(
        (step) => step.detail?.actionIndex === actionIndex
      );
      data = app.fullHistory.steps[index - 1]?.detail.data;
    }
    if (data) {
      app.workspace.initFromObject({ ...data });
      let settings = {
        ...app.settings,
        gridShown: data.settings.gridShown,
        gridType: data.settings.gridType,
        gridSize: data.settings.gridSize,
      };
      setState({ settings });
    } else {
      FullHistoryManager.setWorkspaceToStartSituation();
    }

    // not to re-execute fullStep
    if (!isForSingleActionPlaying)
      index++;
    setState({ fullHistory: { ...app.fullHistory, actionIndex: actionIndex, index }, tool: undefined });
  }

  static executeAllSteps(onlySingleAction = false) {
    if (app.fullHistory.index >= app.fullHistory.steps.length) {
      FullHistoryManager.stopBrowsing();
      return;
    }

    if (FullHistoryManager.executeStep() && onlySingleAction) {
      FullHistoryManager.pauseBrowsing();
      return;
    }
    if (!app.fullHistory.isRunning) return;

    let index = app.fullHistory.index + 1;
    let timeoutId = setTimeout(
      () => FullHistoryManager.executeAllSteps(onlySingleAction),
      FullHistoryManager.nextTime + 50 // nextTime,
    );
    setState({ fullHistory: { ...app.fullHistory, index, timeoutId } });
    FullHistoryManager.nextTime = 0;
  }

  static executeStep(index = app.fullHistory.index) {
    let { type, detail } = app.fullHistory.steps[index];
    if (detail && detail.mousePos) { detail.mousePos = new Coordinates(detail.mousePos) }

    if (detail.actionIndex) {
      setState({
        fullHistory: {
          ...app.fullHistory,
          actionIndex: detail.actionIndex,
        }
      });
    }

    if (type == 'add-fullstep') {
      if (detail.name == 'Retourner') {
        FullHistoryManager.nextTime = 2 * 1000;
      } else if (detail.name == 'Diviser') {
        FullHistoryManager.nextTime = 0.5 * 1000;
      } else if (detail.name == 'Découper') {
        FullHistoryManager.nextTime = 0.5 * 1000;
      }
      setTimeout(() => {
        let data = detail.data;
        app.workspace.initFromObject(data);
        setState({ tangram: { ...data.tangram } });
      }, FullHistoryManager.nextTime + 30);
      if (app.fullHistory.numberOfActions + 1 == app.fullHistory.actionIndex)
        setTimeout(() => FullHistoryManager.stopBrowsing(), FullHistoryManager.nextTime)
      return true;
    } else if (type == 'tool-changed' || type == 'tool-updated') {
      setState({ tool: { ...detail } });
    } else if (type == 'settings-changed') {
      FullHistoryManager.nextTime = 1 * 1000;
      setState({ settings: { ...detail } });
    } else if (type == 'objectSelected') {
      SelectManager.selectObject(app.workspace.lastKnownMouseCoordinates);
    } else if (type == 'mouse-coordinates-changed') {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
      window.dispatchEvent(new CustomEvent('show-cursor'));
    } else if (type == 'setNumberOfParts') {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
      window.dispatchEvent(new CustomEvent('close-popup'));
    } else if (type == 'canvasMouseUp') {
      window.dispatchEvent(new CustomEvent(type));
    } else {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }
  }

  static cleanMouseSteps() {
    let isClicked = false;
    for (let i = 0; i < app.fullHistory.steps.length - 1; i++) {
      let { type, _ } = app.fullHistory.steps[i];
      let nextType = app.fullHistory.steps[i + 1].type;

      if (type == 'canvasMouseUp') {
        isClicked = false;
      } else if (type == 'canvasMouseDown') {
        isClicked = true;
      }

      if ((type == 'mouse-coordinates-changed' || type == 'canvasMouseMove') && !isClicked && nextType != 'objectSelected') {
        app.fullHistory.steps.splice(i, 1);
        i--;
      }
    }
  }

  static cleanColorMultiplication() {
    for (let i = 0; i < app.fullHistory.steps.length - 2; i++) {
      let { type, detail } = app.fullHistory.steps[i];
      let nextType = app.fullHistory.steps[i + 1].type;
      let nextNextType = app.fullHistory.steps[i + 2].type;
      let nextNextDetail = app.fullHistory.steps[i + 2].detail;

      if (type == 'tool-updated' && detail.name == 'color' && detail.currentStep == 'listen' && nextType == 'settings-changed' && nextNextType == 'tool-updated' && nextNextDetail.name == 'color' && nextNextDetail.currentStep == 'listen') {
        app.fullHistory.steps.splice(i, 1);
        app.fullHistory.steps.splice(i, 1);
        i--;
      }
    }
  }

  static cleanHisto() {
    FullHistoryManager.cleanColorMultiplication();
    FullHistoryManager.cleanMouseSteps();
  }

  /**
   * @param {String} type  Le type d'event (pas d'office égal à celui de l'event déclencheur)
   * @param {Event}  event L'event déclencheur
   */
  static addStep(type, event) {
    if (app.fullHistory.isRunning) return;
    let detail = { ...event.detail };
    if (type == 'objectSelected') detail.object = undefined;
    if (type == 'add-fullstep') {
      detail.actionIndex = app.fullHistory.steps.filter((step) => {
        return step.type == 'add-fullstep';
      }).length + 1;
      let data = app.workspace.data;
      data.history = undefined;
      data.settings = { ...app.settings };
      data.tangram = { ...app.tangram };
      detail.data = data;
      setState({ stepSinceSave: true });
    } else if (app.fullHistory.steps.length <= 1) {
      detail.actionIndex = app.fullHistory.steps.length;
    } else {
      detail.actionIndex = app.fullHistory.steps.filter((step) => {
        return step.type == 'add-fullstep';
      }).length + 1;
    }
    if ((type == 'tool-changed' || type == 'tool-updated') && (!detail.name || detail.name == 'solveChecker')) {
      return;
    }
    let timeStamp = Date.now() - FullHistoryManager.startTimestamp;
    let steps = [...app.fullHistory.steps, { type, detail, timeStamp }];
    setState({ fullHistory: { ...app.fullHistory, steps } });
  }
}

FullHistoryManager.startTimestamp = Date.now();

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
  FullHistoryManager.addStep('add-fullstep', { detail: event.detail })
);

window.addEventListener('create-silhouette', (event) =>
  FullHistoryManager.addStep('create-silhouette', event),
);

// undo - redo
window.addEventListener('undo', (event) => FullHistoryManager.addStep('undo', event));
window.addEventListener('redo', (event) => FullHistoryManager.addStep('redo', event));

window.addEventListener('close-popup', (event) =>
  FullHistoryManager.addStep('close-popup', event)
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
