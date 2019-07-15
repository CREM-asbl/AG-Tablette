import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class ZoomPlaneAction extends Action {
    constructor(name) {
        super(name);

        //Translation à appliquer
        this.scaleOffset = null;
    }

    saveToObject() {
        let save = {
            'name': this.name,
            'scaleOffset': this.scaleOffset
        };
        return save;
    }

    initFromObject(save) {
        this.name = save.name;
        this.scaleOffset = save.scaleOffset;
    }

    checkDoParameters() {
        if(!Number.isFinite(this.scaleOffset))
            return false;
        return true;
    }

    checkUndoParameters() {
        return this.checkDoParameters();
    }

    do() {
        if(!this.checkDoParameters()) return;

        let originalZoom = app.workspace.zoomLevel,
            newZoom = originalZoom * this.scaleOffset;

        app.workspace.setZoomLevel(newZoom);
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let originalZoom = app.workspace.zoomLevel,
            newZoom = originalZoom * (1/this.scaleOffset);

        app.workspace.setZoomLevel(newZoom);
    }


    //TODO: enregistrer les valeurs pertinentes des
    //      paramètres (ex: ajustement automatique activé?)
}
