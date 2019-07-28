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

        //Taille de la forme. Pas utilisé ici, juste pour info (pour l'aide)
        this.shapeSize = null;
    }

    saveToObject() {
        let save = {
            'name': this.name,
            'shapeToAdd': this.shapeToAdd.saveToObject(),
            'coordinates': this.coordinates,
            'shapeId': this.shapeId,
            'shapeSize': this.shapeSize
        };
        return save;
    }

    initFromObject(save) {
        this.name = save.name;

        this.shapeToAdd = new Shape({'x': 0, 'y': 0}, []);
		this.shapeToAdd.initFromObject(save.shapeToAdd);

        this.coordinates = save.coordinates;
        this.shapeId = save.shapeId;
        this.shapeSize = save.shapeSize;
    }

    checkDoParameters() {
        if(!this.shapeToAdd instanceof Shape || this.shapeSize==null)
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

        let shape = this.shapeToAdd.copy();

        shape.x = this.coordinates.x;
        shape.y = this.coordinates.y;
        if(this.shapeId) shape.id = this.shapeId;
        else this.shapeId = shape.id;
        app.workspace.addShape(shape);
    }

    undo() {
        if(!this.checkUndoParameters()) return;
        let shape = app.workspace.getShapeById(this.shapeId);
        app.workspace.removeShape(shape);
    }
}
