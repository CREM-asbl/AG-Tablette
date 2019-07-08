import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class ReverseAction extends Action {
    constructor(name) {
        super(name);

        //L'id de la forme que l'on tourne
        this.shapeId = null;

        //L'axe de symétrie utilisé pour le retournement
        this.symmetricalArchOrientation = null; //V, H, NW, SW
    }

    checkDoParameters() {
        if(!this.shapeId)
            return false;
        if(!this.symmetricalArchOrientation)
            return false;
        return true;
    }

    checkUndoParameters() {
        return this.checkDoParameters();
    }

    do() {
        if(!this.checkDoParameters()) return;

        let shape = app.workspace.getShapeById(this.shapeId),
            arch = this.getSymmetricalArch();
        this.reverseShape(shape, arch, 1);
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let shape = app.workspace.getShapeById(this.shapeId),
            arch = this.getSymmetricalArch();
        this.reverseShape(shape, arch, 1);
    }

    getSymmetricalArch() {
        let shape = app.workspace.getShapeById(this.shapeId),
            arch = {
                'type': this.symmetricalArchOrientation,
                'center': shape.getAbsoluteCenter(),
                'p1': { 'x': null, 'y': null },
                'p2': { 'x': null, 'y': null }
            };
        if(arch.type=="V") {
            arch.p1 = { 'x': 0, 'y': -1 }
            arch.p2 = { 'x': 0, 'y': 1 }
        } else if(arch.type=="NW") {
            arch.p1 = { 'x': -1, 'y': -1 }
            arch.p2 = { 'x': 1, 'y': 1 }
        } else if(arch.type=="H") {
            arch.p1 = { 'x': -1, 'y': 0 }
            arch.p2 = { 'x': 1, 'y': 0 }
        } else { // SW
            arch.p1 = { 'x': -1, 'y': 1 }
            arch.p2 = { 'x': 1, 'y': -1 }
        }
        return arch;
    }

    /**
     * Retourne une forme
     * @param  {Shape} shape       la forme à retourner
     * @param  {Object} arch        L'axe de symétrie à utiliser
     * @param  {float} progression  Entre 0 et 1, 1 pour un retournement complet
     */
    reverseShape(shape, arch, progression) {
        var saveAxeCenter = arch.center;
        var newShapeCenter = this.computePointPosition(shape, arch, progression);
        arch.center = { 'x': 0, 'y': 0 };
        shape.x = newShapeCenter.x;
        shape.y = newShapeCenter.y;

        shape.buildSteps.forEach(bs => {
            let transformation = this.computePointPosition(bs.coordinates, arch, progression);
            bs.coordinates = transformation;
            if(bs.type=="segment") {
                bs.points.forEach(pt => {
                    let pointCoords = this.computePointPosition(pt, arch, progression);
                    pt.x = pointCoords.x;
                    pt.y = pointCoords.y;
                });
            }
        });
        shape.updateInternalState();
        shape.isReversed = !shape.isReversed;

        arch.center = saveAxeCenter;
    }


    /**
     * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale
     * @param  {Point} point    le point
     * @param  {Object} axe      L'axe de symétrie
     * @param  {float} progress La progression (entre 0 et 1)
     * @return {Point}          Nouvelles coordonnées
     */
    computePointPosition(point, axe, progress) {
        let center = null,
            p1x = axe.center.x + axe.p1.x,
            p1y = axe.center.y + axe.p1.y,
            p2x = axe.center.x + axe.p2.x,
            p2y = axe.center.y + axe.p2.y;

        //Calculer la projection du point sur l'axe.
        if (axe.type == 'V') {
            center = { 'x': p1x, 'y': point.y };
        } else if (axe.type == 'H') {
            center = { 'x': point.x, 'y': p1y };
        } else { // axe.type=='NW' || axe.type=='SW'
            let f_a = (p1y - p2y) / (p1x - p2x),
                f_b = p2y - f_a * p2x,
                x2 = (point.x + point.y * f_a - f_a * f_b) / (f_a * f_a + 1),
                y2 = f_a * x2 + f_b;
            center = {
                'x': x2,
                'y': y2
            };
        }
        //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
        let transformation = {
            'x': point.x + (2 * (center.x - point.x) * progress),
            'y': point.y + (2 * (center.y - point.y) * progress)
        };
        return transformation;
    }

    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
