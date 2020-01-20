import { app } from './App';
import { CompleteHistory } from './Objects/CompleteHistory';

/**
 * Représente l'historique d'un espace de travail.
 */
export class CompleteHistoryManager {
  static init() {
    this.isRunning = false;

    window.addEventListener('app-started', e => {
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
      window.addEventListener('setOpacity', event =>
        CompleteHistoryManager.addStep('setOpacity', event),
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

      app.workspace.completeHistory = new CompleteHistory(e.timeStamp);
    });
  }

  static startBrowse() {
    this.isRunning = true;
    app.workspace.shapes = [];
    app.workspace.shapeGroups = [];
    app.workspace.history = [];
    app.workspace.historyIndex = -1;
    app.setState();
    app.workspace.completeHistory.videoStartTimestamp = Date.now();
    app.workspace.completeHistory.currentTimestamp =
      app.workspace.completeHistory.videoStartTimestamp;
    app.workspace.completeHistory.historyIndex = 0;
    CompleteHistoryManager.exectuteNextStep();
  }

  static moveTo() {}

  static exectuteNextStep() {
    if (
      app.workspace.completeHistory.historyIndex >=
      app.workspace.completeHistory.steps.length - 1
    ) {
      console.log('finished');
      this.isRunning = false;
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
