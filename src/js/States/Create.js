import { app } from '../App'
import { CreateAction } from './Actions/Create'
import { State } from './State'

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateState extends State {

    constructor() {
        super("create_shape");

        this.action = null;

        this.currentStep = null; // show-family-shape -> listen-canvas-click

        //La famille sélectionnée dans le menu de gauche
        this.selectedFamily = null;

        //La forme que l'on va ajouter (on ajoute une copie de cette forme)
        this.selectedShape = null;
    }

    /**
     * (ré-)initialiser l'état
     * @param  {String} family Nom de la famille sélectionnée
     */
    start(family) {
        this.selectedFamily = family;
        this.action = new CreateAction(this.name);
        this.selectedShape = null;
        this.currentStep = "show-family-shapes";
        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "none", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "all", "pointTypes": ["vertex", "segmentPoint", "center"], "listPoint": []}
        );
        app.interactionAPI.selectObjectBeforeNativeEvent = true;
    }

    setShape(shape) {
        //TODO: mettre la taille des formes à jour.
        /*
        var size = settings.get('shapesSize');
        for (var i = 0; i < shape.buildSteps.length; i++) {
            var step = shape.buildSteps[i];
            step.setCoordinates(step.x * size, step.y * size);
        }
        shape.refPoint.x *= size;
        shape.refPoint.y *= size;
        shape.recomputePoints();
         */
         this.selectedShape = shape;
         this.currentStep = "listen-canvas-click";
    }

    /**
     * Appelée par interactionAPI quand un point d'une forme est sélectionnée
     * (onClick)
     * @param  {Object} point           Le point sélectionné
     * @param  {Point} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     * @return {Boolean}                false: désactive l'appel à onClick si
     *                                  cet appel est réalisé après.
     */
    objectSelected(point, clickCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        this.action.coordinates = point.coordinates;
        this.action.shapeToAdd = this.selectedShape.copy();
        this.action.sourceShapeId = point.shape.id;

        this.executeAction();
        let shape = this.selectedShape;
        this.start(this.selectedFamily);
        this.setShape(shape);

        app.drawAPI.askRefresh();
        return false;
    }

    onClick(mouseCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        this.action.coordinates = mouseCoordinates;
        this.action.shapeToAdd = this.selectedShape.copy();

        this.executeAction();
        let shape = this.selectedShape;
        this.start(this.selectedFamily);
        this.setShape(shape);

        app.drawAPI.askRefresh();
    }

}
