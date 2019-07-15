import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'
import { UserShapeGroup } from '../../Objects/UserShapeGroup'
import { SystemShapeGroup } from '../../Objects/SystemShapeGroup'

/**
 * TODO: refactoriser cette classe...
 */
export class DeleteAction extends Action {
    constructor(name) {
        super(name);

        //La forme qui doit être supprimée
        this.shape = null;

        /*
        Si la forme à supprimer fait partie d'un systemGroup:
         */

        //id de ce  systemGroup
        this.sysGroupId = null;

        //Formes à supprimer, et la source de chaque forme dans le sysGroup
        this.deleteList = null;

        //Le systemGroup doit-il être supprimé (car vide) ?
        this.deleteSystemGroup = false;

        //S'il restait 1 forme dans le userGroup, l'id de cette forme
        this.systemGroupLastShapeId = null;


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
            'sysGroupId': this.sysGroupId,
            'deleteList': this.deleteList ? this.deleteList.map(itm => {
                return {
                    'srcShapeId': itm.srcShapeId,
                    'shape': itm.shape.saveToObject()
                };
            }) : null,
            'deleteSystemGroup': this.deleteSystemGroup,
            'systemGroupLastShapeId': this.systemGroupLastShapeId,
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

        this.sysGroupId = save.sysGroupId;
        this.deleteList = save.deleteList ? save.deleteList.map(itm => {
            let shape = new Shape({'x': 0, 'y': 0}, []);
            shape.initFromObject(itm.shape);
            return {
                'srcShapeId': itm.srcShapeId,
                'shape': shape
            };
        }) : null;
        this.deleteSystemGroup = save.deleteSystemGroup;
        this.systemGroupLastShapeId = save.systemGroupLastShapeId;
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
            sysGroup = app.workspace.getShapeGroup(shape, 'system'),
            userGroup = app.workspace.getShapeGroup(shape, 'user');

        if(sysGroup) {
            this.sysGroupId = sysGroup.id;

            //Liste des formes à supprimer:
            let shapesToDelete = [];
            let traveler = shape => {
                let children = sysGroup.getShapeChilds(shape);
                children.forEach(child => traveler(child));
                shapesToDelete.push(shape);
            };
            traveler(shape);

            //Supprimer ces formes
            this.deleteList = shapesToDelete.map(s => {
                let src = sysGroup.getSourceShape(s);
                sysGroup.removeLeafShape(s);
                if(userGroup)
                    userGroup.removeShape(s);
                app.workspace.removeShape(s);

                return {
                    'srcShapeId': (src === null) ? -1 : src.id,
                    'shape': s
                };
            });

            //Supprimer le groupe s'il est vide ou s'il reste une forme
            this.deleteSystemGroup = false;
            if(sysGroup.shapes.length<2) {
                this.deleteSystemGroup = true;
                this.systemGroupLastShapeId = null;
                if(sysGroup.shapes.length==1)
                    this.systemGroupLastShapeId = sysGroup.shapes[0].id;
                app.workspace.deleteGroup(sysGroup, 'system');
            }
        } else {
            if(userGroup)
                userGroup.removeShape(shape);
            app.workspace.removeShape(shape);
        }

        //Supprimer le userGroup s'il existe et s'il reste 0 ou 1 forme.
        this.deleteUserGroup = false;
        this.userGroupIndex = null;
        if(userGroup) {
            this.userGroupId = userGroup.id;
            if(userGroup.shapes.length<2) {
                this.deleteUserGroup = true;
                this.userGroupLastShapeId = null;
                if(userGroup.shapes.length==1)
                    this.userGroupLastShapeId = userGroup.shapes[0].id;
                this.userGroupIndex = app.workspace.getGroupIndex(userGroup, 'user');
                app.workspace.deleteGroup(userGroup, 'user');
            }
        }
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let shape = this.shape;

        if(this.sysGroupId) {
            this.deleteList.reverse();

            let sysGroup, shapesAlreayInGroup = 0;
            if(this.deleteSystemGroup) {
                let s1, s2;
                if(this.systemGroupLastShapeId) {
                    shapesAlreayInGroup = 1;
                    s1 = app.workspace.getShapeById(this.systemGroupLastShapeId);
                    s2 = this.deleteList[0].shape;
                } else {
                    shapesAlreayInGroup = 2;
                    s1 = this.deleteList[0].shape;
                    s2 = this.deleteList[1].shape;
                }
                sysGroup = new SystemShapeGroup(s1, s2);
                sysGroup.id = this.sysGroupId;
                app.workspace.addGroup(sysGroup, 'system');
            } else {
                sysGroup = app.workspace.getGroup(this.sysGroupId, 'system');
            }

            this.deleteList.forEach((itm, index) => {
                app.workspace.addShape(itm.shape);
                if(index<shapesAlreayInGroup) return;
                let shape = itm.shape.copy();
                shape.id = itm.shape.id;

                let srcShape = app.workspace.getShapeById(itm.srcShapeId);
                sysGroup.addShape(shape, srcShape);
            });
        }
        else {
            app.workspace.addShape(shape);
        }

        if(this.userGroupId) {
            let userGroup, shapesAlreayInGroup = 0;
            if(this.deleteUserGroup) {
                let s1, s2;
                if(this.userGroupLastShapeId) {
                    shapesAlreayInGroup = 1;
                    s1 = app.workspace.getShapeById(this.userGroupLastShapeId);
                    s2 = shape;
                } else {
                    shapesAlreayInGroup = 2;
                    s1 = this.deleteList[0].shape;
                    s2 = this.deleteList[1].shape;
                }
                userGroup = new UserShapeGroup(s1, s2);
                userGroup.id = this.userGroupId;
                app.workspace.addGroup(userGroup, 'user', this.userGroupIndex);
            } else {
                userGroup = app.workspace.getGroup(this.userGroupId, 'user');
            }

            if(this.sysGroupId) {
                this.deleteList.forEach((itm, index) => {
                    if(index<shapesAlreayInGroup) return;

                    userGroup.addShape(itm.shape);
                });
            } else if(!this.deleteUserGroup) {
                userGroup.addShape(shape);
            }

        }

        if(this.sysGroupId) {
            this.deleteList.reverse();
        }
    }


    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
