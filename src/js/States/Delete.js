import { app } from '../App'
import { DeleteAction } from './Actions/Delete'
import { State } from './State'

/**
 * Supprimer une forme (et supprime le groupe dont la forme faisait partie s'il
 * ne restait que 2 formes dans le groupe)
 */
export class DeleteState extends State {

    constructor() {
        super("delete_shape");
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.actions = [new DeleteAction(this.name)];

        app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    }

    /**
     * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {

        this.actions[0].shape = shape;
        this.executeAction();
        this.start();

        app.drawAPI.askRefresh();
    }
}
