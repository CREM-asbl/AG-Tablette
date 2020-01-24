import { app } from './App';
import { CompleteHistory } from './Objects/CompleteHistory';
import { History } from './Objects/History';
import { Shape } from './Objects/Shape';
import { Segment } from './Objects/Segment';
import { Point } from './Objects/Point';
import { SelectManager } from './SelectManager';

/**
 * Représente l'historique complet d'un espace de travail.
 */
export class CompleteHistoryManager {
  static startBrowse() {
    CompleteHistoryManager.isRunning = true;
    app.workspace.shapes = [];
    app.workspace.shapeGroups = [];
    app.workspace.history = new History();
    app.setState();
    app.workspace.completeHistory.videoStartTimestamp = Date.now();
    app.workspace.completeHistory.currentTimestamp =
      app.workspace.completeHistory.videoStartTimestamp;
    app.workspace.completeHistory.historyIndex = 0;
    CompleteHistoryManager.exectuteNextStep();
  }

  static moveTo() {}

  // static createNewObject(detail) {
  //   if (!detail)
  //     return;
  //   let savedDetail = {};
  //   for (let [key, value] of Object.entries(detail)) {
  //     if (value instanceof Shape) {
  //       let newObj = new Shape(new Point(0, 0), []);
  //       newObj.initFromObject(value);
  //       value = newObj;
  //     }
  //     else if (value instanceof Segment) {
  //       let newObj = new Segment();
  //       newObj.initFromObject(value);
  //       value = newObj;
  //     }
  //     else if (value instanceof Point) {
  //       let newObj = new Point();
  //       newObj.initFromObject(value);
  //       value = newObj;
  //     }
  //     else if (value instanceof Array)
  //       value = value.map(elem => {
  //         if (elem instanceof Shape) {
  //           let newObj = new Shape(new Point(0, 0), []);
  //           newObj.initFromObject(elem);
  //           elem = newObj;
  //         }
  //         else if (elem instanceof Segment) {
  //           let newObj = new Segment();
  //           newObj.initFromObject(elem);
  //           elem = newObj;
  //         }
  //         else if (elem instanceof Point) {
  //           let newObj = new Point();
  //           newObj.initFromObject(elem);
  //           elem = newObj;
  //         }
  //         else return elem;
  //       });
  //     savedDetail[key] = value;
  //   }
  //   return savedDetail;
  // }

  static exectuteNextStep() {
    if (
      app.workspace.completeHistory.historyIndex >=
      app.workspace.completeHistory.steps.length - 1
    ) {
      CompleteHistoryManager.isRunning = false;
      console.log('finished');
      return;
    }
    let { type, detail } = app.workspace.completeHistory.steps[
      app.workspace.completeHistory.historyIndex
    ];

    if (type == 'app-state-changed') {
      app.setState(detail.state, detail.startParams);
    } else if (type == 'objectSelected') {
      SelectManager.selectObject(app.workspace.lastKnownMouseCoordinates);
    } else {
      if (detail && detail.mousePos) {
        detail.mousePos = new Point(detail.mousePos);
      }
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }

    if (type != 'canvasmousemove' && type != 'mouse-coordinates-changed') console.log(type, detail);

    app.workspace.completeHistory.historyIndex++;
    app.workspace.completeHistory.currentTimestamp = Date.now();
    let nextTime =
      app.workspace.completeHistory.steps[app.workspace.completeHistory.historyIndex].timestamp -
      (app.workspace.completeHistory.currentTimestamp -
        app.workspace.completeHistory.videoStartTimestamp);
    app.workspace.completeHistory.timeoutId = setTimeout(
      () => CompleteHistoryManager.exectuteNextStep(),
      nextTime,
    );
  }

  /**
   * @param {Event} event L'event déclencheur
   */
  static addStep(type, event) {
    if (CompleteHistoryManager.isRunning) return;
    let detail = event.detail,
      timeStamp = event.timeStamp;
    app.workspace.completeHistory.addStep(type, detail, timeStamp);
  }
}

CompleteHistoryManager.isRunning = false;

// mouse events
window.addEventListener('canvasclick', event =>
  CompleteHistoryManager.addStep('canvasclick', event),
);
window.addEventListener('canvasmousedown', event =>
  CompleteHistoryManager.addStep('canvasmousedown', event),
);
window.addEventListener('canvasmouseup', event =>
  CompleteHistoryManager.addStep('canvasmouseup', event),
);
window.addEventListener('canvasmousemove', event =>
  CompleteHistoryManager.addStep('canvasmousemove', event),
);
window.addEventListener('canvastouchstart', event =>
  CompleteHistoryManager.addStep('canvastouchstart', event),
);
window.addEventListener('canvastouchmove', event =>
  CompleteHistoryManager.addStep('canvastouchmove', event),
);
window.addEventListener('canvastouchend', event =>
  CompleteHistoryManager.addStep('canvastouchend', event),
);
window.addEventListener('canvastouchcancel', event =>
  CompleteHistoryManager.addStep('canvastouchcancel', event),
);
window.addEventListener('objectSelected', event =>
  CompleteHistoryManager.addStep('objectSelected', event),
);

// create events
window.addEventListener('family-selected', event =>
  CompleteHistoryManager.addStep('family-selected', event),
);
window.addEventListener('shape-selected', event =>
  CompleteHistoryManager.addStep('shape-selected', event),
);

// divide events
window.addEventListener('setNumberOfParts', event =>
  CompleteHistoryManager.addStep('setNumberOfParts', event),
);

// opacity events
window.addEventListener('setOpacity', event => CompleteHistoryManager.addStep('setOpacity', event));

// use for animation states
window.addEventListener('mouse-coordinates-changed', event =>
  CompleteHistoryManager.addStep('mouse-coordinates-changed', event),
);

// undo - redo
window.addEventListener('undo-action', event =>
  CompleteHistoryManager.addStep('undo-action', event),
);
window.addEventListener('redo-action', event =>
  CompleteHistoryManager.addStep('redo-action', event),
);

window.addEventListener('app-state-changed', event =>
  CompleteHistoryManager.addStep('app-state-changed', event),
);

window.addEventListener('startBrowse', () => CompleteHistoryManager.startBrowse());
