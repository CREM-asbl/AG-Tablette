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
            {
                "canPoint": "all",
                "pointTypes": ["vertex"],
                "listPoint": []
            }
        );
        app.interactionAPI.selectObjectBeforeNativeEvent = true;
    }

    setShape(shape) {
         this.selectedShape = shape;
         this.currentStep = "listen-canvas-click";
         window.dispatchEvent(new CustomEvent('app-state-changed', { detail: app.state }));
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

        return true;

        if(!app.settings.get("automaticAdjustment")) return true;

        this.action.coordinates = point.coordinates;
        this.action.shapeToAdd = this.selectedShape.copy();
        this.action.sourceShapeId = point.shape.id;
        this.action.shapeSize = app.settings.get("shapesSize");

        this.executeAction();
        this.action = new CreateAction(this.name);

        app.drawAPI.askRefresh();
        return false;
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
        shape.refPoint = {
            'x': shape.refPoint.x * shapeSize,
            'y': shape.refPoint.y * shapeSize
        };
        shape.updateInternalState();

        let translation = getNewShapeAdjustment(mouseCoordinates),
            coordinates = Points.add(mouseCoordinates, translation);

        this.action.shapeToAdd = shape;
        this.action.coordinates = Points.sub(coordinates, shape.refPoint);
        this.action.shapeSize = shapeSize;

        this.executeAction();
        shape = this.selectedShape;
        this.start(this.selectedFamily);
        this.setShape(shape);

        app.drawAPI.askRefresh();
    }

}
