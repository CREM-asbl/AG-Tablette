import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { createElem } from '../Core/Tools/general';
import { Shape } from '../Core/Objects/Shape';
import './shapes-list';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateState extends State {
  constructor() {
    super('create_shape', 'Ajouter une forme');

    // show-family-shape -> listen-canvas-click -> moving-shape
    this.currentStep = null;

    // La famille sélectionnée dans le menu de gauche
    this.selectedFamily = null;

    // La forme que l'on va ajouter (on ajoute une copie de cette forme)
    this.selectedShape = null;

    // Shape à créer
    this.shapeToCreate = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Créer des formes';
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Après avoir sélectionné une famille de formes dans le menu, vous devez appuyer sur une des
        formes dans le menu qui apparaît en bas de l'écran. Appuyez ensuite sur l'écran pour ajouter
        une forme.<br /><br />
        <b>Note:</b> vous pouvez appuyer sur l'écran puis bouger votre doigt sans le relacher, pour
        positionner plus précisément la nouvelle forme.
      </p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start(family) {
    this.currentStep = 'show-family-shapes';
    this.selectedFamily = family;
    const shapesNames = app.environment.getFamily(family).getShapesNames();

    if (shapesNames.length === 1) {
      const shapeRef = app.environment.getFamily(this.selectedFamily).getShape(shapesNames[0]);
      this.setShape(shapeRef.saveToObject());
      return;
    }

    if (!this.popup) this.popup = createElem('shapes-list');
    this.popup.selectedFamily = family;
    this.popup.shapesNames = shapesNames;
    this.popup.style.display = 'flex';

    window.dispatchEvent(
      new CustomEvent('family-selected', { detail: { selectedFamily: this.selectedFamily } }),
    );

    window.addEventListener('shape-selected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart(manualRestart = false, family) {
    this.end();
    if (manualRestart) {
      this.start(family);
      return;
    }
    window.dispatchEvent(
      new CustomEvent('family-selected', { detail: { selectedFamily: this.selectedFamily } }),
    );
    if (this.selectedShape) {
      this.currentStep = 'listen-canvas-click';
      window.dispatchEvent(
        new CustomEvent('shape-selected', {
          detail: { selectedShape: this.selectedShape.saveToObject() },
        }),
      );
    } else {
      this.currentStep = 'show-family-shapes';
    }

    window.addEventListener('shape-selected', this.handler);
    this.mouseDownId = app.addListener('canvasmousedown', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      this.popup?.remove();
      this.popup = null;
    }
    window.cancelAnimationFrame(this.requestAnimFrameId);
    window.removeEventListener('shape-selected', this.handler);
    app.removeListener('canvasmousedown', this.mouseDownId);
    app.removeListener('canvasmouseup', this.mouseUpId);
    window.dispatchEvent(new CustomEvent('family-selected', { detail: { selectedFamily: null } }));
  }

  _actionHandle(event) {
    if (event.type == 'shape-selected') {
      this.setShape(event.detail.selectedShape);
    } else if (event.type == 'canvasmousedown') {
      this.onMouseDown();
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  setShape(shape) {
    if (shape) {
      this.selectedShape = Shape.fromObject(shape);
      this.currentStep = 'listen-canvas-click';
      this.mouseDownId = app.addListener('canvasmousedown', this.handler);
    }
  }

  onMouseDown() {
    if (this.currentStep != 'listen-canvas-click') return;
    this.shapeToCreate = this.selectedShape.copy();
    let shapeSize = app.settings.get('shapesSize');

    this.shapeToCreate.scale(shapeSize);
    this.shapeToCreate.size = shapeSize;
    this.shapeToCreate.coordinates = app.workspace.lastKnownMouseCoordinates;
    if (this.shapeToCreate.isCircle()) this.shapeToCreate.isCenterShown = true;

    this.currentStep = 'moving-shape';
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
    this.animate();
  }

  onMouseUp() {
    if (this.currentStep != 'moving-shape') return;

    let shapeSize = app.settings.get('shapesSize'),
      involvedShapes = [this.shapeToCreate];

    this.shapeToCreate.coordinates = app.workspace.lastKnownMouseCoordinates;

    this.actions = [
      {
        name: 'CreateAction',
        shapeToCreate: this.shapeToCreate,
        shapeId: this.shapeToCreate.id,
        shapeSize: shapeSize,
      },
    ];

    let transformation = getShapeAdjustment(involvedShapes, this.shapeToCreate);
    if (transformation.rotation != 0) {
      let rotateAction = {
        name: 'RotateAction',
        shapeId: this.shapeToCreate.id,
        involvedShapesIds: involvedShapes.map(s => s.id),
        rotationAngle: transformation.rotation,
      };
      this.actions.push(rotateAction);
    }
    if (transformation.move.x != 0 || transformation.move.y != 0) {
      let moveAction = {
        name: 'MoveAction',
        shapeId: this.shapeToCreate.id,
        involvedShapesIds: involvedShapes.map(s => s.id),
        transformation: transformation.move,
      };
      this.actions.push(moveAction);
    }
    this.executeAction();
    this.restart();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  draw() {
    if (this.currentStep != 'moving-shape' || this.status != 'running') return;

    this.shapeToCreate.coordinates = app.workspace.lastKnownMouseCoordinates;
    window.dispatchEvent(new CustomEvent('draw-shape', { detail: { shape: this.shapeToCreate } }));
  }
}
