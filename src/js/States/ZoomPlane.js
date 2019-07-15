import { app } from '../App'
import { ZoomPlaneAction } from './Actions/ZoomPlane'
import { State } from './State'
import { distanceBetweenPoints } from '../Tools/geometry'
/**
 * Zoomer/Dézoomer le plan
 */
export class ZoomPlaneState extends State {
    //TODO: faire un zoom centré au milieu de l'écran et pas en haut à gauche.
    constructor() {
        super("zoom_plane");

        this.action = null;

        this.currentStep = null; // listen-canvas-click -> zooming-plane

        this.baseDist = null;
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.action = new ZoomPlaneAction(this.name);

        this.currentStep = "listen-canvas-click";
        this.baseDist = null;

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "none", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        ); //TODO: désactiver la contrainte de sélection pour cet état.
    }

    abort() {
        this.start();
    }

    onMouseDown(clickCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        this.baseDist = this.getDist(clickCoordinates);

        this.currentStep = "zooming-plane";
    }

    onMouseUp(clickCoordinates, event) {
        if(this.currentStep != "zooming-plane") return;

        this.action.scaleOffset = this.getDist(clickCoordinates)/this.baseDist;

        this.executeAction();
        this.start();
    }

    onMouseMove(clickCoordinates, event) {
        if(this.currentStep != "zooming-plane") return;

        let newDist = this.getDist(clickCoordinates),
            scaleOffset = newDist / this.baseDist,
            originalZoom = app.workspace.zoomLevel,
            newZoom = originalZoom * scaleOffset;

        app.workspace.setZoomLevel(newZoom);
        app.workspace.setZoomLevel(originalZoom, false);
    }

    getDist(clickCoordinates) {
        let origin = {'x': 0, 'y': 0},
            newDist = distanceBetweenPoints(origin, clickCoordinates);
        if (newDist == 0) newDist = 0.001;
        return newDist;
    }
}
