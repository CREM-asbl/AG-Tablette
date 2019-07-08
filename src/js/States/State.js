import { app } from '../App'

/**
 * Cette classe abstraite représente un état possible de l'application
 */
export class State {
    constructor(name) {
        if(this.constructor === State) {
            throw new TypeError('Abstract class "State" cannot be instantiated directly');
        }
        this.name = name;
    }

    //Événements pouvant être définis. Un return false désactivera l'appel à objectSelected
    onClick(mouseCoordinates, event) { return true; }
    onMouseDown(mouseCoordinates, event) { return true; }
    onMouseUp(mouseCoordinates, event) { return true; }
    onMouseMove(mouseCoordinates, event) { return true; }
    onTouchStart(mouseCoordinates, event) { return true; }
    onTouchMove(mouseCoordinates, event) { return true; }
    onTouchEnd(mouseCoordinates, event) { return true; }
    onTouchLeave(mouseCoordinates, event) { return true; }
    onTouchCancel(mouseCoordinates, event) { return true; }

    /**
     * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
     * @param  {Context2D} ctx              Le canvas
     * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
     */
    draw(ctx, mouseCoordinates) {}

    /**
     * Appelée par la fonction de dessin, renvoie les formes qu'il ne faut pas
     * dessiner sur le canvas principal.
     * @return {[Shape]} les formes à ne pas dessiner
     */
    getEditingShapes() { return []; }

    /**
     * Exécuter l'action liée à l'état, et l'enregistrer dans l'historique.
     */
    executeAction() {
        this.action.do();
        app.workspace.history.addAction(this.action);
    }

    /**
     * (ré-)initialiser l'état
     * @param params: tableau associatif/objet pouvant contenir des paramètres
     */
    start(params) {
        console.log("start() not implemented");
    }

    /**
     * Appelée lorsqu'un autre état va être lancé et qu'il faut annuler l'action en cours
     */
    abort() {}
}
