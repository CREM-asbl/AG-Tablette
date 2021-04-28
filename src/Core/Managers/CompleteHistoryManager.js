import { app, setState } from '../App';
import { SelectManager } from './SelectManager';
import { History } from '../Objects/History';
import { createElem } from '../Tools/general';
import { Coordinates } from '../Objects/Coordinates';

/**
 * Représente l'historique complet d'un espace de travail.
 */
export class CompleteHistoryManager {
  static startBrowsing() {
    let numberOfActions = app.workspace.completeHistory.steps.filter((step) => {
      return step.type == 'add-fullstep'
    }).length;
    if (numberOfActions == 0) {
      window.dispatchEvent(new CustomEvent('show-notif', {detail: {message: 'L\'historique est vide.'}}));
      return;
    }
    CompleteHistoryManager.isRunning = true;
    import('../../completehistory-tools');
    createElem('completehistory-tools');
    // if called when already running
    window.clearTimeout(app.workspace.completeHistory.timeoutId);

    CompleteHistoryManager.saveHistory = {...app.workspace.history};
    CompleteHistoryManager.setWorkspaceToStartSituation();
    setState({ tool: null });
    app.workspace.completeHistory.historyIndex = 0;
    CompleteHistoryManager.executeAllSteps();
    CompleteHistoryManager.nextTime = 0;

    setState({ fullHistory:
      {
        ...app.fullHistory,
        actionIndex: 0,
        numberOfActions: numberOfActions,
      }
    });
  }

  static stopBrowsing() {
    window.clearTimeout(app.workspace.completeHistory.timeoutId);
    window.dispatchEvent(new CustomEvent('browsing-finished'));
    CompleteHistoryManager.moveTo(app.fullHistory.numberOfActions);
    app.workspace.history.initFromObject(CompleteHistoryManager.saveHistory);
    setState({ tool: null });
    CompleteHistoryManager.isRunning = false;
  }

  static pauseBrowsing() {
    window.clearTimeout(app.workspace.completeHistory.timeoutId);
  }

  static playBrowsing() {
    app.workspace.completeHistory.timeoutId = setTimeout(
      () => CompleteHistoryManager.executeAllSteps(),
      CompleteHistoryManager.nextTime + 50, // nextTime,
    );
  }

  static setWorkspaceToStartSituation() {
    setState({ settings: {...app.workspace.history.startSettings} });
    app.workspace.initFromObject(app.workspace.history.startSituation, true);

    app.workspace.history = new History();
  }

  static moveTo(idx) {
    // window.clearTimeout(app.workspace.completeHistory.timeoutId);

    app.workspace.completeHistory.historyIndex = app.workspace.completeHistory.steps.findIndex(
      (step) => step.detail && step.detail.actionIndex == idx - 1,
    );

    if (app.workspace.completeHistory.historyIndex == -1) {
      app.workspace.completeHistory.historyIndex = 0;
    }

    let data = app.workspace.completeHistory.steps[app.workspace.completeHistory.historyIndex].data;
    app.workspace.initFromObject({...data}, true);
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));

    setState({ fullHistory: { ...app.fullHistory, actionIndex: idx - 1 } });
  }

  static executeAllSteps() {
    if (
      app.workspace.completeHistory.historyIndex >=
      app.workspace.completeHistory.steps.length - 1
    ) {
      CompleteHistoryManager.stopBrowsing();
      return;
    }

    CompleteHistoryManager.executeStep();
    if (!CompleteHistoryManager.isRunning) return;
    app.workspace.completeHistory.historyIndex++;

    app.workspace.completeHistory.timeoutId = setTimeout(
      () => CompleteHistoryManager.executeAllSteps(),
      CompleteHistoryManager.nextTime + 50, // nextTime,
    );
    CompleteHistoryManager.nextTime = 0;
  }

  static executeStep(idx = app.workspace.completeHistory.historyIndex) {
    let { type, detail } = app.workspace.completeHistory.steps[idx];
    if (detail && detail.mousePos) {
      detail.mousePos = new Coordinates(detail.mousePos);
    }

    if (type == 'add-fullstep') {
      if (detail.name == 'Retourner') {
        CompleteHistoryManager.nextTime = 2 * 1000;
      } else if (detail.name == 'Diviser') {
        CompleteHistoryManager.nextTime = 0.5 * 1000;
      } else if (detail.name == 'Découper') {
        CompleteHistoryManager.nextTime = 0.5 * 1000;
      }
      setState({ fullHistory: { ...app.fullHistory, actionIndex: app.fullHistory.actionIndex + 1 } });
      if (app.fullHistory.numberOfActions == app.fullHistory.actionIndex)
        setTimeout(() => CompleteHistoryManager.stopBrowsing(), CompleteHistoryManager.nextTime);
    } else if (type == 'tool-changed') {
      setState({ tool: {...detail} });
      if (['divide', 'opacity', 'grid'].includes(app.tool.name) && app.tool.currentStep == 'start') {
        window.dispatchEvent(new CustomEvent('close-popup'));
      }
    } else if (type == 'settings-changed') {
      setState({ settings: {...detail} });
    } else if (type == 'objectSelected') {
      SelectManager.selectObject(app.workspace.lastKnownMouseCoordinates);
    } else if (type == 'mouse-coordinates-changed') {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
      window.dispatchEvent(new CustomEvent('show-cursor'));
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
    if (CompleteHistoryManager.isRunning) return;
    let detail = { ...event.detail };
    if (type == 'objectSelected') detail.object = undefined;
    if (type == 'add-fullstep') {
      detail.actionIndex = app.workspace.completeHistory.steps.filter((step) => {
        return step.type == 'add-fullstep';
      }).length;
      // detail.actions = HistoryManager.transformToObjects(detail.actions);
    }
    app.workspace.completeHistory.addStep(type, detail);
  }
}

