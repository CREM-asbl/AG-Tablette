import { State } from './State';
import { app } from '../App';

export class Action {
  constructor(name) {
    if (this.constructor === State) {
      throw new TypeError(
        'Abstract class "Action" cannot be instantiated directly'
      );
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
    console.log('Incomplete data for ', this.name, ', with object ', this);
  }

  initFromObject(save) {
    throw new TypeError('method not implemented');
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    throw new TypeError('method not implemented');
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    throw new TypeError('method not implemented');
  }

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
  do() {
    throw new TypeError('method not implemented');
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    throw new TypeError('method not implemented');
  }
}
