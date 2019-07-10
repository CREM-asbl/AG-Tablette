import { app } from '../App'
import { TranslatePlaneAction } from './Actions/TranslatePlane'
import { State } from './State'

/**
 * Faire translater le plan
 */
export class TranslatePlaneState extends State {

    constructor() {
        super("translate_plane");

        this.action = null;

        this.currentStep = null; // listen-canvas-click -> translating-plane

        this.startClickCoordinates = null;
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.action = new TranslatePlaneAction(this.name);

        this.currentStep = "listen-canvas-click";
        this.startClickCoordinates = null;

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "none", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        ); //TODO: désactiver la contrainte de sélection pour cet état.
    }

    onMouseDown(clickCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        this.startClickCoordinates = clickCoordinates;
        this.currentStep = "translating-plane";
    }

    onMouseUp(clickCoordinates, event) {
        if(this.currentStep != "translating-plane") return;

        this.action.offset = {
            'x': clickCoordinates.x - this.startClickCoordinates.x,
            'y': clickCoordinates.y - this.startClickCoordinates.y
        };

        this.executeAction();
        this.start();
    }

    onMouseMove(clickCoordinates, event) {
        if(this.currentStep != "translating-plane") return;
        let saveOffset = app.workspace.translateOffset,
            clickDiff = {
                'x': clickCoordinates.x - this.startClickCoordinates.x,
                'y': clickCoordinates.y - this.startClickCoordinates.y
            },
            offset = {
                'x': saveOffset.x + clickDiff.x,
                'y': saveOffset.y + clickDiff.y
            };

        app.workspace.setTranslateOffset(offset);
        app.workspace.setTranslateOffset(saveOffset, false);
    }
}
