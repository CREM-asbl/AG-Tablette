import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class CreateAction extends Action {
    constructor(name) {
        super(name);
        //La forme que l'on souhaite ajouter
        this.selectedShape = null;

        //Les coordonnées
        this.coordinates = null;

        //Id de la forme ajoutée
        this.shapeId = null;
    }

    checkDoParameters() {
        if(!this.selectedShape instanceof Shape)
            return false;
        if(!this.coordinates || this.coordinates.x === undefined || this.coordinates.y === undefined)
            return false;
        return true;
    }

    checkUndoParameters() {
        if(!this.checkDoParameters())
            return false;
        if(!this.shapeId)
            return false;
    }

    do() {
        if(!this.checkDoParameters()) return;
        let shape = this.selectedShape.copy();
        shape.x = this.coordinates.x - shape.refPoint.x;
        shape.y = this.coordinates.y - shape.refPoint.y;
        this.shapeId = shape.id;
        app.workspace.addShape(shape);
    }

    undo() {
        if(!this.checkUndoParameters()) return;
        let shape = app.workspace.getShapeById(this.shapeId);
        app.workspace.removeShape(shape);
    }


    //TODO: enregistrer les valeurs pertinentes des paramètres (ex: ajustement automatique activé?)
}
