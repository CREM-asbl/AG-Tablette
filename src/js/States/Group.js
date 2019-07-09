import { app } from '../App'
import { GroupAction } from './Actions/Group'
import { State } from './State'

/**
 * Grouper des formes.
 */
export class GroupState extends State {

    constructor() {
        super("group_shapes");

        this.action = null;

        // listen-canvas-click -> selecting-second-shape -> filling-group
        this.currentStep = null;

        this.group = null;

        this.firstShape = null;

    }

    /**
     * (ré-)initialiser l'état
     */
    start() {
        this.action = new GroupAction(this.name);
        this.currentStep = "listen-canvas-click";

        this.group = null;
        this.firstShape = null;

        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "all", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        );
    }

    /**
     * Appelée par interactionAPI quand une forme est sélectionnée (onClick)
     * @param  {Shape} shape            La forme sélectionnée
     * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
     * @param  {Event} event            l'événement javascript
     */
    objectSelected(shape, clickCoordinates, event) {
        if(this.currentStep == "listen-canvas-click") {
            let userGroup = app.workspace.getShapeGroup(shape);
            if(userGroup) {
                this.group = userGroup;
                this.currentStep = 'filling-group';
            } else {
                this.firstShape = shape;
                this.currentStep = "selecting-second-shape";
            }
        } else if(this.currentStep == "selecting-second-shape") {
            let userGroup = app.workspace.getShapeGroup(shape);
            if(userGroup) {
                this.group = userGroup;
                this.currentStep = 'filling-group';
                this.action.type = 'add';
                this.action.shapeId = this.firstShape.id;
                this.action.groupId = userGroup.id;
                this.executeAction();
                this.action = new GroupAction(this.name);
            } else {
                this.currentStep = "filling-group";
                this.action.type = 'new';
                this.action.shapeId = this.firstShape.id;
                this.action.secondShapeId = shape.id;
                this.executeAction();
                this.group = app.workspace.getGroup(this.action.groupId);
                this.action = new GroupAction(this.name);
            }
        } else {
            let userGroup = app.workspace.getShapeGroup(shape);
            if(userGroup) {
                //La forme fait partie d'un autre groupe, on fusionne
                this.action.type = 'merge';

                let index1 = app.workspace.getGroupIndex(this.group),
                    index2 = app.workspace.getGroupIndex(userGroup);
                //On garde le groupe ayant l'index le plus petit
                if(index1 > index2) {
                    [index1, index2] = [index2, index1];
                    [this.group, userGroup] = [userGroup, this.group];
                }
                this.action.groupId = this.group.id;
                this.action.otherGroupId = userGroup.id;
                this.executeAction();
                this.action = new GroupAction(this.name);
            } else {
                this.action.type = 'add';
                this.action.shapeId = shape.id;
                this.action.groupId = this.group.id;
                this.executeAction();
                this.action = new GroupAction(this.name);
            }
        }

        let shapesList = [];
        if(this.currentStep == "selecting-second-shape")
            shapesList = [ this.firstShape ];
        else
            shapesList = this.group.shapes;
        app.interactionAPI.setSelectionConstraints("click",
            {"canShape": "notSome", "listShape": shapesList},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []}
        );

        app.drawAPI.askRefresh("upper");
        app.drawAPI.askRefresh();
    }

    /**
     * Appelée par la fonction de dessin après avoir dessiné une forme sur le
     * canvas principal
     * @param  {Context2D} ctx   le canvas
     * @param  {Shape} shape La forme dessinée
     */
    shapeDrawn(ctx, shape) {
        let group = app.workspace.getShapeGroup(shape),
            pos = {"x": shape.x - 25, "y": shape.y};
        if(group) {
            let groupIndex = app.workspace.getGroupIndex(group);
            app.drawAPI.drawText(ctx, "Groupe "+(groupIndex+1), pos);
        } else if(this.currentStep == "selecting-second-shape"
                    && this.firstShape == shape) {
            let groupIndex = app.workspace.userShapeGroups.length;
            app.drawAPI.drawText(ctx, "Groupe "+(groupIndex+1), pos);
        }
    }

}
