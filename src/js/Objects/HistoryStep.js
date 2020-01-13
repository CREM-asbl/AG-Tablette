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
    throw new TypeError('method not implemented');
  }

  initFromObject(save) {
    throw new TypeError('method not implemented');
  }

  static getInstanceFromJson(save) {
    let newStep;
    if (save.type == 'selection') {
      newStep = new SelectionStep();
    } else if (save.type == 'event') {
      newStep = new EventStep();
    } else if (save.type == 'formChange') {
      newStep = new FormChangeStep();
    } else {
      console.log('unknown step type : ', save.type);
    }
    newStep.initFromObject(save);
    return newStep;
  }

  execute() {
    throw new TypeError('method not implemented');
  }
}

export class SelectionStep extends HistoryStep {
  constructor(data, timestamp) {
    super('selection', timestamp);

    this.element = data;
  }

  execute() {
    this.element.click();
  }

  saveToObject() {
    let save = {
      type: this.type,
      timestamp: this.timestamp,
      element: this.element,
    };
    return save;
  }

  initFromObject(save) {
    this.type = save.type;
    this.timestamp = save.timestamp;
    this.element = save.element;
  }
}

export class EventStep extends HistoryStep {
  constructor(data, timestamp) {
    super('event', timestamp);

    this.data = data;
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
    console.trace();
  }
}

export class FormChangeStep extends HistoryStep {
  constructor(data, timestamp) {
    super('formChange', timestamp);

    this.data = data;
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
    console.trace();
  }
}
