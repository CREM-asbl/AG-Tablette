


export class InteractionAPI {

    constructor(app) {
        app = app;
        this.forwardEventsToState = true;

        this.clickConstraints = null;
        this.setClickConstraints(
            {"can": "all", "list": []},
            {"can": "all", "list": []},
            {"can": "all", "list": []});
    }

    setClickConstraints(
        {can: canShape, list: listShape},
        {can: canSegment, list: listSegment},
        {can: canVertex, list: listVertex}) {
        this.clickConstraints = {
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
        };
    }



    onClick(mouseCoordinates, event) {
        if(this.forwardEventsToState && app.state && app.state.onClick)
            app.state.onClick(mouseCoordinates, event);

    }
    onMouseDown(mouseCoordinates, event) {
        if(this.forwardEventsToState && app.state && app.state.onMouseDown)
            app.state.onMouseDown(mouseCoordinates, event);

    }
    onMouseUp(mouseCoordinates, event) {
        if(this.forwardEventsToState && app.state && app.state.onMouseUp)
            app.state.onMouseUp(mouseCoordinates, event);

    }
    onMouseMove(mouseCoordinates, event) {
        if(this.forwardEventsToState && app.state && app.state.onMouseMove)
            app.state.onMouseMove(mouseCoordinates, event);

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
}