CompleteHistoryManager.isRunning = false;

// mouse events
window.addEventListener('canvasclick', (event) =>
  CompleteHistoryManager.addStep('canvasclick', event),
);
window.addEventListener('canvasMouseDown', (event) =>
  CompleteHistoryManager.addStep('canvasMouseDown', event),
);
window.addEventListener('canvasMouseUp', (event) =>
  CompleteHistoryManager.addStep('canvasMouseUp', event),
);
window.addEventListener('canvasMouseMove', (event) =>
  CompleteHistoryManager.addStep('canvasMouseMove', event),
);
window.addEventListener('canvasMouseWheel', (event) =>
  CompleteHistoryManager.addStep('canvasMouseWheel', event),
);
window.addEventListener('canvasTouchStart', (event) =>
  CompleteHistoryManager.addStep('canvasTouchStart', event),
);
window.addEventListener('canvasTouchMove', (event) =>
  CompleteHistoryManager.addStep('canvasTouchMove', event),
);
window.addEventListener('canvasTouchEnd', (event) =>
  CompleteHistoryManager.addStep('canvasTouchEnd', event),
);
window.addEventListener('canvastouchcancel', (event) =>
  CompleteHistoryManager.addStep('canvastouchcancel', event),
);
window.addEventListener('objectSelected', (event) =>
  CompleteHistoryManager.addStep('objectSelected', event),
);

// create events
// window.addEventListener('family-selected', event =>
//   CompleteHistoryManager.addStep('family-selected', event)
// );
// window.addEventListener('select-template', event =>
//   CompleteHistoryManager.addStep('select-template', event)
// );

// divide events
window.addEventListener('setNumberOfParts', (event) =>
  CompleteHistoryManager.addStep('setNumberOfParts', event),
);

// opacity events
window.addEventListener('setOpacity', (event) => {
  CompleteHistoryManager.addStep('setOpacity', event);
});

// background- and bordercolor
window.addEventListener('colorChange', (event) =>
  CompleteHistoryManager.addStep('colorChange', event),
);

// use for animation states
window.addEventListener('mouse-coordinates-changed', (event) =>
  CompleteHistoryManager.addStep('mouse-coordinates-changed', event),
);

window.addEventListener('actions-executed', (event) =>
  window.dispatchEvent(
    new CustomEvent('add-fullstep', {
      detail: { name: event.detail.name },
    }),
  )
);

// tangram
// window.addEventListener('state-menu-button-click', event =>
//   CompleteHistoryManager.addStep('state-menu-button-click', event),
// );

window.addEventListener('create-silhouette', (event) =>
  CompleteHistoryManager.addStep('create-silhouette', event),
);

// undo - redo
window.addEventListener('undo', (event) =>
  CompleteHistoryManager.addStep('undo', event),
);
window.addEventListener('redo', (event) => {
  CompleteHistoryManager.addStep('redo', event)
}
);

// window.addEventListener('close-popup', (event) =>
//   CompleteHistoryManager.addStep('close-popup', event),
// );

window.addEventListener('tool-changed', () => {
  CompleteHistoryManager.addStep('tool-changed', { detail: app.tool });
});
window.addEventListener('settings-changed', () => {
  CompleteHistoryManager.addStep('settings-changed', { detail: app.settings });
});

window.addEventListener('add-fullstep', event => {
  CompleteHistoryManager.addStep('add-fullstep', event);
});

window.addEventListener('start-browsing', () => {
  CompleteHistoryManager.startBrowsing();
});
