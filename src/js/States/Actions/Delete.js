import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'
import { ShapeGroup } from '../../Objects/ShapeGroup'

export class DeleteAction extends Action {
    constructor(name) {
        super(name);

        //La forme qui doit être supprimée
        this.shape = null;


        /*
        Si la forme à supprimer fait partie d'un userGroup:
         */

        //l'id de ce userGroup
        this.userGroupId = null;

        //S'il restait 1 forme dans le userGroup, l'id de cette forme
        this.userGroupLastShapeId = null;

        //Si le groupe doit être supprimé, son index dans le tableau des groupes
        this.userGroupIndex = null;

        //Le userGroup doit-il être supprimé (car vide) ?
        this.deleteUserGroup = false;
    }

    saveToObject() {
        let save = {
            'name': this.name,
            'shape': this.shape.saveToObject(),
            'userGroupId': this.userGroupId,
            'userGroupLastShapeId': this.userGroupLastShapeId,
            'userGroupIndex': this.userGroupIndex,
            'deleteUserGroup': this.deleteUserGroup,
        };
        return save;
    }

    initFromObject(save) {
        this.name = save.name;

        this.shape = new Shape({'x': 0, 'y': 0}, []);
		this.shape.initFromObject(save.shape);

        this.userGroupId = save.userGroupId;
        this.userGroupLastShapeId = save.userGroupLastShapeId;
        this.userGroupIndex = save.userGroupIndex;
        this.deleteUserGroup = save.deleteUserGroup;
    }

    checkDoParameters() {
        if(!this.shape)
            return false;
        return true;
    }

    checkUndoParameters() {
        return this.checkDoParameters();
    }

    do() {
        if(!this.checkDoParameters()) return;

        let shape = this.shape,
            userGroup = app.workspace.getShapeGroup(shape);

        if(userGroup)
            userGroup.removeShape(shape);
        app.workspace.removeShape(shape);

        //Supprimer le userGroup s'il existe et s'il ne reste qu'une forme.
        this.deleteUserGroup = false;
        this.userGroupIndex = null;
        if(userGroup) {
            this.userGroupId = userGroup.id;
            if(userGroup.shapes.length==1) {
                this.deleteUserGroup = true;
                this.userGroupLastShapeId = userGroup.shapes[0].id;
                this.userGroupIndex = app.workspace.getGroupIndex(userGroup);
                app.workspace.deleteGroup(userGroup);
            }
        }
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let shape = this.shape;


        app.workspace.addShape(shape);

        if(this.userGroupId) {
            let userGroup;
            if(this.deleteUserGroup) {
                let s1 = app.workspace.getShapeById(this.userGroupLastShapeId),
                    s2 = shape;
                userGroup = new ShapeGroup(s1, s2);
                userGroup.id = this.userGroupId;
                app.workspace.addGroup(userGroup, this.userGroupIndex);
            } else {
                userGroup = app.workspace.getGroup(this.userGroupId);
            }

            userGroup.addShape(shape);
        }
    }


    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
