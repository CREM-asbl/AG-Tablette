import { app } from './App'
import { distanceBetweenPoints } from './Tools/geometry'

//TODO: ajouter des facilités de sélection quand on ne peut sélectionner que
//      des segments ou points (par ex).

export class InteractionAPI {

    constructor(app) {
        app = app;
        this.forwardEventsToState = true;

        this.selectObjectBeforeNativeEvent = false;

        this.selectionConstraints = null;
        this.resetSelectionConstraints();
    }

    arePointsInMagnetismDistance(pt1, pt2) {
        let dist = distanceBetweenPoints(pt1, pt2);
        if(dist <= app.settings.get("magnetismDistance"))
            return true;
        return false;
    }

    resetSelectionConstraints() {
        this.setSelectionConstraints("click",
            {"canShape": "none", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []});
    }

    /**
     * Définir des contraintes pour la sélection d'un élément sur le canvas
     * @param {String} type        "click" ou "mouseDown"
     * @param {String} canShape    "all", "some" (définis dans la liste), "notSome" (idem) ou "none"
     * @param {[Shape]} listShape   liste de forme (vide si canShape vaut "all" ou "none")
     * @param {String} canSegment  "all", "some" (définis dans la liste), "notSome" (idem) ou "none"
     * @param {[Segment]} listSegment liste de segments (vide si canSegment vaut "all" ou "none")
     * @param {String} canPoint   "all", "some" (définis dans la liste), "notSome" (idem) ou "none"
     * @param {[String]} pointTypes liste d'éléments parmi: "vertex", "segmentPoint", "center"
     * @param {[Point]} listPoint  liste de points (vide si canPoint vaut "all" ou "none")
     */
    setSelectionConstraints(type,
        {canShape, listShape},
        {canSegment, listSegment},
        {canPoint, pointTypes, listPoint}) {
        this.selectionConstraints = {
            "type": type,
            "shapes": {
                "canSelect": canShape, //all, some (in the list), notSome (in the list), none
                "list": listShape
            },
            "segments": {
                "canSelect": canSegment,
                "list": listSegment
            },
            "points": {
                "canSelect": canPoint,
                "types": pointTypes, //liste d'éléments: "vertex", "segmentPoint", "center"
                "list": listPoint
            }
        }; //TODO: add priority, ex: select segment if possible, else select shape?
    }

    /**
     * [getSelectedObject description]
     * @param  {[type]} mouseCoordinates [description]
     * @return {[type]}                  [description]
     * Renvoie soit un objet de type Shape,
     *         soit {'type': 'segment', ***} //TODO
     *         soit {
     *                  'type': 'point',
     *                  'pointType': 'vertex' ou 'segmentPoint' ou 'center',
     *                  'shape': Shape,
     *                  'segmentEndCoordinates': int, //Seulement si pointType = segmentPoint
     *                  'coordinates': Point
     *              }
     */
    getSelectedObject(mouseCoordinates) {
        let constr = this.selectionConstraints;
        if(constr.shapes.canSelect != "none") {
            let shapes = app.workspace.shapesOnPoint(mouseCoordinates);
            if(constr.shapes.canSelect == "all") {
                if(shapes.length>0)
                    return shapes[ shapes.length - 1];
            } else if(constr.shapes.canSelect == "some") {
                for(let i=shapes.length-1; i>=0; i--) {
                    if(constr.shapes.list.some(s => s.id == shapes[i].id))
                        return shapes[i];
                }
            } else if(constr.shapes.canSelect == "notSome") {
                for(let i=shapes.length-1; i>=0; i--) {
                    if(constr.shapes.list.every(s => s.id != shapes[i].id))
                        return shapes[i];
                }
            } else {
                console.error("bad type!");
            }
        }
        if(constr.segments.canSelect != "none") {
            console.log("todo segment selector");
        }
        if(constr.points.canSelect != "none") {
            let point = {
                'dist': 1000000000,
                'coordinates': null,
                'shape': null,
                'pointType': null,
                'segmentEndCoordinates': null
            };
            app.workspace.shapes.forEach(shape => {
                if(constr.points.types.includes("center")) {
                    if(shape.isCenterShown) {
                        let center = shape.getAbsoluteCenter();
                        if(this.arePointsInMagnetismDistance(center, mouseCoordinates)) {
                            let dist = distanceBetweenPoints(center, mouseCoordinates);
                            if(dist<point.dist) {
                                point.dist = dist;
                                point.coordinates = {
                                    'x': center.x,
                                    'y': center.y
                                };
                                point.shape = shape;
                                point.pointType = 'center';
                                point.segmentEndCoordinates = null;
                            }
                        }
                    }
                }
                shape.buildSteps.forEach(bs => {
                    if(bs.type=="vertex" && constr.points.types.includes("vertex")) {
                        let absCoordinates = {
                            'x': bs.coordinates.x + shape.x,
                            'y': bs.coordinates.y + shape.y
                        };

                        if(this.arePointsInMagnetismDistance(absCoordinates, mouseCoordinates)) {
                            let dist = distanceBetweenPoints(absCoordinates, mouseCoordinates);
                            if(dist<point.dist) {
                                point.dist = dist;
                                point.coordinates = absCoordinates;
                                point.shape = shape;
                                point.pointType = 'vertex';
                                point.segmentEndCoordinates = null;
                            }
                        }
                    }
                    if(bs.type=="segment" && constr.points.types.includes("segmentPoint")) {
                        bs.points.forEach(pt => {
                            let absCoordinates = {
                                'x': pt.x + shape.x,
                                'y': pt.y + shape.y
                            };
                            if(this.arePointsInMagnetismDistance(absCoordinates, mouseCoordinates)) {
                                let dist = distanceBetweenPoints(absCoordinates, mouseCoordinates);
                                if(dist<point.dist) {
                                    point.dist = dist;
                                    point.coordinates = absCoordinates;
                                    point.shape = shape;
                                    point.pointType = 'segmentPoint';
                                    point.segmentEndCoordinates = {
                                        'x': bs.coordinates.x,
                                        'y': bs.coordinates.y
                                    };
                                }
                            }
                        });
                    }
                });
            });
            if(point.shape) {
                return {
                    'type': 'point',
                    'pointType': point.pointType,
                    'shape': point.shape,
                    'segmentEndCoordinates': point.segmentEndCoordinates,
                    'coordinates': point.coordinates
                };
            }
        }
        return null;
    }

