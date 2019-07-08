import {Point} from '../Point'
/**
 * Cette classe permet d'effectuer un retournement d'une forme (ou d'un ensemble de formes liées) sur le canvas
 */
class ReverseState {
    constructor() {

        this.name = "reverse_shape"

        //Durée en secondes de l'animation de retournement
        this.duration = 4

        //La forme que l'on a sélectionnée
        this.selectedShape = null

        //l'ensemble des formes liées à la forme actuelle.
        this.shapesList = []

        //coordonnées de la souris lorsque le déplacement a commencé
        this.clickCoordinates = null

        //Vaut vrai si une animation est en cours
        this.isReversing = false

        /**
         * Représente l'axe de la symétrie orthogonale.
         * axe.type: type de l'axe (String): H (horizontal: - ), V (vertical: | ), NW (nord-west: \ ) ou SW (sud-west: / ).
         * axe.center: le 'centre' de l'axe
         * axe.p1: un point sur l'axe ({'x': int, 'y': int} - coordonnées relatives au centre)
         * axe.p2: un autre point sur l'axe ({'x': int, 'y': int} - coordonnées relatives au centre)
         */
        this.axe = null
        this.axeColor = '#080'

        //timestamp en milliseconde du démarrage de l'animation
        this.startTime = null

        this.isHistory = false
        this.historyCallback = null
        this.historyData = null
    }

    /**
     * Réinitialiser l'état
     */
    reset() {
        this.selectedShape = null
        this.shapesList = []
        this.clickCoordinates = null
        this.isReversing = false
        this.axe = null
        this.startTime = null
        window.cancelAnimationFrame(this.requestAnimFrameId)
        this.isHistory = false
        this.historyCallback = null
        this.historyData = null
    }

    /**
     * Calcule les coordonnées des extrémités du segment représentant l'axe de symétrie.
     * @param shape: la forme dont l'axe de symétrie passe par le centre
     * @param mouseCoordonates: les coordonnées de la souris.
     * @return: renvoie l'axe de symétrie à utiliser ([ {'x': int, 'y': int}, {'x': int, 'y': int} ])
     */
    getSymmetryAxis(shape, mouseCoordinates) {
        var angle = app.getAngleBetweenPoints(mouseCoordinates, shape)
        if (angle > Math.PI) angle -= Math.PI
        if (angle <= Math.PI / 8 || angle > 7 * Math.PI / 8) {
            return [{ 'x': shape.x, 'y': shape.y - 100 }, { 'x': shape.x, 'y': shape.y + 100 }]
        } else if (angle > Math.PI / 8 && angle <= 3 * Math.PI / 8) {
            return [{ 'x': shape.x - 68.3, 'y': shape.y - 68.3 }, { 'x': shape.x + 68.3, 'y': shape.y + 68.3 }]
        } else if (angle > 3 * Math.PI / 8 && angle <= 5 * Math.PI / 8) {
            return [{ 'x': shape.x - 100, 'y': shape.y }, { 'x': shape.x + 100, 'y': shape.y }]
        } else { //if(angle>5*Math.PI/8 && angle<=7*Math.PI/8)
            return [{ 'x': shape.x - 68.3, 'y': shape.y + 68.3 }, { 'x': shape.x + 68.3, 'y': shape.y - 68.3 }]
        }
    }

    /**
     * Appelée par la fonction de dessin, après avoir dessiné les formes
     * @param canvas: référence vers la classe Canvas
     */
    draw(canvas, mouseCoordinates) {
        if (!this.isReversing) {
            /*
            //Dessine l'axe de symétrie
            var list = window.app.workspace.shapesOnPoint(new Point(mouseCoordinates.x, mouseCoordinates.y, null, null))
            if(list.length>0) {
                var shape = list.pop()
                var axis = this.getSymmetryAxis(shape, mouseCoordinates)
                canvas.drawLine(axis[0], axis[1])
            }
            */
        } else {
            //Dessiner les formes:
            for (var i = 0; i < this.shapesList.length; i++) {
                canvas.drawReversingShape(this.shapesList[i], this.axe, this.getProgress())
            }

            //Dessiner l'axe de symétrie:
            var shape = this.selectedShape
            var axis = this.getSymmetryAxis(shape, this.clickCoordinates)
            canvas.drawLine(axis[0], axis[1], this.axeColor)
        }
    }

}

// Todo: à supprimer quand l'import de toutes les classes sera en place
addEventListener('app-loaded', () => app.states.reverse_shape = new ReverseState())
