import { app } from '../App';
import { SelectManager } from './SelectManager';
import { History } from '../Objects/History';
import { createElem } from '../Tools/general';
import { Coordinates } from '../Objects/Coordinates';

/**
 * Représente l'historique complet d'un espace de travail.
 */
export class CompleteHistoryManager {
  static startBrowsing() {
    CompleteHistoryManager.isRunning = true;
    import('../../completehistory-tools');
    createElem('completehistory-tools');
    // if called when already running
    window.clearTimeout(app.workspace.completeHistory.timeoutId);

    CompleteHistoryManager.saveHistory = {...app.workspace.history};
    CompleteHistoryManager.setWorkspaceToStartSituation();
    app.setState();
    app.workspace.completeHistory.videoStartTimestamp = Date.now();
    app.workspace.completeHistory.currentTimestamp =
      app.workspace.completeHistory.videoStartTimestamp;
    app.workspace.completeHistory.historyIndex = 0;
    CompleteHistoryManager.executeAllSteps();
    CompleteHistoryManager.nextTime = 0;

    // index de la derniere action effectuée
    CompleteHistoryManager.action_idx = 0;
  }

  static stopBrowsing() {
    window.clearTimeout(app.workspace.completeHistory.timeoutId);
    window.dispatchEvent(new CustomEvent('browsing-finished'));
    CompleteHistoryManager.moveTo(app.workspace.completeHistory.steps.filter(step => step.type == 'actions-executed').length);
    app.workspace.history.initFromObject(CompleteHistoryManager.saveHistory);
    app.setState();
    CompleteHistoryManager.isRunning = false;
  }

  static pauseBrowsing() {
    window.clearTimeout(app.workspace.completeHistory.timeoutId);
  }

  static playBrowsing() {
    app.workspace.completeHistory.timeoutId = setTimeout(
      () => CompleteHistoryManager.executeAllSteps(),
      CompleteHistoryManager.nextTime + 50 // nextTime,
    );
  }

  static setWorkspaceToStartSituation() {
    app.workspace.initFromObject(app.workspace.history.startSituation, true);

    app.workspace.history = new History();
  }

  static moveTo(idx) {
    // window.clearTimeout(app.workspace.completeHistory.timeoutId);
    let data = CompleteHistoryManager.saveHistory.data[idx - 1];
    app.workspace.initFromObject(data, true);
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    app.workspace.completeHistory.historyIndex = app.workspace.completeHistory.steps.findIndex(
      step => step.detail && step.detail.action_idx == idx - 1
    ); // à changer avec tableau de correspondance history_idx -> complete_history_idx ?

    if (app.workspace.completeHistory.historyIndex == -1) {
      app.workspace.completeHistory.historyIndex = 0;
    }

    // CompleteHistoryManager.executeAllSteps();
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
    if (!CompleteHistoryManager.isRunning)
      return;
    app.workspace.completeHistory.historyIndex++;
    app.workspace.completeHistory.currentTimestamp = Date.now();

    // let nextTime =
    //   app.workspace.completeHistory.steps[app.workspace.completeHistory.historyIndex].timestamp -
    //   app.workspace.completeHistory.startTimestamp -
    //   (app.workspace.completeHistory.currentTimestamp -
    //     app.workspace.completeHistory.videoStartTimestamp);

    app.workspace.completeHistory.timeoutId = setTimeout(
      () => CompleteHistoryManager.executeAllSteps(),
      CompleteHistoryManager.nextTime + 50 // nextTime,
    );
    CompleteHistoryManager.nextTime = 0;
  }

