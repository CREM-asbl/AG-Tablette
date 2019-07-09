import { app } from '../App'
import { DuplicateAction } from './Actions/Duplicate'
import { State } from './State'

/**
 * Dupliquer une forme
 */
export class DuplicateState extends State {

    constructor() {
        super("duplicate_shape");

        this.action = null;

        this.currentStep = null; // listen-canvas-click -> moving-shape

        //La forme que l'on duplique
        this.selectedShape = null;

        //coordonnées de la souris lorsque la duplication a commencé
        this.startClickCoordinates = null;

        /*
        L'ensemble des formes liées à la forme sélectionnée (systemGroup  et
        userGroup), y compris la forme elle-même
         */
        this.involvedShapes = [];
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.action = new DuplicateAction(this.name);
        this.currentStep = "listen-canvas-click";

        this.selectedShape = null;
        this.startClickCoordinates = null;
        this.involvedShapes = [];

        app.interactionAPI.setSelectionConstraints("mouseDown",
            {"canShape": "all", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        );
    }

    /**
     * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (onMouseDown)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        this.selectedShape = shape;
        this.action.shapeId = shape.id;

        this.involvedShapes = [shape];
        let group = app.workspace.getShapeGroup(shape, 'user');
        if(group)
            this.involvedShapes = [...group.shapes];
        this.action.involvedShapesIds = this.involvedShapes.map(s => s.id);

        this.startClickCoordinates = clickCoordinates;

        this.currentStep = "moving-shape";
        app.drawAPI.askRefresh("upper");
        app.drawAPI.askRefresh();
    }

    /**
     * Appelée lorsque l'événement mouseup est déclanché sur le canvas
     * @param  {{x: float, y: float}} mouseCoordinates les coordonnées de la souris
     * @param  {Event} event            l'événement javascript
     */
    onMouseUp(mouseCoordinates, event) {
        if(this.currentStep != "moving-shape") return;

        this.action.transformation = {
            'x': mouseCoordinates.x - this.startClickCoordinates.x,
            'y': mouseCoordinates.y - this.startClickCoordinates.y
        }

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
        if(this.currentStep != "moving-shape") return;

        let transformation = {
                'x': mouseCoordinates.x - this.startClickCoordinates.x,
                'y': mouseCoordinates.y - this.startClickCoordinates.y
            };

        this.involvedShapes.forEach(s => {
            let newCoords = {
                    'x': s.x + transformation.x,
                    'y': s.y + transformation.y
                },
                saveCoords = s.getCoordinates();

            s.setCoordinates(newCoords);

            app.drawAPI.drawShape(ctx, s);

            s.setCoordinates(saveCoords);
        });
    }

    /**
     * Appelée par la fonction de dessin, renvoie les formes qu'il ne faut pas
     * dessiner sur le canvas principal.
     * @return {[Shape]} les formes à ne pas dessiner
     */
    getEditingShapes() {
        if(this.currentStep != "moving-shape") return [];
        return [];
    }
}
