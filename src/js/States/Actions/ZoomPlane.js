import { app } from '../../App'
import { Action } from './Action'
import { Shape } from '../../Objects/Shape'

//TODO retenir le zoom original, pour éviter les erreurs de précision?
export class ZoomPlaneAction extends Action {
    constructor(name) {
        super(name);

        //Translation à appliquer
        this.scaleOffset = null;

        this.originalZoom = null;

        this.originalTranslateOffset = null;

        this.centerProp = null;
    }

    saveToObject() {
        let save = {
            'name': this.name,
            'scaleOffset': this.scaleOffset,
            'originalZoom': this.originalZoom,
            'originalTranslateOffset': this.originalTranslateOffset,
            'centerProp': this.centerProp
        };
        return save;
    }

    initFromObject(save) {
        this.name = save.name;
        this.scaleOffset = save.scaleOffset;
        this.originalZoom = save.originalZoom;
        this.originalTranslateOffset = save.originalTranslateOffset;
        this.centerProp = save.centerProp;
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

        let newZoom = this.originalZoom * this.scaleOffset,
            actualWinSize = {
                'x': app.cvsDiv.clientWidth / this.originalZoom,
                'y': app.cvsDiv.clientHeight / this.originalZoom
            },
            newWinSize = {
                'x': actualWinSize.x / this.scaleOffset,
                'y': actualWinSize.y / this.scaleOffset
            },
            newTranslateoffset = {
                'x': (this.originalTranslateOffset.x/this.originalZoom - ((actualWinSize.x - newWinSize.x)*this.centerProp.x))*newZoom,
                'y': (this.originalTranslateOffset.y/this.originalZoom - ((actualWinSize.y - newWinSize.y)*this.centerProp.y))*newZoom
            };

        app.workspace.setZoomLevel(newZoom, false);
        app.workspace.setTranslateOffset(newTranslateoffset);
    }

    undo() {
        if(!this.checkUndoParameters()) return;

        let originalZoom = app.workspace.zoomLevel,
            newZoom = originalZoom * (1/this.scaleOffset);

        app.workspace.setZoomLevel(newZoom);
    }
}
