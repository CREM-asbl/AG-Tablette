import { app } from '../App'
import { OpacityAction } from './Actions/Opacity'
import { State } from './State'

/**
 * Modifier l'opacité d'une forme
 */
export class OpacityState extends State {

    constructor() {
        super("border_color");

        this.currentStep = null; // choose-opacity -> listen-canvas-click
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.actions = [new OpacityAction(this.name)];

        this.currentStep = "choose-opacity";

        app.interactionAPI.setFastSelectionConstraints('click_all_shape');

        app.appDiv.shadowRoot.querySelector("opacity-popup").style.display = "block";
    }

    setOpacity(opacity) {
         this.actions[0].opacity = opacity;
         this.currentStep = "listen-canvas-click";
    }

    /**
     * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        this.actions[0].shapeId = shape.id;
        let group = app.workspace.getShapeGroup(shape, 'user'),
            involvedShapes = [shape];
        if(group)
            involvedShapes = [...group.shapes];
        this.actions[0].involvedShapesIds = involvedShapes.map(s => s.id);

        this.executeAction();
        let opacity = this.actions[0].opacity;
        this.actions[0] = new OpacityAction(this.name);
        this.setOpacity(opacity);

        app.drawAPI.askRefresh();
    }
}
