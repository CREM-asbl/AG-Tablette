import { app } from '../App'
import { ZoomPlaneAction } from './Actions/ZoomPlane'
import { State } from './State'
import { distanceBetweenPoints } from '../Tools/general'
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

        this.mode = null;

        this.lastDist = null;
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.action = new ZoomPlaneAction(this.name);

        this.currentStep = "listen-canvas-click";
        this.baseDist = null;
        this.mode = "one-finger";

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "none", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        ); //TODO: désactiver la contrainte de sélection pour cet état.
    }

    onMouseDown(clickCoordinates, event) {
        if(this.currentStep != "listen-canvas-click") return;

        this.mode=="one-finger";
        let origin = {'x': 0, 'y': 0};
        this.baseDist = distanceBetweenPoints(origin, clickCoordinates);
        if (this.baseDist == 0) this.baseDist = 0.001;

        this.currentStep = "zooming-plane";
    }

    onMouseUp(clickCoordinates, event) {
        if(this.currentStep != "zooming-plane") return;

        let newDist;
        if(this.mode=="one-finger") {
            let origin = {'x': 0, 'y': 0};
            newDist = distanceBetweenPoints(origin, clickCoordinates);
        } else {
            newDist = this.lastDist;
        }
        if (newDist == 0) newDist = 0.001;
        this.action.scaleOffset = newDist / this.baseDist;

        this.executeAction();
        this.start();
    }

    onMouseMove(clickCoordinates, event) {
        if(this.currentStep != "zooming-plane") return;

        if(this.mode=="two-finger" && event.type == "touchmove"
            && event.touches && event.touches.length !== 2)
            return;


        if(this.mode=="one-finger"
            && event.type == "touchmove"
            && event.touches && event.touches.length === 2) {
            //On change de mode!
            this.mode = "two-finger";
            let point1 = { x: event.touches[0].clientX, y: event.touches[0].clientY },
                point2 = { x: event.touches[1].clientX, y: event.touches[1].clientY };
            this.baseDist = distanceBetweenPoints(point1, point2);
        }

        let newDist;
        if(this.mode=="one-finger") {
            let origin = {'x': 0, 'y': 0};
            newDist = distanceBetweenPoints(origin, clickCoordinates);
        } else {
            let point1 = { x: event.touches[0].clientX, y: event.touches[0].clientY },
                point2 = { x: event.touches[1].clientX, y: event.touches[1].clientY };
            newDist = distanceBetweenPoints(point1, point2);
            this.lastDist = newDist;
        }
        if (newDist == 0) newDist = 0.001;


        let scaleOffset = newDist / this.baseDist,
            originalZoom = app.workspace.zoomLevel,
            newZoom = originalZoom * scaleOffset;

        app.workspace.setZoomLevel(newZoom);
        app.workspace.setZoomLevel(originalZoom, false);
    }
}
