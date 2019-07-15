import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class BuildCenterAction extends Action {
    constructor(name) {
        super(name);

        //L'id de la forme dont on va colorier les bords
        this.shapeId = null;
    }

    saveToObject() {
        let save = {
            'name': this.name,
            'shapeId': this.shapeId
        };
        return save;
    }

    initFromObject(save) {
        this.name = save.name;
        this.shapeId = save.shapeId;
    }

    checkDoParameters() {
        if(!this.shapeId)
            return false;
        return true;
    }

    checkUndoParameters() {
        return this.checkDoParameters();
    }

    do() {
        if(!this.checkDoParameters()) return;

        let shape = app.workspace.getShapeById(this.shapeId);
        shape.isCenterShown = true;
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let shape = app.workspace.getShapeById(this.shapeId);
        shape.isCenterShown = false;
    }


    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
