import { app } from '../App'
import { MergeAction } from './Actions/Merge'
import { State } from './State'
import { Points } from '../Tools/points'

/**
 * Fusionner 2 formes en une nouvelle forme
 */
export class MergeState extends State {

    constructor() {
        super("merge_shapes");

        // listen-canvas-click -> selecting-second-shape
        this.currentStep = null;

        this.firstShape = null;
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.actions = [new MergeAction(this.name)];
        this.currentStep = "listen-canvas-click";

        this.firstShape = null;

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "all", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        );
    }

    /**
     * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (onClick)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {
        if(this.currentStep == "listen-canvas-click") {
            this.currentStep = "selecting-second-shape";
            this.actions[0].firstShapeId = shape.id;
            this.firstShape = shape;
            return;
        }
        if(this.currentStep != 'selecting-second-shape')
            return;
        if(this.actions[0].firstShapeId == shape.id) {
            this.currentStep = "listen-canvas-click";
            this.actions[0].firstShapeId = null;
            return;
        }
        this.actions[0].secondShapeId = shape.id;

        let shape1 = this.firstShape,
            shape2 = shape;

        if(this.actions[0].getCommonSegments(shape1, shape2).length==0) {
            console.log("no common segments");
            return;
        }

        if(shape1.overlapsWith(shape2)) {
            console.log("shapes overlap!");
            return;
        }

        this.executeAction();
        this.start();
        app.drawAPI.askRefresh();
    }
}
