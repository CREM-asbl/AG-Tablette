import { app } from '../App'
import { ToBackgroundAction } from './Actions/ToBackground'
import { State } from './State'

/**
 * Déplacer une forme derrière toutes les autres.
 */
export class ToBackgroundState extends State {

    constructor() {
        super("to_background");
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.actions = [new ToBackgroundAction(this.name)];

        app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    }

    /**
     * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {

        this.actions[0].oldIndex = app.workspace.getShapeIndex(shape);
        this.executeAction();
        this.start();

        app.drawAPI.askRefresh();
    }
}
