import { app } from '../App';
import { RotateAction } from './Actions/Rotate';
import { State } from './State';

/**
 * Tourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class RotateState extends State {
  constructor() {
    super('rotate_shape');

    this.currentStep = null; // listen-canvas-click -> rotating-shape

    //La forme que l'on déplace
    this.selectedShape = null;

    //L'angle initial entre le centre de la forme et la position de la souris
    this.initialAngle = null;

    /*
        L'ensemble des formes liées à la forme sélectionnée, y compris la forme
        elle-même
         */
    this.involvedShapes = [];
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Tourner";
      return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
            	Touchez une forme, puis glissez votre doigt sans relacher la
                forme pour la faire tourner. La forme tourne autour de son
                centre, qui est affiché lors de la rotation. Faites tournez
                votre doigt autour de ce centre pour faire tourner la forme.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.actions = [new RotateAction(this.name)];
    this.currentStep = 'listen-canvas-click';

    this.selectedShape = null;
    this.initialAngle = null;
    this.involvedShapes = [];

    app.interactionAPI.setFastSelectionConstraints('mousedown_all_shape');
    app.appDiv.cursor = 'default';
  }

  abort() {
    this.start();
  }

  /**
   * Appelée par interactionAPI quand une forme est sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;
    this.involvedShapes = app.workspace.getAllBindedShapes(shape, true);
    this.initialAngle = shape.center.getAngle(clickCoordinates);

    this.actions[0].shapeId = shape.id;
    this.actions[0].involvedShapesIds = this.involvedShapes.map(s => s.id);
    this.currentStep = 'rotating-shape';
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  /**
   * Appelée lorsque l'événement mouseup est déclanché sur le canvas
   * @param  {{x: float, y: float}} mouseCoordinates les coordonnées de la souris
   * @param  {Event} event            l'événement javascript
   */
  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'rotating-shape') return;

    let newAngle = this.selectedShape.center.getAngle(mouseCoordinates);
    this.actions[0].rotationAngle = newAngle - this.initialAngle;

    this.executeAction();
    this.start();
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx, mouseCoordinates) {
    if (this.currentStep != 'rotating-shape') return;

    let newAngle = this.selectedShape.center.getAngle(mouseCoordinates),
      diffAngle = newAngle - this.initialAngle;
    let center = this.selectedShape.center;

    this.involvedShapes.forEach(s => {
      s.rotate(diffAngle, center);

      app.drawAPI.drawShape(ctx, s);

      s.rotate(-diffAngle, center);
    });

    //Dessiner le centre de symétrie
    app.drawAPI.drawPoint(ctx, center, '#080');
  }

  /**
   * Appelée par la fonction de dessin, renvoie les formes qu'il ne faut pas
   * dessiner sur le canvas principal.
   * @return {[Shape]} les formes à ne pas dessiner
   */
  getEditingShapes() {
    if (this.currentStep != 'rotating-shape') return [];
    return this.involvedShapes;
  }
}
