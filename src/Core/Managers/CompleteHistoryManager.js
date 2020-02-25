import { app } from '../App';
import { SelectManager } from './SelectManager';
import { HistoryManager } from './HistoryManager';
import { Point } from '../Objects/Point';
import { History } from '../Objects/History';

/**
 * Représente l'historique complet d'un espace de travail.
 */
export class CompleteHistoryManager {
  static startBrowse() {
    // if call when already running
    window.clearTimeout(app.workspace.completeHistory.timeoutId);

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
    app.workspace.shapes = app.workspace.completeHistory.startShapes.map(s => s.copy(true));
    app.workspace.shapeGroups = app.workspace.completeHistory.startShapeGroups.map(gr =>
      gr.copy(true),
    );
    app.workspace.history = new History();
  }

  static moveTo(idx) {
    window.clearTimeout(app.workspace.completeHistory.timeoutId);
    if (idx > CompleteHistoryManager.action_idx) {
      let toGo = app.workspace.completeHistory.steps.findIndex(
        step => step.detail && step.detail.action_idx == idx - 1,
      );
      for (
        ;
        app.workspace.completeHistory.historyIndex < toGo;
        app.workspace.completeHistory.historyIndex++
      ) {
        CompleteHistoryManager.executeStep();
      }
    } else {
      app.workspace.history.index = CompleteHistoryManager.action_idx - 1;
      for (; CompleteHistoryManager.action_idx > idx; CompleteHistoryManager.action_idx--) {
        HistoryManager.undo();
      }
      app.workspace.completeHistory.historyIndex =
        app.workspace.completeHistory.steps.findIndex(
          step => step.detail && step.detail.action_idx == idx - 1,
        ) + 1;
      // setState dans le cas où le state n'a pas changé entre l'action précédente et celle en cours
    }
    CompleteHistoryManager.executeAllSteps();
  }

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

  static executeAllSteps() {
    if (
      app.workspace.completeHistory.historyIndex >=
      app.workspace.completeHistory.steps.length - 1
    ) {
      CompleteHistoryManager.isRunning = false;
      console.log('finished');
      window.dispatchEvent(new CustomEvent('browsing-finished'));
      return;
    }

    CompleteHistoryManager.executeStep();

    app.workspace.completeHistory.historyIndex++;
    app.workspace.completeHistory.currentTimestamp = Date.now();
    let nextTime =
      app.workspace.completeHistory.steps[app.workspace.completeHistory.historyIndex].timestamp -
      app.workspace.completeHistory.startTimestamp -
      (app.workspace.completeHistory.currentTimestamp -
        app.workspace.completeHistory.videoStartTimestamp);
    app.workspace.completeHistory.timeoutId = setTimeout(
      () => CompleteHistoryManager.executeAllSteps(),
      CompleteHistoryManager.nextTime + 50, // nextTime,
    );
    CompleteHistoryManager.nextTime = 0;
  }

  static executeStep(idx = app.workspace.completeHistory.historyIndex) {
    let { type, detail } = app.workspace.completeHistory.steps[idx];

    if (detail && detail.mousePos) {
      detail.mousePos = new Point(detail.mousePos);
    }

    if (type == 'actions-executed') {
      CompleteHistoryManager.action_idx++;
    } else if (type == 'app-state-changed') {
      app.setState(detail.state, detail.startParams);
    } else if (type == 'objectSelected') {
      SelectManager.selectObject(app.workspace.lastKnownMouseCoordinates);
    } else if (type == 'mouse-coordinates-changed') {
      window.dispatchEvent(new CustomEvent('show-cursor', { detail: detail }));
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    } else if (type == 'canvasmouseup') {
      window.dispatchEvent(new CustomEvent('click-cursor', { detail: detail }));
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    } else {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }
    // console.log(type, detail);
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
      detail.actions = HistoryManager.transformToObjects(detail.actions);
    }
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
window.addEventListener('setOpacity', event => {
  CompleteHistoryManager.addStep('setOpacity', event);
});

// background- and bordercolor
window.addEventListener('colorChange', event =>
  CompleteHistoryManager.addStep('colorChange', event),
);

// use for animation states
window.addEventListener('mouse-coordinates-changed', event =>
  CompleteHistoryManager.addStep('mouse-coordinates-changed', event),
);

window.addEventListener('actions-executed', event =>
  CompleteHistoryManager.addStep('actions-executed', event),
);

// undo - redo
window.addEventListener('undo-action', event =>
  CompleteHistoryManager.addStep('undo-action', event),
);
window.addEventListener('redo-action', event =>
  CompleteHistoryManager.addStep('redo-action', event),
);

window.addEventListener('close-popup', event =>
  CompleteHistoryManager.addStep('close-popup', event),
);

window.addEventListener('app-state-changed', event =>
  CompleteHistoryManager.addStep('app-state-changed', event),
);

window.addEventListener('reverse-animation', () => {
  CompleteHistoryManager.nextTime = 2 * 1000;
});

window.addEventListener('start-browsing', () => {
  CompleteHistoryManager.startBrowse();
});
