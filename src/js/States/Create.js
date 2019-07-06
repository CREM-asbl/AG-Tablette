import { app } from '../App'
import { CreateAction } from './Actions/Create'
import { State } from './State'

export class CreateState extends State {

    constructor() {
        super("create_shape");

        //La famille sélectionnée dans le menu de gauche
        this.selectedFamily = null;

        this.action = null;

        this.currentStep = null; //show-family-shape -> listen-canvas-click
    }

    /**
     * (ré-)initialiser l'état
     * @param  {String} family Nom de la famille sélectionnée
     */
    start(family) {
        this.selectedFamily = family;
        this.action = new CreateAction(this.name);
        this.currentStep = "show-family-shapes";
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
         this.action.selectedShape = shape;
         this.currentStep = "listen-canvas-click";
    }

    onClick(mouseCoordinates, event) {
        if(this.currentStep != "listen-canvas-click")
            return;

        this.action.coordinates = mouseCoordinates;

        this.action.do();
        app.drawAPI.refreshMain();
    }




}
