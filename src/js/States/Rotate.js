import { app } from '../App'
import { RotateAction } from './Actions/Rotate'
import { State } from './State'
import { getAngleOfPoint } from '../Tools/general'

/**
 * Tourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class RotateState extends State {

    constructor() {
        super("rotate_shape");

        this.action = null;

        this.currentStep = null; // listen-canvas-click -> rotating-shape

        //La forme que l'on déplace
        this.selectedShape = null;

        //L'angle initial entre le centre de la forme et la position de la souris
        this.initialAngle = null;

        //l'ensemble des formes liées à la forme actuelle.
        //this.linkedShapes = [];
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.action = new RotateAction(this.name);
        this.currentStep = "listen-canvas-click";

        this.selectedShape = null;
        this.initialAngle = null;

        app.interactionAPI.setSelectionConstraints("mouseDown",
            {"canShape": "all", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canVertex": "none", "listVertex": []}
        );
    }

    /**
     * Appelée par interactionAPI quand une forme est sélectionnée (onMouseDown)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        this.selectedShape = shape;
        this.initialAngle = getAngleOfPoint(shape, clickCoordinates);

        this.action.shapeId = shape.id;

        this.currentStep = "rotating-shape";
        app.drawAPI.askRefresh("upper");
        app.drawAPI.askRefresh();
    }

    /**
     * Appelée lorsque l'événement mouseup est déclanché sur le canvas
     * @param  {{x: float, y: float}} mouseCoordinates les coordonnées de la souris
     * @param  {Event} event            l'événement javascript
     */
    onMouseUp(mouseCoordinates, event) {
        if(this.currentStep != "rotating-shape") return;

        let newAngle = getAngleOfPoint(this.selectedShape, mouseCoordinates);
        this.action.rotationAngle = newAngle - this.initialAngle;

        this.executeAction();
        this.start();
        app.drawAPI.askRefresh("upper");
        app.drawAPI.askRefresh();
    }

    /**
     * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
     * @param  {Context2D} ctx              Le canvas
     * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
     */
    draw(ctx, mouseCoordinates) {
        if(this.currentStep != "rotating-shape") return;

        let newAngle = getAngleOfPoint(this.selectedShape, mouseCoordinates),
            diffAngle = newAngle - this.initialAngle;

        this.action.rotateShape(this.selectedShape, diffAngle, this.selectedShape.getAbsoluteCenter());

        app.drawAPI.drawShape(ctx, this.selectedShape);

        this.action.rotateShape(this.selectedShape, -diffAngle, this.selectedShape.getAbsoluteCenter());
        //TODO: faire bouger tout le groupe de formes.
    }

    /**
     * Appelée par la fonction de dessin, renvoie les formes qu'il ne faut pas
     * dessiner sur le canvas principal.
     * @return {[Shape]} les formes à ne pas dessiner
     */
    getEditingShapes() {
        if(this.currentStep != "rotating-shape") return [];
        return [this.selectedShape];
    }
}
