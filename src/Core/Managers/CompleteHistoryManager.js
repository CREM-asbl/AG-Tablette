import { app } from '../App';
import { SelectManager } from './SelectManager';
import { HistoryManager } from './HistoryManager';
import { Point } from '../Objects/Point';
import { History } from '../Objects/History';
import { createElem } from '../Tools/general';
import { Coordinates } from '../Objects/Coordinates';

/**
 * Représente l'historique complet d'un espace de travail.
 */
export class CompleteHistoryManager {
  static startBrowse() {
    import('../../completehistory-tools');
    createElem('completehistory-tools');
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('complete-history-steps', {
          detail: { steps: app.workspace.completeHistory.steps },
        })
      );
    }, 300);
    // if called when already running
    window.clearTimeout(app.workspace.completeHistory.timeoutId);

    CompleteHistoryManager.saveHistory = {...app.workspace.history};
    CompleteHistoryManager.isRunning = true;
    CompleteHistoryManager.resetWorkspace();
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

  static resetWorkspace() {
    app.workspace.initFromObject(app.workspace.history.startSituation, true);
    // app.workspace.setZoomLevel(app.workspace.completeHistory.startZoomLevel);
    // app.workspace.setTranslateOffset(
    //   app.workspace.completeHistory.startTranslateOffset
    // );
    // app.workspace.completeHistory.startShapes.map(s =>
    //   new Shape(s)
    // );
    // app.workspace.shapeGroups = app.workspace.completeHistory.startShapeGroups.map(
    //   gr => gr.copy(true)
    // );
    // // if (app.environment.name == 'Tangram')
    // // app.silhouette = app.workspace.completeHistory.startSilhouette?.copy();
    app.workspace.history = new History();
  }

  static moveTo(idx) {
    window.clearTimeout(app.workspace.completeHistory.timeoutId);
    let data = CompleteHistoryManager.saveHistory.data[idx];
    console.log(data);
    app.workspace.initFromObject(data, true);
    console.log(idx, app.workspace.completeHistory.steps);
    app.workspace.completeHistory.historyIndex = app.workspace.completeHistory.steps.findIndex(
      step => step.detail && step.detail.action_idx == idx - 1
    ); // à changer avec tableau de correspondance history_idx -> complete_history_idx

    console.log(app.workspace.completeHistory.historyIndex);

    // if (idx > CompleteHistoryManager.action_idx) {
    //   let toGo = app.workspace.completeHistory.steps.findIndex(
    //     step => step.detail && step.detail.action_idx == idx - 1
    //   );
    //   for (
    //     ;
    //     app.workspace.completeHistory.historyIndex < toGo;
    //     app.workspace.completeHistory.historyIndex++
    //   ) {
    //     CompleteHistoryManager.executeStep();
    //   }
    // } else {
    //   console.log(app.workspace.completeHistory.steps.length);
    //   app.workspace.history.index = CompleteHistoryManager.action_idx - 1;
    //   for (
    //     ;
    //     CompleteHistoryManager.action_idx > idx;
    //     CompleteHistoryManager.action_idx--
    //   ) {
    //     console.log('undo');
    //     HistoryManager.undo();
    //   }
    //   app.workspace.completeHistory.historyIndex =
    //     app.workspace.completeHistory.steps.findIndex(
    //       step => step.detail && step.detail.action_idx == idx - 1
    //     ) + 1;
    //   // setState dans le cas où le state n'a pas changé entre l'action précédente et celle en cours
    // }
    // console.log(app.workspace.completeHistory.steps.length);
    CompleteHistoryManager.executeAllSteps();
  }

  static executeAllSteps() {
    if (
      app.workspace.completeHistory.historyIndex >=
      app.workspace.completeHistory.steps.length - 1
    ) {
      console.log('index :', app.workspace.completeHistory.historyIndex);
      console.log('length :', app.workspace.completeHistory.steps.length);
      CompleteHistoryManager.isRunning = false;
      window.dispatchEvent(new CustomEvent('browsing-finished'));
      return;
    }

    CompleteHistoryManager.executeStep();

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
      CompleteHistoryManager.action_idx++;
    } else if (type == 'app-state-changed') {
      app.setState(detail.state, detail.startParams);
    } else if (type == 'objectSelected') {
      SelectManager.selectObject(app.workspace.lastKnownMouseCoordinates);
    } else if (type == 'mouse-coordinates-changed') {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
      window.dispatchEvent(new CustomEvent('show-cursor'));
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
        return step.detail && step.detail.actions;
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

window.addEventListener('app-state-changed', event =>
  CompleteHistoryManager.addStep('app-state-changed', event)
);

window.addEventListener('reverse-animation', () => {
  CompleteHistoryManager.nextTime = 2 * 1000;
});

window.addEventListener('start-browsing', () => {
  CompleteHistoryManager.startBrowse();
});
