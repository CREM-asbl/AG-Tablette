import { app, setState } from '../App';
import { SelectManager } from './SelectManager';
import { History } from '../Objects/History';
import { createElem } from '../Tools/general';
import { Coordinates } from '../Objects/Coordinates';

/**
 * Représente l'historique complet d'un espace de travail.
 */
export class FullHistoryManager {
  static startBrowsing() {
    let numberOfActions = app.fullHistory.steps.filter((step) => {
      return step.type == 'add-fullstep'
    }).length;
    if (numberOfActions == 0) {
      window.dispatchEvent(new CustomEvent('show-notif', {detail: {message: 'L\'historique est vide.'}}));
      return;
    }
    import('../../fullhistory-tools');
    createElem('fullhistory-tools');
    // if called when already running
    window.clearTimeout(app.fullHistory.timeoutId);

    FullHistoryManager.saveHistory = {...app.workspace.history};
    FullHistoryManager.setWorkspaceToStartSituation();
    setState({
      tool: null,
      fullHistory: {
        ...app.fullHistory,
        index: 0,
        actionIndex: 0,
        numberOfActions: numberOfActions,
        isRunning: true,
      }
    });

    FullHistoryManager.executeAllSteps();
    FullHistoryManager.nextTime = 0;
  }

  static stopBrowsing() {
    window.clearTimeout(app.fullHistory.timeoutId);
    window.dispatchEvent(new CustomEvent('browsing-finished'));
    FullHistoryManager.moveTo(app.fullHistory.numberOfActions);
    app.workspace.history.initFromObject(FullHistoryManager.saveHistory);
    setState({
      tool: null,
      fullHistory: {
        ...app.fullHistory,
        isRunning: false,
      }
    });
  }

  static pauseBrowsing() {
    window.clearTimeout(app.fullHistory.timeoutId);
  }

  static playBrowsing() {
    let timeoutId = setTimeout(
      () => FullHistoryManager.executeAllSteps(),
      FullHistoryManager.nextTime + 50,
    )
    setState({ fullHistory:
      {
        ...app.fullHistory,
        timeoutId,
      }
    });
  }

  static setWorkspaceToStartSituation() {
    setState({ settings: {...app.workspace.history.startSettings} });
    app.workspace.initFromObject(app.workspace.history.startSituation, true);

    app.workspace.history = new History();
  }

  static moveTo(actionIndex) {
    // window.clearTimeout(app.workspace.FullHistory.timeoutId);

    let index = app.fullHistory.steps.findIndex(
      (step) => step.detail?.actionIndex === actionIndex - 1,
    );

    let data = app.fullHistory.steps[index]?.detail.data;
    if (data) {
      app.workspace.initFromObject({...data}, true);
    } else {
      FullHistoryManager.setWorkspaceToStartSituation();
    }
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));

    index++;

    setState({ fullHistory: { ...app.fullHistory, actionIndex, index } });
  }

  static executeAllSteps() {
    if (
      app.fullHistory.index >=
      app.fullHistory.steps.length - 1
    ) {
      FullHistoryManager.stopBrowsing();
      return;
    }

    FullHistoryManager.executeStep();
    if (!app.fullHistory.isRunning) return;

    let index = app.fullHistory.index + 1;
    let timeoutId = setTimeout(
      () => FullHistoryManager.executeAllSteps(),
      FullHistoryManager.nextTime + 50, // nextTime,
    )
    setState({ fullHistory: { ...app.fullHistory, index, timeoutId } });

    FullHistoryManager.nextTime = 0;
  }

  static executeStep(index = app.fullHistory.index) {
    let { type, detail } = app.fullHistory.steps[index];
    if (detail && detail.mousePos) {
      detail.mousePos = new Coordinates(detail.mousePos);
    }

    if (type == 'add-fullstep') {
      if (detail.name == 'Retourner') {
        FullHistoryManager.nextTime = 2 * 1000;
      } else if (detail.name == 'Diviser') {
        FullHistoryManager.nextTime = 0.5 * 1000;
      } else if (detail.name == 'Découper') {
        FullHistoryManager.nextTime = 0.5 * 1000;
      }
      console.log('add-fullstep actionIndex', app.fullHistory.actionIndex + 1);
      setState({ fullHistory: { ...app.fullHistory, actionIndex: app.fullHistory.actionIndex + 1 } });
      if (app.fullHistory.numberOfActions == app.fullHistory.actionIndex)
        setTimeout(() => FullHistoryManager.stopBrowsing(), FullHistoryManager.nextTime);
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
    if (app.fullHistory.isRunning) return;
    let detail = { ...event.detail };
    if (type == 'objectSelected') detail.object = undefined;
    if (type == 'add-fullstep') {
      detail.index = app.fullHistory.steps.filter((step) => {
        return step.type == 'add-fullstep';
      }).length;
      let data = app.workspace.data;
      data.history = undefined;
      data.settings = {...app.settings};
      detail.data = data;
    }
    let steps = [...app.fullHistory.steps, {type, detail}];
    setState({ fullHistory: { ...app.fullHistory, steps } });
  }
}

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

// divide events
window.addEventListener('setNumberOfParts', (event) =>
  FullHistoryManager.addStep('setNumberOfParts', event),
);

// opacity events
window.addEventListener('setOpacity', (event) => {
  FullHistoryManager.addStep('setOpacity', event);
});

// background- and bordercolor
window.addEventListener('colorChange', (event) =>
  FullHistoryManager.addStep('colorChange', event),
);

// use for animation states
window.addEventListener('mouse-coordinates-changed', (event) =>
  FullHistoryManager.addStep('mouse-coordinates-changed', event),
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
  FullHistoryManager.addStep('redo', event)
}
);

// window.addEventListener('close-popup', (event) =>
//   FullHistoryManager.addStep('close-popup', event),
// );

window.addEventListener('tool-changed', () => {
  FullHistoryManager.addStep('tool-changed', { detail: app.tool });
});
window.addEventListener('settings-changed', () => {
  FullHistoryManager.addStep('settings-changed', { detail: app.settings });
});

window.addEventListener('add-fullstep', event => {
  FullHistoryManager.addStep('add-fullstep', event);
});

window.addEventListener('start-browsing', () => {
  FullHistoryManager.startBrowsing();
});
