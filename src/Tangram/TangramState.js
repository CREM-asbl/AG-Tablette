import { State } from '../Core/States/State';
import { TangramManager } from './TangramManager';

/**
 * Créer un tangram
 */
export class TangramState extends State {
  constructor() {
    super('tangram', 'Faire un tangram', 'tool');
  }

  /**
   * initialiser l'état
   */
  start() {
    TangramManager.showPopup();
  }

  restart() {
    TangramManager.showPopup();
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {}
}
