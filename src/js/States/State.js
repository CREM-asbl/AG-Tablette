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

        this.actions = null;
    }

    //Événements pouvant être définis. Un return false désactivera l'appel à objectSelected
    onClick(mouseCoordinates, event, isSecondCall = false) { return true; }
    onMouseDown(mouseCoordinates, event) { return true; }
    onMouseUp(mouseCoordinates, event) { return true; }
    onMouseMove(mouseCoordinates, event) { return true; }
    onTouchStart(mouseCoordinates, event) { return true; }
    onTouchMove(mouseCoordinates, event) { return true; }
    onTouchEnd(mouseCoordinates, event) { return true; }
    onTouchLeave(mouseCoordinates, event) { return true; }
    onTouchCancel(mouseCoordinates, event) { return true; }

    /**
     * Appelée par interactionAPI quand un objet (point, forme, segment)
     * est sélectionnée (onClick)
     * @param  {Object} object            L'objet sélectionné
     *                          Voir InteractionAPI.selectObject()
     * @param  {Point} clickCoordinates  Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     * @return {Boolean}                false: désactive l'appel à onClick si
     *                                  cet appel est réalisé après.
     */
    objectSelected(object, clickCoordinates, event) { return true; }

    /**
     * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
     * @param  {Context2D} ctx              Le canvas
     * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
     */
    draw(ctx, mouseCoordinates) {}

    /**
     * Appelée par la fonction de dessin après avoir dessiné une forme sur le
     * canvas principal
     * @param  {Context2D} ctx   le canvas
     * @param  {Shape} shape La forme dessinée
     */
    shapeDrawn(ctx, shape) {}

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
        /*
        Si une des actions renvoie le booléen false, ne pas ajouter l'étape
        dans l'historique. C'est notamment utilisé dans merge pour annuler si la
        fusion donne une forme creuse.
         */
        if(this.actions.every(action => action.do() !==false))
            app.workspace.history.addStep(this.actions);
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

    //Appelé par state-menu lors d'un clic sur un des boutons.
    clickOnStateMenuButton(btn_value) { }
}
