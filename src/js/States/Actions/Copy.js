import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'
import { ShapeGroup } from '../../Objects/ShapeGroup'

export class CopyAction extends Action {
    constructor() {
        super();

        //L'id de la forme sélectionnée
        this.shapeId = null;

        //Le décalage entre la position de la forme originale et celle de la copie
        this.transformation = null;

        /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
        this.involvedShapesIds = [];

        //Les id des copies des formes à dupliquer
        this.newShapesIds = [];

        //L'id du nouvel userGroup créé (si la forme dupliquée faisait partie
        //d'un autre userGroup)
        this.createdUsergroupId = null;

        //L'index (dans le tableau de groupes du worksapce) de l'userGroup créé
        this.createdUserGroupIndex = null;
    }

    saveToObject() {
        let save = {
            
            'shapeId': this.shapeId,
            'transformation': this.transformation,
            'involvedShapesIds': this.involvedShapesIds,
            'newShapesIds': this.newShapesIds,
            'createdUsergroupId': this.createdUsergroupId,
            'createdUserGroupIndex': this.createdUserGroupIndex
        };
        return save;
    }

    initFromObject(save) {
        
        this.shapeId = save.shapeId;
        this.transformation = save.transformation;
        this.involvedShapesIds = save.involvedShapesIds;
        this.newShapesIds = save.newShapesIds;
        this.createdUsergroupId = save.createdUsergroupId;
        this.createdUserGroupIndex = save.createdUserGroupIndex;
    }

    checkDoParameters() {
        if(!this.shapeId)
            return false;
        if(!this.transformation || this.transformation.x === undefined
            || this.transformation.y === undefined)
            return false;
        return true;
    }

    checkUndoParameters() {
        if(this.involvedShapesIds.length != this.newShapesIds.length)
            return false;
        return true;
    }

    do() {
        if(!this.checkDoParameters()) return;

        let shapesList = [];

        this.involvedShapesIds.forEach((id, index) => {
            let s = app.workspace.getShapeById(id),
                copy = s.copy(),
                baseCoords = s.getCoordinates(),
                newCoords = {
                    'x': baseCoords.x + this.transformation.x,
                    'y': baseCoords.y + this.transformation.y
                };
            shapesList.push(copy);
            copy.setCoordinates(newCoords);
            if(this.newShapesIds.length>index)
                copy.id = this.newShapesIds[index];
            else
                this.newShapesIds.push(copy.id);
            app.workspace.addShape(copy);
        });

        //Si nécessaire, créer le userGroup
        if(shapesList.length>1) {
            let userGroup = new ShapeGroup(shapesList[0], shapesList[1]);
            if(Number.isFinite(this.createdUsergroupId))
                userGroup.id = this.createdUsergroupId;
            else
                this.createdUsergroupId = userGroup.id;
            shapesList.splice(2).forEach(s => {
                userGroup.addShape(s);
            });
            if(Number.isFinite(this.createdUserGroupIndex))
                app.workspace.addGroup(userGroup, 'user', this.createdUserGroupIndex);
            else {
                app.workspace.addGroup(userGroup, 'user');
                this.createdUserGroupIndex = app.workspace.getGroupIndex(userGroup);
            }
        }
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        this.newShapesIds.forEach(id => {
            let s = app.workspace.getShapeById(id);
            app.workspace.deleteShape(s);
        });

        if(this.newShapesIds.length>1) {
            let group = app.workspace.getGroup(this.createdUsergroupId, 'user');
            app.workspace.deleteGroup(group, 'user');
        }
    }
}
