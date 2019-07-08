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
        app.interactionAPI.resetSelectionConstraints();
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
