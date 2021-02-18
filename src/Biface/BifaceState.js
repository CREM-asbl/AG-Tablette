import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Text } from '../Core/Objects/Text';

/**
 * Rendre une shape biface
 */
export class BifaceState extends State {
  constructor() {
    super('biface', 'Rendre biface', 'tool');
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Une fois sélectionné, un texte "biface" apparaît sur les formes étant
        bifaces.<br />
        Touchez une forme pour qu'elle devienne biface, et touchez une seconde
        fois pour annuler.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    app.mainDrawingEnvironment.shapes.map(s => {
      if (s.isBiface) {
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: s.centerCoordinates,
          referenceId: s.id,
          message: 'Biface',
          type: 'biface',
        });
      }
    });
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    app.mainDrawingEnvironment.shapes.map(s => {
      if (s.isBiface) {
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: s.centerCoordinates,
          referenceId: s.id,
          message: 'Biface',
          type: 'biface',
        });
      }
    });
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    let involvedShapes = ShapeManager.getAllBindedShapes(shape, true);

    this.actions = [
      {
        name: 'BifaceAction',
        involvedShapesIds: involvedShapes.map(s => s.id),
        oldBiface: involvedShapes.map(s => s.isBiface),
      },
    ];

    this.executeAction();
    this.restart();

    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }
}
