import { app } from './App'

export class InteractionAPI {

    constructor(app) {
        app = app;
        this.forwardEventsToState = true;

        this.selectionConstraints = null;
        this.resetSelectionConstraints();
    }

    resetSelectionConstraints() {
        this.setSelectionConstraints("click",
            {"canShape": "all", "listShape": []},
            {"canSegment": "all", "listSegment": []},
            {"canVertex": "all", "listVertex": []});
    }

    /**
     * Définir des contraintes pour la sélection d'un élément sur le canvas
     * @param {String} type        "click" ou "mouseDown"
     * @param {String} canShape    "all", "some" (définis dans la liste), "notSome" (idem) ou "none"
     * @param {[Shape]} listShape   liste de forme (vide si canShape vaut "all" ou "none")
     * @param {String} canSegment  "all", "some" (définis dans la liste), "notSome" (idem) ou "none"
     * @param {[Segment]} listSegment liste de segments (vide si canSegment vaut "all" ou "none")
     * @param {String} canVertex   "all", "some" (définis dans la liste), "notSome" (idem) ou "none"
     * @param {[Vertex]} listVertex  liste de sommets (vide si canVertex vaut "all" ou "none")
     */
    setSelectionConstraints(type,
        {canShape, listShape},
        {canSegment, listSegment},
        {canVertex, listVertex}) {
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
            "vertices": {
                "canSelect": canVertex,
                "list": listVertex
            }
        }; //TODO: add priority, ex: select segment if possible, else select shape?
    }

    getSelectedObject(mouseCoordinates) {
        let constr = this.selectionConstraints;
        if(constr.shapes.canSelect != "none") {
            let shapes = app.workspace.shapesOnPoint(mouseCoordinates);
            if(constr.shapes.canSelect == "all") {
                if(shapes.length>0)
                    return shapes[ shapes.length - 1];
            } else if(constr.shapes.canSelect == "some") {
                for(let i=shapes.length-1; i>=0; i--) {
                    if(constr.shapes.list.includes(shapes[i]))
                        return shapes[i];
                }
            } else if(constr.shapes.canSelect == "notSome") {
                for(let i=shapes.length-1; i>=0; i--) {
                    if(!constr.shapes.list.includes(shapes[i]))
                        return shapes[i];
                }
            } else {
                console.error("bad type!");
            }
        }
        if(constr.segments.canSelect != "none") {
            console.log("todo segment selector");
        }
        if(constr.vertices.canSelect != "none") {
            console.log("todo vertex selector");

        }
        return null;
    }

    onClick(mouseCoordinates, event) {
        this.updateLastKnownMouseCoordinates(mouseCoordinates);
        if(this.forwardEventsToState && app.state)
            app.state.onClick(mouseCoordinates, event);

    }
    onMouseDown(mouseCoordinates, event) {
        this.updateLastKnownMouseCoordinates(mouseCoordinates);
        if(this.forwardEventsToState && app.state)
            app.state.onMouseDown(mouseCoordinates, event);
        if(this.selectionConstraints.type=="mouseDown") {
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
    }
    onTouchLeave(mouseCoordinates, event) {
        //idem mouseUp? TODO
        this.onMouseUp(mouseCoordinates, event);
    }
    onTouchCancel(mouseCoordinates, event) {
        //idem mouseUp? TODO
        this.onMouseUp(mouseCoordinates, event);
    }

    updateLastKnownMouseCoordinates(mouseCoordinates) {
        app.drawAPI.lastKnownMouseCoordinates = { 'x': mouseCoordinates.x, 'y': mouseCoordinates.y};
    }
}
