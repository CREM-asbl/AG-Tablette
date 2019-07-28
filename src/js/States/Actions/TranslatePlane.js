import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class TranslatePlaneAction extends Action {
    constructor(name) {
        super(name);

        //Translation à appliquer
        this.offset = null;
    }

    saveToObject() {
        let save = {
            'name': this.name,
            'offset': this.offset
        };
        return save;
    }

    initFromObject(save) {
        this.name = save.name;
        this.offset = save.offset;
    }

    checkDoParameters() {
        if(!this.offset || this.offset.x === undefined
            || this.offset.y === undefined)
            return false;
        return true;
    }

    checkUndoParameters() {
        return this.checkDoParameters();
    }

    do() {
        if(!this.checkDoParameters()) return;

        let originalOffset = app.workspace.translateOffset,
            newOffset = {
                'x': originalOffset.x + this.offset.x,
                'y': originalOffset.y + this.offset.y
            };

        app.workspace.setTranslateOffset(newOffset);
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let originalOffset = app.workspace.translateOffset,
            newOffset = {
                'x': originalOffset.x - this.offset.x,
                'y': originalOffset.y - this.offset.y
            };

        app.workspace.setTranslateOffset(newOffset);
    }
}
