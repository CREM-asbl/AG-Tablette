import { app } from '../App'
import { CreateAction } from './Actions/Create'
import { State } from './State'
import { Points } from '../Tools/points'
import { getNewShapeAdjustment } from '../Tools/automatic_adjustment'

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateState extends State {

    constructor() {
        super("create_shape");

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
        this.actions = [new CreateAction(this.name)];
        this.selectedShape = null;
        this.currentStep = "show-family-shapes";
    }

    setShape(shape) {
         this.selectedShape = shape;
         this.currentStep = "listen-canvas-click";
         window.dispatchEvent(new CustomEvent('app-state-changed', { detail: app.state }));
    }

    onClick(mouseCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        let shape = this.selectedShape.copy(),
            shapeSize = app.settings.get("shapesSize");

        //scale:
        shape.buildSteps.forEach(bs => {
            bs.coordinates = {
                'x': bs.coordinates.x * shapeSize,
                'y': bs.coordinates.y * shapeSize
            }
            if(bs.type == "segment") {
                bs.points.forEach(pt => {
                    pt.x = pt.x * shapeSize;
                    pt.y = pt.y * shapeSize;
                });
            }
        });
        shape.updateInternalState();

        let translation = getNewShapeAdjustment(mouseCoordinates),
            coordinates = Points.add(mouseCoordinates, translation);

        this.actions[0].shapeToAdd = shape;
        this.actions[0].coordinates = coordinates;
        this.actions[0].shapeSize = shapeSize;

        this.executeAction();
        shape = this.selectedShape;
        this.start(this.selectedFamily);
        this.setShape(shape);

        app.drawAPI.askRefresh();
    }

}