  static executeStep(idx = app.workspace.completeHistory.historyIndex) {
    let { type, detail } = app.workspace.completeHistory.steps[idx];
    if (detail && detail.mousePos) {
      detail.mousePos = new Coordinates(detail.mousePos);
    }

    if (type == 'actions-executed') {
      if (detail.name == 'Retourner') {
        CompleteHistoryManager.nextTime = 2 * 1000;
      } else if (detail.name == 'Diviser') {
        CompleteHistoryManager.nextTime = 0.5 * 1000;
      } else if (detail.name == 'Découper') {
        CompleteHistoryManager.nextTime = 0.5 * 1000;
      } else if (detail.name == 'grille') {
        window.dispatchEvent(new CustomEvent('close-popup'));
      }
      console.log('action executed', detail);
      CompleteHistoryManager.action_idx++;
      if (app.workspace.completeHistory.steps.filter(step => step.type == 'actions-executed').length == CompleteHistoryManager.action_idx) {
        CompleteHistoryManager.stopBrowsing();
      }
    } else if (type == 'app-state-changed') {
      app.setState(detail.state, detail.startParams);
    } else if (type == 'objectSelected') {
      SelectManager.selectObject(app.workspace.lastKnownMouseCoordinates);
    } else if (type == 'mouse-coordinates-changed') {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
      window.dispatchEvent(new CustomEvent('show-cursor'));
    } else if (type == 'setNumberOfParts') {
      console.log('event dispatched');
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
      window.dispatchEvent(new CustomEvent('close-popup'));
    } else if (type == 'canvasmouseup') {
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
    let detail = { ...event.detail },
      timeStamp = event.timeStamp;
    if (type == 'objectSelected') detail.object = undefined;
    if (type == 'actions-executed') {
      detail.action_idx = app.workspace.completeHistory.steps.filter(step => {
        return step.type == 'actions-executed';
      }).length;
      // detail.actions = HistoryManager.transformToObjects(detail.actions);
    }
    app.workspace.completeHistory.addStep(type, detail, timeStamp);
  }
}

CompleteHistoryManager.isRunning = false;

// mouse events
window.addEventListener('canvasclick', event =>
  CompleteHistoryManager.addStep('canvasclick', event)
);
window.addEventListener('canvasmousedown', event =>
  CompleteHistoryManager.addStep('canvasmousedown', event)
);
window.addEventListener('canvasmouseup', event =>
  CompleteHistoryManager.addStep('canvasmouseup', event)
);
window.addEventListener('canvasmousemove', event =>
  CompleteHistoryManager.addStep('canvasmousemove', event)
);
window.addEventListener('canvasmousewheel', event =>
  CompleteHistoryManager.addStep('canvasmousewheel', event)
);
window.addEventListener('canvastouchstart', event =>
  CompleteHistoryManager.addStep('canvastouchstart', event)
);
window.addEventListener('canvastouchmove', event =>
  CompleteHistoryManager.addStep('canvastouchmove', event)
);
window.addEventListener('canvastouchend', event =>
  CompleteHistoryManager.addStep('canvastouchend', event)
);
window.addEventListener('canvastouchcancel', event =>
  CompleteHistoryManager.addStep('canvastouchcancel', event)
);
window.addEventListener('objectSelected', event =>
  CompleteHistoryManager.addStep('objectSelected', event)
);

// create events
window.addEventListener('family-selected', event =>
  CompleteHistoryManager.addStep('family-selected', event)
);
window.addEventListener('select-template', event =>
  CompleteHistoryManager.addStep('select-template', event)
);

// divide events
window.addEventListener('setNumberOfParts', event =>
  CompleteHistoryManager.addStep('setNumberOfParts', event)
);

// opacity events
window.addEventListener('setOpacity', event => {
  CompleteHistoryManager.addStep('setOpacity', event);
});

// background- and bordercolor
window.addEventListener('colorChange', event =>
  CompleteHistoryManager.addStep('colorChange', event)
);

// use for animation states
window.addEventListener('mouse-coordinates-changed', event =>
  CompleteHistoryManager.addStep('mouse-coordinates-changed', event)
);

window.addEventListener('actions-executed', event =>
  CompleteHistoryManager.addStep('actions-executed', event)
);

// tangram
// window.addEventListener('state-menu-button-click', event =>
//   CompleteHistoryManager.addStep('state-menu-button-click', event),
// );

window.addEventListener('create-silhouette', event =>
  CompleteHistoryManager.addStep('create-silhouette', event)
);

// undo - redo
window.addEventListener('undo-action', event =>
  CompleteHistoryManager.addStep('undo-action', event)
);
window.addEventListener('redo-action', event =>
  CompleteHistoryManager.addStep('redo-action', event)
);

window.addEventListener('close-popup', event =>
  CompleteHistoryManager.addStep('close-popup', event)
);

window.addEventListener('gridAction', event =>
  CompleteHistoryManager.addStep('gridAction', event)
);

window.addEventListener('app-state-changed', event =>
  CompleteHistoryManager.addStep('app-state-changed', event)
);
window.addEventListener('start-browsing', () => {
  CompleteHistoryManager.startBrowsing();
});
