import { app } from '../js/App';
import { State } from '../js/States/State';
import { ShapeManager } from '../js/ShapeManager';

/**
 * Tourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class Rotate45State extends State {
  constructor() {
    super('rotate45', 'Tourner', 'move');

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
    let toolName = 'Tourner';
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Touchez une forme, puis glissez votre doigt sans relacher la forme pour la faire tourner. La
        forme tourne autour de son centre, qui est affiché lors de la rotation. Faites tournez votre
        doigt autour de ce centre pour faire tourner la forme.
      </p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, mouseCoordinates) {
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
