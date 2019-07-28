import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class ToBackgroundAction extends Action {
    constructor(name) {
        super(name);

        //L'index original de la forme dans workspace.shapes
        this.oldIndex = null;
    }

    saveToObject() {
        let save = {
            'name': this.name,
            'oldIndex': this.oldIndex
        };
        return save;
    }

    initFromObject(save) {
        this.name = save.name;
        this.oldIndex = save.oldIndex;
    }

    checkDoParameters() {
        if(!Number.isFinite(this.oldIndex))
            return false;
        return true;
    }

    checkUndoParameters() {
        return this.checkDoParameters();
    }

    do() {
        if(!this.checkDoParameters()) return;

        let shape = app.workspace.shapes.splice(this.oldIndex, 1)[0];
        app.workspace.shapes.unshift(shape);
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let shape = app.workspace.shapes.splice(0, 1)[0];

        app.workspace.shapes.splice(this.oldIndex, 0, shape);
    }
}
