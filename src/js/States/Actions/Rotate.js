import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class RotateAction extends Action {
    constructor(name) {
        super(name);

        //L'id de la forme que l'on tourne
        this.shapeId = null;

        //L'angle de rotation (dans le sens horloger)
        this.rotationAngle = null;

        /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
        this.involvedShapesIds = [];
    }

    checkDoParameters() {
        if(!this.shapeId)
            return false;
        if(!Number.isFinite(this.rotationAngle))
            return false;
        return true;
    }

    checkUndoParameters() {
        return this.checkDoParameters();
    }

    do() {
        if(!this.checkDoParameters()) return;

        let shape = app.workspace.getShapeById(this.shapeId),
            center = shape.getAbsoluteCenter();

        this.involvedShapesIds.forEach(id => {
            let s = app.workspace.getShapeById(id);
            this.rotateShape(s, this.rotationAngle, center);
        });
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let shape = app.workspace.getShapeById(this.shapeId),
            center = shape.getAbsoluteCenter();

        this.involvedShapesIds.forEach(id => {
            let s = app.workspace.getShapeById(id);
            this.rotateShape(s, -this.rotationAngle, center);
        });
    }

    /**
     * Applique une rotation d'un certain angle sur une forme.
     * @param  {Shape} shape La forme
     * @param  {float} angle L'angle en radians
     * @param  {Point} center Le centre autour duquel effectuer la rotation
     */
    rotateShape(shape, angle, center) {
        let newCoords = this.rotatePoint(shape, angle, center);
        shape.setCoordinates(newCoords);

        shape.buildSteps.forEach(bs => {
            let coords = this.rotatePoint(bs.coordinates, angle, shape.center);
            bs.coordinates = coords;
            if(bs.type=="segment") {
                bs.points.forEach(pt => {
                    let pointCoords = this.rotatePoint(pt, angle, shape.center);
                    pt.x = pointCoords.x;
                    pt.y = pointCoords.y;
                });
            }
        });
        shape.updateInternalState();
    }

    /**
     * Applique une rotation d'un certain angle sur un point.
     * @param  {Point} point Le point
     * @param  {float} angle L'angle en radians
     * @param  {Point} center Le centre autour duquel effectuer la rotation
     */
    rotatePoint(point, angle, center) {
        let s = Math.sin(angle),
            c = Math.cos(angle),
            x = point.x - center.x,
            y = point.y - center.y,
            newX = x * c - y * s + center.x,
            newY = x * s + y * c + center.y;
        return { 'x': newX, 'y': newY };
    }


    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
