import { StatesManager } from '../StatesManager';
import { app } from '../App';

/**
 * Représente une étape d'execution de l'historique complet
 */
export class HistoryStep {
  constructor(type, timestamp = 0) {
    // event, formChange, selection
    this.type = type;

    // timestamp of the step
    this.timestamp = timestamp;
  }

  saveToObject() {
    let save = {
      type: this.type,
      timestamp: this.timestamp,
    };
    return save;
  }

  initFromObject(save) {
    this.type = save.type;
    this.timestamp = save.timestamp;
  }

  execute() {
    throw new TypeError('method not implemented');
  }
}

export class SelectionStep extends HistoryStep {
  constructor(data, timestamp) {
    super('selection', timestamp);

    this.data = data;
  }
}

export class EventStep extends HistoryStep {
  constructor(data, timestamp) {
    super('event', timestamp);

    this.data = data;
  }
}

export class FormChangeStep extends HistoryStep {
  constructor(data, timestamp) {
    super('formChange', timestamp);

    this.data = data;
  }
}
