import { app } from '../App'
import { DeleteAction } from './Actions/Delete'
import { State } from './State'

/**
 * Supprimer une forme (et les formes liées dans un sysGroup, récursivement)
 */
//TODO: ajouter une étape: premier clic = aperçu de ce qui sera supprimé,
//      2ème clic = effectuer la suppression
export class DeleteState extends State {

    constructor() {
        super("delete_shape");
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.actions = [new DeleteAction(this.name)];

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

        this.actions[0].shape = shape;
        this.executeAction();
        this.start();

        app.drawAPI.askRefresh();
    }
}
