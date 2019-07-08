import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class CreateAction extends Action {
    constructor(name) {
        super(name);

        //La forme que l'on souhaite ajouter
        this.shapeToAdd = null;

        //Les coordonnées
        this.coordinates = null;

        //Id de la forme ajoutée
        this.shapeId = null;
    }

    checkDoParameters() {
        if(!this.shapeToAdd instanceof Shape)
            return false;
        if(!this.coordinates || this.coordinates.x === undefined
            || this.coordinates.y === undefined)
            return false;
        return true;
    }

    checkUndoParameters() {
        if(!this.shapeId)
            return false;
        return true;
    }

    do() {
        if(!this.checkDoParameters()) return;

        let shape = this.shapeToAdd;
        shape.x = this.coordinates.x - shape.refPoint.x;
        shape.y = this.coordinates.y - shape.refPoint.y;
        if(this.shapeId) shape.id = this.shapeId;
        else this.shapeId = shape.id;
        app.workspace.addShape(shape);
    }

    undo() {
        if(!this.checkUndoParameters()) return;
        let shape = app.workspace.getShapeById(this.shapeId);
        app.workspace.removeShape(shape);
    }


    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
