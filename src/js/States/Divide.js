import { app } from '../App'
import { DivideAction } from './Actions/Divide'
import { State } from './State'
import { Points } from '../Tools/points'

/**
 * Découper un segment (ou partie de segment) en X parties (ajoute X-1 points)
 */
export class DivideState extends State {

    constructor() {
        super("divide_segment");

        // choose-nb-parts -> listen-canvas-click -> select-second-point -> showing-points
        //                                        -> showing-segment
        this.currentStep = null;

        this.shape = null;

        this.timeoutRef = null;
    }

    /**
     * (ré-)initialiser l'état
     */
    start(openPopup = true) {
        this.actions = [new DivideAction(this.name)];

        this.currentStep = "choose-nb-parts";

        this.shape = null;
        this.timeoutRef = null;

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "none", "listShape": []},
            {"canSegment": "all", "listSegment": []},
            {"canPoint": "all", "pointTypes": ['segmentPoint', 'vertex'], "listPoint": []}
        );

        if(openPopup)
            document.querySelector("divide-popup").style.display = "block";
    }

    abort() {
        window.clearTimeout(this.timeoutRef);
    }

    setNumberOfparts(parts) {
         this.actions[0].numberOfparts = parseInt(parts);
         this.currentStep = "listen-canvas-click";
    }

    /**
     * Appelée par l'interactionAPI lorsqu'un point/segment a été sélectionnée (click)
     * @param  {Object} object            L'élément sélectionné
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(object, clickCoordinates, event) {
        if(this.currentStep != 'listen-canvas-click'
            && this.currentStep != 'select-second-point') return;

        if(this.currentStep == "listen-canvas-click") {
            if(object.type == "segment") {
                this.actions[0].shapeId = object.shape.id;
                this.actions[0].mode = 'segment';
                this.actions[0].segmentIndex = object.index;
                this.shape = object.shape;
                this.currentStep = 'showing-segment';
            } else {
                this.currentStep = "select-second-point";
                this.actions[0].mode = 'two_points';
                this.actions[0].shapeId = object.shape.id;
                this.actions[0].firstPoint = object;

                //Liste des points que l'on peut sélectionner comme 2ème point:
                let pointsList = this.getCandidatePoints(object);

                app.interactionAPI.setSelectionConstraints("click",
                    {"canShape": "none", "listShape": []},
                    {"canSegment": "none", "listSegment": []},
                    {
                        "canPoint": "some",
                        "pointTypes": ['segmentPoint', 'vertex'],
                        "listPoint": pointsList
                    }
                );
                return;
            }
        } else {
            this.actions[0].secondPoint = object;
            this.currentStep = 'showing-points';
        }

        window.clearTimeout(this.timeoutRef);
        this.timeoutRef = window.setTimeout(() => {
            this.execute();
        }, 500);
        app.drawAPI.askRefresh();
        app.drawAPI.askRefresh('upper');
    }

    execute() {
        this.executeAction();
        let parts = this.actions[0].numberOfparts;
        this.start(false);
        this.setNumberOfparts(parts);

        app.drawAPI.askRefresh();
        app.drawAPI.askRefresh('upper');
    }

    /**
     * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
     * @param  {Context2D} ctx              Le canvas
     * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
     */
    draw(ctx, mouseCoordinates) {

        if(this.currentStep == 'select-second-point') {
            let coords = this.actions[0].firstPoint.coordinates;
            app.drawAPI.drawPoint(ctx, coords, '#E90CC8', 2);
        }
        if(this.currentStep == 'showing-points') {
            let coords1 = this.actions[0].firstPoint.coordinates,
                coords2 = this.actions[0].secondPoint.coordinates;
            app.drawAPI.drawPoint(ctx, coords1, '#E90CC8', 2);
            app.drawAPI.drawPoint(ctx, coords2, '#E90CC8', 2);
        }
        if(this.currentStep == 'showing-segment') {
            let bs = this.shape.buildSteps,
                sIndex = this.actions[0].segmentIndex,
                coords1 = Points.add(bs [ sIndex - 1].coordinates, this.shape),
                coords2 = Points.add(bs [ sIndex ].coordinates, this.shape);
            app.drawAPI.drawLine(ctx, coords1, coords2, '#E90CC8', 3);
        }
    }

    /**
     * Calcule la liste des points que l'on peut sélectionner comme 2ème point
     * @return {[Object]} Liste de points au même format qu'interactionAPI
     */
    getCandidatePoints(object) {
        let pointsList = [];

        let addItem = function(curIndex, excludedSegmentPoint = null) {
            let shape = object.shape,
                bs = object.shape.buildSteps;

            if(bs[curIndex].type=='vertex') {
                pointsList.push({
                    'shape': shape,
                    'type': 'vertex',
                    'index': curIndex
                });
                return true;
            } else if(bs[curIndex].type=='segment') {
                bs[curIndex].points.forEach(pt => {
                    if(excludedSegmentPoint
                        && Points.equal(excludedSegmentPoint, pt))
                        return;
                    pointsList.push({
                        'shape': shape,
                        'type': 'segmentPoint',
                        'segmentIndex': curIndex,
                        'coordinates': Points.copy(pt)
                    });
                });
            } else if(bs[curIndex].type=='moveTo' && curIndex>0) {
                return true;
            }
            return false;
        };

        const mod = (x, n) => (x % n + n) % n;

        if(object.pointType == 'vertex') {
            let shape = object.shape,
                bs = object.shape.buildSteps,
                index = object.index;

            //Ajoute le vertex suivant et les segmentPoints suivants
            for(let i=0, curIndex=index; i<bs.length-1;i++) {
                curIndex = (curIndex+1)%bs.length;

                let rep = addItem(curIndex);
                if(rep) break;
            }

            //Ajoute le vertex précédent et les segmentPoints précédents
            for(let i=0, curIndex=index; i<bs.length-1;i++) {
                curIndex = mod(curIndex-1, bs.length);

                let rep = addItem(curIndex);
                if(rep) break;
            }
        } else { //segmentPoint
            let shape = object.shape,
                bs = object.shape.buildSteps,
                index = object.segmentIndex;

            //Ajoute le vertex suivant, les segmentPoints du segment
            //actuel et les segmentPoints suivants (si arcs)
            for(let i=0, curIndex=index-1; i<bs.length;i++) {
                curIndex = (curIndex+1)%bs.length;

                let rep = addItem(curIndex, object.relativeCoordinates);
                if(rep) break;
            }

            //Ajoute le vertex précédent et les segmentPoints précédents (si arcs)
            for(let i=0, curIndex=index; i<bs.length-1;i++) {
                curIndex = mod(curIndex-1, bs.length);

                let rep = addItem(curIndex);
                if(rep) break;
            }
        }

        return pointsList;
    }

}
