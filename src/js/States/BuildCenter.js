import { app } from '../App'
import { BuildCenterAction } from './Actions/BuildCenter'
import { State } from './State'

/**
 * Construire le centre d'une forme (l'afficher)
 */
export class BuildCenterState extends State {

    constructor() {
        super("build_shape_center");

        this.action = null;
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.action = new BuildCenterAction(this.name);

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "all", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        );
    }

    /**
     * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {
        if(shape.isCenterShown) return;

        this.action.shapeId = shape.id;
        this.executeAction();
        this.start();

        app.drawAPI.askRefresh();
    }
}
