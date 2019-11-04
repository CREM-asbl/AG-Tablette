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

    this.lastCreationTimestamp = null;
  }

  /**
   * (ré-)initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start(family, timestamp = 0) {
    this.selectedFamily = family;
    this.actions = [new CreateAction(this.name)];
    this.selectedShape = null;
    this.currentStep = 'show-family-shapes';
    this.lastCreationTimestamp = timestamp;
  }

  setShape(shape) {
    this.selectedShape = shape;
    this.currentStep = 'listen-canvas-click';
    window.dispatchEvent(new CustomEvent('app-state-changed', { detail: app.state }));
  }

  onClick(mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;
    if (Date.now() - this.lastCreationTimestamp < 300) {
      console.log('clics trop rapprochés');
      return;
    }
    let shape = this.selectedShape.copy(),
      shapeSize = app.settings.get('shapesSize');

    shape.setScale(shapeSize);

    let translation = getNewShapeAdjustment(mouseCoordinates),
      coordinates = Points.add(mouseCoordinates, translation);

    this.actions[0].shapeToAdd = shape;
    this.actions[0].coordinates = coordinates;
    this.actions[0].shapeSize = shapeSize;

    this.executeAction();
    shape = this.selectedShape;
    this.start(this.selectedFamily, Date.now());
    this.setShape(shape);

    app.drawAPI.askRefresh();
  }
}
