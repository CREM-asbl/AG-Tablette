import { app } from '../App'
import { ZoomPlaneAction } from './Actions/ZoomPlane'
import { State } from './State'
import { distanceBetweenPoints } from '../Tools/geometry'
import { Points } from '../Tools/points'

/**
 * Zoomer/Dézoomer le plan
 */
export class PermanentZoomPlaneState extends State {
    constructor() {
        super("permanent_zoom_plane");

        this.currentStep = null; // listen-canvas-click -> zooming-plane

        this.baseDist = null;

        this.lastDist = null;

        this.centerProp = null;
    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.actions = [new ZoomPlaneAction(this.name)];

        this.currentStep = "listen-canvas-click";
        this.baseDist = null;
        this.lastDist = null;
        this.centerProp = null;
    }

    onMouseUp(clickCoordinates, event) {
        if(this.currentStep != "zooming-plane") return;
        if(event.type!="touchend") {
            app.showMessageOnCanvas("end: ", event.type);
             return;
        }

        let offset = this.lastDist / this.baseDist,
            actualZoom = app.workspace.zoomLevel,
            minZoom = app.settings.get('minZoomLevel'),
            maxZoom = app.settings.get('maxZoomLevel');

        if(offset*actualZoom > maxZoom) {
            // -> offset*actualZoom = maxZoom
            offset = maxZoom / actualZoom - 0.001;
        }
        if(offset*actualZoom < minZoom) {
            offset = minZoom / actualZoom + 0.001;
        }

        this.actions[0].scaleOffset = offset;
        this.actions[0].originalZoom = actualZoom;
        this.actions[0].originalTranslateOffset = Points.copy(app.workspace.translateOffset);
        this.actions[0].centerProp = this.centerProp;

        this.executeAction();
        this.start();
        app.interactionAPI.releaseFocus();
    }

    onMouseMove(clickCoordinates, event) {
        if(event.type != "touchmove" || event.touches.length !== 2) return;

        if(this.currentStep == "listen-canvas-click") {

            let point1 = { x: event.touches[0].clientX, y: event.touches[0].clientY },
                point2 = { x: event.touches[1].clientX, y: event.touches[1].clientY };
            this.centerProp = {
                    'x': ((point1.x + point2.x) /2 - window.canvasLeftShift) / app.cvsDiv.clientWidth,
                    'y': ((point1.y + point2.y) /2) / app.cvsDiv.clientHeight
                };
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
                minZoom = app.settings.get('minZoomLevel'),
                maxZoom = app.settings.get('maxZoomLevel');
            if(scaleOffset*originalZoom > maxZoom) {
                // -> scaleOffset*originalZoom = maxZoom
                scaleOffset = maxZoom / originalZoom - 0.001;
            }
            if(scaleOffset*originalZoom < minZoom) {
                scaleOffset = minZoom / originalZoom + 0.001;
            }

            let originalTranslateOffset = app.workspace.translateOffset,
                newZoom = originalZoom * scaleOffset,
                actualWinSize = {
                    'x': app.cvsDiv.clientWidth / originalZoom,
                    'y': app.cvsDiv.clientHeight / originalZoom
                },
                newWinSize = {
                    'x': actualWinSize.x / scaleOffset,
                    'y': actualWinSize.y / scaleOffset
                },
                newTranslateoffset = {
                    'x': (originalTranslateOffset.x/originalZoom - ((actualWinSize.x - newWinSize.x)*this.centerProp.x))*newZoom,
                    'y': (originalTranslateOffset.y/originalZoom - ((actualWinSize.y - newWinSize.y)*this.centerProp.y))*newZoom
                };

            app.showMessageOnCanvas(this.centerProp);

            app.workspace.setZoomLevel(newZoom, false);
            app.workspace.setTranslateOffset(newTranslateoffset);

            app.workspace.setTranslateOffset(originalTranslateOffset, false);
            app.workspace.setZoomLevel(originalZoom, false);
        }
    }
}