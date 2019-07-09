import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'
import { SystemShapeGroup } from '../../Objects/SystemShapeGroup'

export class CreateAction extends Action {
    constructor(name) {
        super(name);

        //La forme que l'on souhaite ajouter
        this.shapeToAdd = null;

        //Les coordonnées
        this.coordinates = null;

        //Id de la forme ajoutée
        this.shapeId = null;

        //ID de la forme liée (systemShapeGroup), si le clic créant la forme
        //actuelle a été fait près d'un point d'une autre forme.
        this.sourceShapeId = null;

        //ID du systemGroupé créé (optionnel)
        this.createdGroupId = null;
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

        if(this.sourceShapeId) {
            let srcShape = app.workspace.getShapeById(this.sourceShapeId),
                sysGroup = app.workspace.getShapeGroup(srcShape, 'system');
            if(sysGroup) {
                sysGroup.addShape(shape, srcShape);
            } else {
                let group = new SystemShapeGroup(srcShape, shape);
                if(this.createdGroupId) group.id = this.createdGroupId;
                else this.createdGroupId = group.id;

                app.workspace.addGroup(group, 'system');
            }
        }
    }

    undo() {
        if(!this.checkUndoParameters()) return;
        let shape = app.workspace.getShapeById(this.shapeId);
        app.workspace.removeShape(shape);

        if(this.sourceShapeId) {
            let srcShape = app.workspace.getShapeById(this.sourceShapeId),
                sysGroup = app.workspace.getShapeGroup(shape, 'system');
            if(sysGroup.shapes.length==2) {
                 app.workspace.deleteGroup(sysGroup, 'system');
            } else {
                sysGroup.removeLeafShape(shape);
            }
        }
    }


    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
