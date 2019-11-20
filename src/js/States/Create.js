import { app } from '../App';
import { CreateAction } from './Actions/Create';
import { State } from './State';
import { Points } from '../Tools/points';
import { getNewShapeAdjustment } from '../Tools/automatic_adjustment';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateState extends State {
  constructor() {
    super('create_shape');

    this.currentStep = null; // show-family-shape -> listen-canvas-click

    //La famille sélectionnée dans le menu de gauche
    this.selectedFamily = null;

    //La forme que l'on va ajouter (on ajoute une copie de cette forme)
    this.selectedShape = null;

    //Shape temporaire (pour le deplacement)
    this.tempShape = null;

    this.lastCreationTimestamp = null;
  }

  /**
   * (ré-)initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start(family, timestamp = 0) {
    this.selectedFamily = family;
    this.selectedShape = null;
    this.currentStep = 'show-family-shapes';
    this.lastCreationTimestamp = timestamp;
    app.appDiv.cursor = 'default';
  }

  setShape(shape) {
    this.actions = [new CreateAction(this.name)];
    this.selectedShape = shape;
    this.currentStep = 'listen-canvas-click';
    window.dispatchEvent(new CustomEvent('app-state-changed', { detail: app.state }));
  }

  onMouseDown(mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;
    if (Date.now() - this.lastCreationTimestamp < 300) {
      console.log('clics trop rapprochés');
      return;
    }
    this.tempShape = this.selectedShape.copy();
    let shapeSize = app.settings.get('shapesSize');
    this.startClickCoordinates = mouseCoordinates;
    this.involvedShapes = [this.tempShape];

    this.tempShape.setScale(shapeSize);
    this.tempShape.coordinates = mouseCoordinates;

    this.actions[0].shapeToAdd = this.tempShape;
    this.actions[0].coordinates = mouseCoordinates;
    this.actions[0].shapeSize = shapeSize;
    this.actions[0].isTemporary = true;
    this.actions[0].shapeId = this.actions[0].shapeToAdd.id;

    this.currentStep = 'moving-shape';

    this.executeAction();

    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  onMouseMove(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    let transformation = {
      x: mouseCoordinates.x - this.startClickCoordinates.x,
      y: mouseCoordinates.y - this.startClickCoordinates.y,
    };

    this.involvedShapes.forEach(s => {
      let newCoords = {
        x: s.x + transformation.x,
        y: s.y + transformation.y,
      };

      s.setCoordinates(newCoords);
    });

    this.startClickCoordinates = mouseCoordinates;

    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    //  let translation = getNewShapeAdjustment(mouseCoordinates),
    //   coordinates = Points.add(mouseCoordinates, translation);

    coordinates = mouseCoordinates;

    this.tempShape.coordinates = coordinates;
    this.actions[0].shapeToAdd = this.tempShape.copy();
    this.actions[0].isTemporary = false;
    this.actions[0].shapeId = this.actions[0].shapeToAdd.id;
    this.actions[0].coordinates = coordinates;

    app.workspace.deleteShape(this.tempShape);

    console.log(this.actions[0].shapeId);

    this.executeAction();
    this.setShape(this.selectedShape);
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }
}
