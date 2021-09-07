import { app, setState } from '../App';
import { SelectManager } from './SelectManager';
import { createElem } from '../Tools/general';
import { Coordinates } from '../Objects/Coordinates';

/**
 * Représente l'historique complet d'un espace de travail.
 */
export class FullHistoryManager {
  static startBrowsing() {
    let numberOfActions = app.fullHistory.steps.filter((step) => {
      return step.type == 'add-fullstep';
    }).length;
    if (numberOfActions == 0) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: "L'historique est vide." },
        }),
      );
      return;
    }
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
      },
    });
    FullHistoryManager.saveHistory = { ...app.history };
    FullHistoryManager.setWorkspaceToStartSituation();

    FullHistoryManager.isClicked = false;
    FullHistoryManager.nextTime = 0;
    // FullHistoryManager.executeAllSteps();
  }

  static stopBrowsing() {
    window.clearTimeout(app.fullHistory.timeoutId);
    FullHistoryManager.moveTo(app.fullHistory.numberOfActions, false);
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
    window.clearTimeout(app.fullHistory.timeoutId);
  }

  static playBrowsing() {
    let timeoutId = setTimeout(
      () => FullHistoryManager.executeAllSteps(),
      FullHistoryManager.nextTime + 50,
    );
    setState({
      fullHistory: {
        ...app.fullHistory,
        timeoutId,
      },
    });
  }

  static setWorkspaceToStartSituation() {
    setState({
      settings: { ...app.history.startSettings },
      history: { ...app.defaultState.history },
    });
    app.workspace.initFromObject(app.history.startSituation);
  }

  static moveTo(actionIndex, startSelectedTool = true) {
    FullHistoryManager.pauseBrowsing();

    let index = app.fullHistory.steps.findIndex(
      (step) => step.detail?.actionIndex === actionIndex - 1,
      );

    let data = app.fullHistory.steps[index]?.detail.data;
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
    index++;
    setState({ fullHistory: { ...app.fullHistory, actionIndex, index }, tool: undefined });

    app.upperDrawingEnvironment.removeAllObjects(); // temporary patch
    app.upperDrawingEnvironment.redraw(); // temporary patch

    if (startSelectedTool) {
      let tool = null;
      for (let i = index; i > 0; i--) {
        if (app.fullHistory.steps[i].type == 'tool-changed') {
          let toolInfo = app.fullHistory.steps[i].detail;
          let currentStep = 'start';
          if (toolInfo.name == 'divide' || toolInfo.name == 'opacity') {
            currentStep = 'selectObject';
          }
          tool = { ...toolInfo, currentStep: 'start' };
          break;
        }
      }
      setState({ tool });
    }
  }

  static executeAllSteps() {
    if (app.fullHistory.index >= app.fullHistory.steps.length - 1) {
      FullHistoryManager.stopBrowsing();
      return;
    }

    FullHistoryManager.executeStep();
    if (!app.fullHistory.isRunning) return;

    let index = app.fullHistory.index + 1;
    let timeoutId = setTimeout(
      () => FullHistoryManager.executeAllSteps(),
      FullHistoryManager.nextTime + 50, // nextTime,
    );
    setState({ fullHistory: { ...app.fullHistory, index, timeoutId } });

    FullHistoryManager.nextTime = 0;
  }

  static executeStep(index = app.fullHistory.index) {
    let { type, detail } = app.fullHistory.steps[index];
    if (detail && detail.mousePos) {
      detail.mousePos = new Coordinates(detail.mousePos);
    }

    let nextType = app.fullHistory.steps[index + 1].type;

    if (type == 'canvasMouseUp') {
      FullHistoryManager.isClicked = false;
    } else if (type == 'canvasMouseDown') {
      FullHistoryManager.isClicked = true;
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
        setState({
          fullHistory: {
            ...app.fullHistory,
            actionIndex: app.fullHistory.actionIndex + 1,
          },
        });
      }, FullHistoryManager.nextTime + 30);
      if (app.fullHistory.numberOfActions == app.fullHistory.actionIndex)
        setTimeout(
          () => FullHistoryManager.stopBrowsing(),
          FullHistoryManager.nextTime,
        );
    } else if (type == 'tool-changed') {
      setState({ tool: { ...detail } });
    } else if (type == 'settings-changed') {
      FullHistoryManager.nextTime = 1 * 1000;
      setState({ settings: { ...detail } });
    } else if (type == 'objectSelected') {
      SelectManager.selectObject(app.workspace.lastKnownMouseCoordinates);
    } else if (type == 'mouse-coordinates-changed') {
      if (FullHistoryManager.isClicked || nextType == 'objectSelected') {
        window.dispatchEvent(new CustomEvent(type, { detail: detail }));
        window.dispatchEvent(new CustomEvent('show-cursor'));
      } else {
        FullHistoryManager.nextTime = -50;
      }
    } else if (type == 'setNumberOfParts') {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
      window.dispatchEvent(new CustomEvent('close-popup'));
    } else if (type == 'canvasMouseUp') {
      // window.dispatchEvent(new CustomEvent('click-cursor', { detail: detail }));
      window.dispatchEvent(new CustomEvent(type));
    } else {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }
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
      }).length;
      let data = app.workspace.data;
      data.history = undefined;
      data.settings = { ...app.settings };
      detail.data = data;
      setState({ stepSinceSave: true });
    }
    let timeStamp = Date.now() - FullHistoryManager.startTimestamp;
    let steps = [...app.fullHistory.steps, { type, detail, timeStamp }];
    setState({ fullHistory: { ...app.fullHistory, steps } });
  }
}

FullHistoryManager.startTimestamp = Date.now();

// mouse events
window.addEventListener('canvasclick', (event) =>
  FullHistoryManager.addStep('canvasclick', event),
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

// create events
// window.addEventListener('family-selected', event =>
//   FullHistoryManager.addStep('family-selected', event)
// );
// window.addEventListener('select-template', event =>
//   FullHistoryManager.addStep('select-template', event)
// );

// use for animation states
window.addEventListener('mouse-coordinates-changed', (event) =>
  FullHistoryManager.addStep('mouse-coordinates-changed', event),
);

window.addEventListener('actions-executed', (event) =>
  window.dispatchEvent(
    new CustomEvent('add-fullstep', {
      detail: { name: event.detail.name },
    }),
  ),
);

// tangram
// window.addEventListener('state-menu-button-click', event =>
//   FullHistoryManager.addStep('state-menu-button-click', event),
// );

window.addEventListener('create-silhouette', (event) =>
  FullHistoryManager.addStep('create-silhouette', event),
);

// undo - redo
window.addEventListener('undo', (event) =>
  FullHistoryManager.addStep('undo', event),
);
window.addEventListener('redo', (event) => {
  FullHistoryManager.addStep('redo', event);
});

window.addEventListener('close-popup', (event) =>
  FullHistoryManager.addStep('close-popup', event)
);

window.addEventListener('tool-changed', () => {
  FullHistoryManager.addStep('tool-changed', { detail: app.tool });
});
window.addEventListener('settings-changed', () => {
  FullHistoryManager.addStep('settings-changed', { detail: app.settings });
});

window.addEventListener('add-fullstep', (event) => {
  FullHistoryManager.addStep('add-fullstep', event);
});

window.addEventListener('start-browsing', () => {
  FullHistoryManager.startBrowsing();
});
