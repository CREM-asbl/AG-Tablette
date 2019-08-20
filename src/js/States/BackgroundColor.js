import { app } from '../App'
import { BackgroundColorAction } from './Actions/BackgroundColor'
import { State } from './State'

/**
 * Modifier la couleur de fond d'une forme
 */
export class BackgroundColorState extends State {

    constructor() {
        super("background_color");

        this.currentStep = null; // choose-color -> listen-canvas-click
    }

    /**
     * (ré-)initialiser l'état
     */
    start(callColorPicker = true) {
        this.actions = [new BackgroundColorAction(this.name)];

        this.currentStep = "choose-color";

        app.interactionAPI.setFastSelectionConstraints('click_all_shape');

        if(callColorPicker)
            document.querySelector("#color-picker-label").click();
    }

    setColor(color) {
         this.actions[0].selectedColor = color;
         this.currentStep = "listen-canvas-click";
    }

    /**
     * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {
        //TODO: appeler setColor ailleurs? (événement lié au colorpicker, genre
        //      onClose - voir ce qui existe)
        this.setColor(document.querySelector('#color-picker').value);

        if(this.currentStep != "listen-canvas-click") return;

        this.actions[0].shapeId = shape.id;
        let group = app.workspace.getShapeGroup(shape, 'user'),
            involvedShapes = [shape];
        if(group)
            involvedShapes = [...group.shapes];
        this.actions[0].involvedShapesIds = involvedShapes.map(s => s.id);

        this.executeAction();
        let color = this.actions[0].selectedColor;
        this.start(false);
        this.setColor(color);

        app.drawAPI.askRefresh();
    }
}
