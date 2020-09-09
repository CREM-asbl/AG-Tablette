import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Tourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class Rotate45State extends State {
  constructor() {
    super('rotate45', 'Tourner à 45°', 'move');

    //La forme que l'on déplace
    this.selectedShape = null;

    /*
        L'ensemble des formes liées à la forme sélectionnée, y compris la forme
        elle-même
         */
    this.involvedShapes = [];

    this.handler = event => this._actionHandle(event);
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Tourner à 45°';
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Cliquez sur une forme pour la faire tourner de 45° dans le sens
        horloger.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.mousedown_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.mousedown_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);

    this.actions = [
      {
        name: 'Rotate45Action',
        shapeId: this.selectedShape.id,
        involvedShapesIds: this.involvedShapes.map(s => s.id),
      },
    ];

    this.executeAction();
    this.restart();
    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
