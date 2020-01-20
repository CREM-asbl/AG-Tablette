import { app } from './App';
import { CompleteHistory } from './Objects/CompleteHistory';

/**
 * Représente l'historique d'un espace de travail.
 */
export class CompleteHistoryManager {
  static init() {
    this.isRunning = false;

    window.addEventListener('app-started', e => {
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

      // for create
      window.addEventListener('family-selected', event =>
        CompleteHistoryManager.addStep('family-selected', event),
      );
      window.addEventListener('shape-selected', event =>
        CompleteHistoryManager.addStep('shape-selected', event),
      );

      // for divide
      window.addEventListener('setNumberOfParts', event =>
        CompleteHistoryManager.addStep('setNumberOfParts', event),
      );

      window.addEventListener('app-state-changed', event =>
        CompleteHistoryManager.addStep('app-state-changed', event),
      );

      window.addEventListener('startBrowse', () => CompleteHistoryManager.startBrowse());

      app.workspace.completeHistory = new CompleteHistory(e.timeStamp);
    });
  }

  static startBrowse() {
    app.workspace.shapes = [];
    app.workspace.shapeGroups = [];
    app.workspace.completeHistory.videoStartTimestamp = Date.now();
    app.workspace.completeHistory.currentTimestamp =
      app.workspace.completeHistory.videoStartTimestamp;
    app.workspace.completeHistory.historyIndex = 0;
    this.isRunning = true;
    CompleteHistoryManager.exectuteNextStep();
  }

  static moveTo() {}

  static exectuteNextStep() {
    if (app.workspace.completeHistory.historyIndex >= app.workspace.completeHistory.steps.length) {
      console.log('finished');
      // this.isRunning = false;
      return;
    }
    const { type, detail } = app.workspace.completeHistory.steps[
      app.workspace.completeHistory.historyIndex
    ];

    if (type == 'app-state-changed') {
      app.setState(detail.state, detail.startParams);
    } else {
      window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }

    if (type != 'canvasmousemove') console.log(type, detail);

    app.workspace.completeHistory.historyIndex++;
    app.workspace.completeHistory.currentTimestamp = Date.now();
    let nextTime =
      app.workspace.completeHistory.steps[app.workspace.completeHistory.historyIndex].timestamp -
      app.workspace.completeHistory.startTimestamp -
      (app.workspace.completeHistory.currentTimestamp -
        app.workspace.completeHistory.videoStartTimestamp);
    console.log(nextTime);
    nextTime = 0;
    app.workspace.completeHistory.timeoutId = setTimeout(
      () => CompleteHistoryManager.exectuteNextStep(),
      nextTime,
    );
  }

  /**
   * @param {Event} event L'event déclencheur
   */
  static addStep(type, event) {
    if (!this.isRunning) app.workspace.completeHistory.addStep(type, event);
  }
}
