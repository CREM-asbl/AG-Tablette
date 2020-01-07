import { app } from '../App';
import { HistoryStep } from './HistoryStep';

/**
 * Représente l'historique d'un espace de travail.
 */
export class CompleteHistory {
  constructor() {
    // Historique des actions
    this.steps = [];

    // index de la prochaine action à effectuer
    this.historyIndex = null;

    // timestamp courant
    this.currentTimestamp = null;

    // start of the video
    this.videoStartTimestamp = null;

    // workspace open timestamp
    this.startTimestamp = null;

    // workspace close timestamp
    this.endTimestamp = null;

    // timeout id for cancelling
    this.timeoutId = null;
  }

  saveToObject() {
    let save = {
      // historyIndex: this.historyIndex,
      steps: this.steps.map(step => step.saveToObject()),
      startTimestamp: this.startTimestamp,
      endTimestamp: Date.now(), //this.endTimestamp,
    };
    return save;
  }

  initFromObject(object) {
    // this.historyIndex = object.historyIndex;
    this.steps = object.steps.map(step => {
      let newStep = new HistoryStep();
      newStep.initFromObject(step);
      return newStep;
    });
    this.startTimestamp = object.startTimestamp;
    this.endTimestamp = object.endTimestamp;
  }

  startBrowse() {
    this.videoStartTimestamp = Date.now();
    this.currentTimestamp = this.videoStartTimestamp;
    this.historyIndex = 0;
  }

  moveTo() {}

  exectuteNextStep() {
    this.steps[this.historyIndex].execute();

    this.historyIndex++;
    this.currentTimestamp = Date.now();
    let nextTime =
      this.steps[this.historyIndex].timestamp -
      this.startTimestamp -
      (this.currentTimestamp - this.videoStartTimestamp);
    this.timeoutId = setTimeout(() => this.exectuteNextStep(), nextTime);
  }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   */
  addStep(data, type) {
    let timestamp = Date.now(),
      newStep;
    if (type == 'selection') newStep = new SelectionStep(data, timestamp);
    else if (type == 'event') newStep = new EventStep(data, timestamp);
    else if (type == 'formChange') newStep = new FormChangeStep(data, timestamp);
    else console.log('unknown step type : ', type);
    this.steps.push(newStep);
  }
}
