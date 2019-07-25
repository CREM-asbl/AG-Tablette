import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'
import { ShapeGroup } from '../../Objects/ShapeGroup'

export class UngroupAction extends Action {
    constructor(name) {
        super(name);

        //L'id du groupe que l'on supprime
        this.groupId = null;

        //Liste des id des formes du groupe qui a été supprimé
        this.groupShapesIds = null;

        //Index (dans le tableau de groupes) du groupe qui a été supprimé
        this.groupIndex = null;
    }

    saveToObject() {
        let save = {
            'name': this.name,
            'groupId': this.groupId,
            'groupShapesIds': this.groupShapesIds,
            'groupIndex': this.groupIndex
        };
        return save;
    }

    initFromObject(save) {
        this.name = save.name;
        this.groupId = save.groupId;
        this.groupShapesIds = save.groupShapesIds;
        this.groupIndex = save.groupIndex;
    }

    checkDoParameters() {
        if(!this.groupId)
            return false;
        return true;
    }

    checkUndoParameters() {
        if(!this.groupId || !Number.isFinite(this.groupIndex))
            return false;
        if(!this.groupShapesIds || this.groupShapesIds.length<2)
            return false;
        return true;
    }

    do() {
        if(!this.checkDoParameters()) return;

        this.groupShapesIds = [];
        let group = app.workspace.getGroup(this.groupId);
        this.groupIndex = app.workspace.getGroupIndex(group);

        group.shapes.forEach(shape => {
            this.groupShapesIds.push(shape.id);
        });
        app.workspace.deleteGroup(group);
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let shape1 = app.workspace.getShapeById(this.groupShapesIds[0]),
            shape2 = app.workspace.getShapeById(this.groupShapesIds[1]),
            group = new ShapeGroup(shape1, shape2);
        group.id = this.groupId;
        this.groupShapesIds.slice(2).forEach(shapeId => {
            let shape = app.workspace.getShapeById(shapeId);
            group.addShape(shape);
        });
        app.workspace.addGroup(group, 'user', this.groupIndex);
    }

    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
