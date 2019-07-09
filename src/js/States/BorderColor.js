import { app } from '../App'
import { BorderColorAction } from './Actions/BorderColor'
import { State } from './State'

/**
 * Modifier la couleur des bords d'une forme
 */
export class BorderColorState extends State {

    constructor() {
        super("border_color");

        this.action = null;

        this.currentStep = null; // choose-color -> listen-canvas-click
    }

    /**
     * (ré-)initialiser l'état
     */
    start(callColorPicker = true) {
        this.action = new BorderColorAction(this.name);

        this.currentStep = "choose-color";

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "all", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        );

        if(callColorPicker)
            document.querySelector("#color-picker-label").click();
    }

    setColor(color) {
         this.action.selectedColor = color;
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

        this.action.shapeId = shape.id;
        let group = app.workspace.getShapeGroup(shape, 'user'),
            involvedShapes = [shape];
        if(group)
            involvedShapes = [...group.shapes];
        this.action.involvedShapesIds = involvedShapes.map(s => s.id);

        this.executeAction();
        let color = this.action.selectedColor;
        this.start(false);
        this.setColor(color);

        app.drawAPI.askRefresh();
    }
}