    onClick(mouseCoordinates, event) {
        this.updateLastKnownMouseCoordinates(mouseCoordinates);

        let trySelection = true;
        if(!this.selectObjectBeforeNativeEvent && this.forwardEventsToState && app.state)
            trySelection = app.state.onClick(mouseCoordinates, event);

        let callOnClick = true;
        if(trySelection && this.selectionConstraints.type=="click") { //TODO factoriser ça (avec mouseDown)?
            let obj = this.getSelectedObject(mouseCoordinates);
            if(obj) {
                callOnClick = app.state.objectSelected(obj, mouseCoordinates, event);
            }
        }

        if(this.selectObjectBeforeNativeEvent && callOnClick
           && this.forwardEventsToState && app.state) {
            app.state.onClick(mouseCoordinates, event);
        }
    }

    onMouseDown(mouseCoordinates, event) {
        this.updateLastKnownMouseCoordinates(mouseCoordinates);
        let trySelection = true;
        if(this.forwardEventsToState && app.state)
            trySelection = app.state.onMouseDown(mouseCoordinates, event);
        if(trySelection && this.selectionConstraints.type=="mouseDown") {
            let obj = this.getSelectedObject(mouseCoordinates);
            if(obj) {
                app.state.objectSelected(obj, mouseCoordinates, event);
            }
        }
    }
    onMouseUp(mouseCoordinates, event) {
        this.updateLastKnownMouseCoordinates(mouseCoordinates);
        if(this.forwardEventsToState && app.state)
            app.state.onMouseUp(mouseCoordinates, event);

    }
    onMouseMove(mouseCoordinates, event) {
        this.updateLastKnownMouseCoordinates(mouseCoordinates);
        if(this.forwardEventsToState && app.state)
            app.state.onMouseMove(mouseCoordinates, event);
        app.drawAPI.askRefresh("upper");
    }

    onTouchStart(mouseCoordinates, event) {
        //idem MouseDown? TODO
        this.onMouseDown(mouseCoordinates, event);
    }
    onTouchMove(mouseCoordinates, event) {
        //idem mouseMove? TODO
        this.onMouseMove(mouseCoordinates, event);
    }
    onTouchEnd(mouseCoordinates, event) {
        //idem mouseUp? TODO
        this.onMouseUp(mouseCoordinates, event);
        this.onClick(mouseCoordinates, event);
    }
    onTouchLeave(mouseCoordinates, event) {
        //idem mouseUp? TODO
        this.onMouseUp(mouseCoordinates, event);
        this.onClick(mouseCoordinates, event);
    }
    onTouchCancel(mouseCoordinates, event) {
        //idem mouseUp? TODO
        this.onMouseUp(mouseCoordinates, event);
        this.onClick(mouseCoordinates, event);
    }

    updateLastKnownMouseCoordinates(mouseCoordinates) {
        app.drawAPI.lastKnownMouseCoordinates = { 'x': mouseCoordinates.x, 'y': mouseCoordinates.y};
    }
}
