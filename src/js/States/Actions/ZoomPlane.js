import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

export class ZoomPlaneAction extends Action {
    constructor(name) {
        super(name);

        //Translation à appliquer
        this.scaleOffset = null;
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
