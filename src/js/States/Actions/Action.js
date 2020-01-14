import { State } from '../State';

export class Action {
  constructor(name) {
    if (this.constructor === State) {
      throw new TypeError('Abstract class "Action" cannot be instantiated directly');
    }

    this.name = name;

    this.initAndDo = event => {
      this.initFromObject(event.detail);
      this.do();
    };

    this.initAndUndo = event => {
      this.initFromObject(event.detail);
      this.undo();
    };

    window.addEventListener('app-started', () => {
      window.addEventListener(this.name, this.initAndDo);
      window.addEventListener('do-' + this.name, this.initAndDo);
      window.addEventListener('undo-' + this.name, this.initAndUndo);
      // window.addEventListener('new-env', () => this.removeEventListeners());
    });
  }

  removeEventListeners() {
    console.log(this.name, this.initAndDo);
    window.removeEventListener(this.name, this.initAndDo);
    window.removeEventListener('do-' + this.name, this.initAndDo);
    window.removeEventListener('undo-' + this.name, this.initAndUndo);
  }

  saveToObject() {
    throw new TypeError('method not implemented');
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
