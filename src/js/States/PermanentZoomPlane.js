import { app } from '../App'
import { ZoomPlaneAction } from './Actions/ZoomPlane'
import { State } from './State'
import { distanceBetweenPoints } from '../Tools/geometry'

/**
 * Zoomer/Dézoomer le plan
 */
export class PermanentZoomPlaneState extends State {
    //TODO: faire un zoom centré au milieu de l'écran et pas en haut à gauche.
    constructor() {
        super("permanent_zoom_plane");

        this.currentStep = null; // listen-canvas-click -> zooming-plane

        this.baseDist = null;

        this.lastDist = null;
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.actions = [new ZoomPlaneAction(this.name)];

        this.currentStep = "listen-canvas-click";
        this.baseDist = null;
        this.lastDist = null;
    }

    onMouseUp(clickCoordinates, event) {
        if(this.currentStep != "zooming-plane") return;
        if(event.type!="touchend") return;

        this.actions[0].scaleOffset = this.lastDist / this.baseDist;

        this.executeAction();
        this.start();
        app.interactionAPI.releaseFocus();
    }

    onMouseMove(clickCoordinates, event) {
        if(event.type != "touchmove" || event.touches.length !== 2) return;

        if(this.currentStep == "listen-canvas-click") {

            let point1 = { x: event.touches[0].clientX, y: event.touches[0].clientY },
                point2 = { x: event.touches[1].clientX, y: event.touches[1].clientY };
            this.baseDist = distanceBetweenPoints(point1, point2);
            if(this.baseDist == 0) this.baseDist = 0.001;

            app.showMessageOnCanvas(JSON.stringify(point1));
            app.showMessageOnCanvas(JSON.stringify(point2));
            app.showMessageOnCanvas(this.baseDist);

            this.currentStep = "zooming-plane";
            app.interactionAPI.getFocus(this);
        } else {
            let point1 = { x: event.touches[0].clientX, y: event.touches[0].clientY },
                point2 = { x: event.touches[1].clientX, y: event.touches[1].clientY },
                newDist = distanceBetweenPoints(point1, point2);
            if (newDist == 0) newDist = 0.001;
            this.lastDist = newDist;

            let scaleOffset = newDist / this.baseDist,
                originalZoom = app.workspace.zoomLevel,
                newZoom = originalZoom * scaleOffset;

            app.workspace.setZoomLevel(newZoom);
            app.workspace.setZoomLevel(originalZoom, false);
            app.showMessageOnCanvas("onMouseMove "+newZoom);
        }
    }
}
