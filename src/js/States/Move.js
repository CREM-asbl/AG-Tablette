import { app } from '../App'
import { MoveAction } from './Actions/Move'
import { State } from './State'

/**
 * Déplacer une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class MoveState extends State {

    constructor() {
        super("move_shape");

        this.action = null;

        this.currentStep = null; // listen-canvas-click -> moving-shape

        //La forme que l'on déplace
        this.selectedShape = null;

        //coordonnées de la souris lorsque le déplacement a commencé
        this.startClickCoordinates = null;

        //coordonnées de la souris à la fin du déplacement
        this.endClickCoordinates = null;

        //l'ensemble des formes liées à la forme actuelle.
        //this.linkedShapes = [];
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.action = new MoveAction(this.name);
        this.currentStep = "listen-canvas-click";

        this.selectedShape = null;
        this.startClickCoordinates = null;
        this.endClickCoordinates = null;

        app.interactionAPI.setSelectionConstraints("mouseDown",
            {"canShape": "all", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canVertex": "none", "listVertex": []}
        );
    }

    /**
     * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (onMouseDown)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        this.selectedShape = shape;
        this.startClickCoordinates = clickCoordinates;

        this.action.shapeId = shape.id;
        this.action.initialCoordinates = shape.getCoordinates();

        //TODO: ajouter les formes liées à action.linkedShapes!
        /*
            var group = app.workspace.getShapeGroup(this.selectedShape, "system");
               if (group)
                   this.shapesList = group.slice();
               else
                   this.shapesList = [this.selectedShape];
                   var group = app.workspace.getShapeGroup(this.selectedShape, "user");
               if (group) {
                   for (var i = 0; i < group.length; i++) {
                       var g = app.workspace.getShapeGroup(group[i], "system");
                       if (g) {
                           for (var j = 0; j < g.length; j++) {
                               if (this.shapesList.indexOf(g[j]) == -1)
                                   this.shapesList.push(g[j]);
                           }
                       } else {
                           if (this.shapesList.indexOf(group[i]) == -1)
                               this.shapesList.push(group[i]);
                       }
                   }
               }
         */

        this.currentStep = "moving-shape";
        app.drawAPI.askRefresh("upper");
        app.drawAPI.askRefresh();
    }

    /**
     * Appelée lorsque l'événement mouseup est déclanché sur le canvas
     * @param  {{x: float, y: float}} mouseCoordinates les coordonnées de la souris
     * @param  {Event} event            l'événement javascript
     */
    onMouseUp(mouseCoordinates, event) {
        if(this.currentStep != "moving-shape") return;

        this.endClickCoordinates = mouseCoordinates;

        let newCoords = {
            'x': this.endClickCoordinates.x - (this.startClickCoordinates.x - this.selectedShape.x),
            'y': this.endClickCoordinates.y - (this.startClickCoordinates.y - this.selectedShape.y)
        };
        this.action.newCoordinates = newCoords;

        this.executeAction();
        this.start();
        app.drawAPI.askRefresh("upper");
        app.drawAPI.askRefresh();
    }

    /**
     * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
     * @param  {Context2D} ctx              Le canvas
     * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
     */
    draw(ctx, mouseCoordinates) {
        if(this.currentStep != "moving-shape") return;

        //Décalage entre les coordonnées de la forme et le click de départ
        let diff = {
                'x': this.startClickCoordinates.x - this.selectedShape.x,
                'y': this.startClickCoordinates.y - this.selectedShape.y
            },
            //Nouvelles coordonnées de la forme: la position de la souris - le décalage
            newCoord = {
                'x':  mouseCoordinates.x - diff.x,
                'y': mouseCoordinates.y - diff.y
            },
            saveCoord = this.selectedShape.getCoordinates();

        this.selectedShape.setCoordinates(newCoord);

        app.drawAPI.drawShape(ctx, this.selectedShape);

        this.selectedShape.setCoordinates(saveCoord);
        //TODO: faire bouger tout le groupe de formes.
    }

    /**
     * Appelée par la fonction de dessin, renvoie les formes qu'il ne faut pas
     * dessiner sur le canvas principal.
     * @return {[Shape]} les formes à ne pas dessiner
     */
    getEditingShapes() {
        if(this.currentStep != "moving-shape") return [];
        return [this.selectedShape];
    }
}
