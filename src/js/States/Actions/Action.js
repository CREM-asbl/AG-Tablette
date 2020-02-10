import { State } from '../State';
import { app } from '../../App';

export class Action {
  constructor(name) {
    if (this.constructor === State) {
      throw new TypeError('Abstract class "Action" cannot be instantiated directly');
    }

    this.name = name;

    app.actions = { ...app.actions, [name]: name };

    this.initAndDo = event => {
      this.initFromObject(event.detail);
      this.do();
    };

    this.initAndUndo = event => {
      this.initFromObject(event.detail);
      this.undo();
    };

    window.addEventListener(this.name, this.initAndDo);
    window.addEventListener('do-' + this.name, this.initAndDo);
    window.addEventListener('undo-' + this.name, this.initAndUndo);
  }

  printIncompleteData() {
    this.printIncompleteData();
  }

  initFromObject(save) {
    throw new TypeError('method not implemented');
  }

  checkDoParameters() {
    throw new TypeError('method not implemented');
  }

  checkUndoParameters() {
    throw new TypeError('method not implemented');
  }

  do() {
    throw new TypeError('method not implemented');
  }

  undo() {
    throw new TypeError('method not implemented');
  }
}
