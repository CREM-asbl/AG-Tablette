import { app } from '../App';
import { GroupAction } from './Actions/Group';
import { State } from './State';
import { uniqId } from '../Tools/general';

/**
 * Grouper des formes.
 */
export class GroupState extends State {
  constructor() {
    super('group_shapes');

    // listen-canvas-click -> selecting-second-shape -> filling-group
    this.currentStep = null;

    this.group = null;

    this.firstShape = null;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.end();
    this.currentStep = 'listen-canvas-click';

    this.group = null;
    this.firstShape = null;

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    app.appDiv.cursor = 'default';
    window.addEventListener('objectSelected', this.handler);
  }

  abort() {
    this.start();
  }

  end() {
    app.editingShapes = [];
    window.removeEventListener('objectSelected', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par interactionAPI quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    //Étapes
    if (this.currentStep == 'listen-canvas-click') {
      let userGroup = app.workspace.getShapeGroup(shape);
      if (userGroup) {
        this.group = userGroup;
        this.currentStep = 'filling-group';
      } else {
        this.firstShape = shape;
        this.currentStep = 'selecting-second-shape';
      }
    } else if (this.currentStep == 'selecting-second-shape') {
      let userGroup = app.workspace.getShapeGroup(shape);
      if (userGroup) {
        this.group = userGroup;
        this.actions = [
          {
            name: 'GroupAction',
            type: 'add',
            shapeId: this.firstShape.id,
            group: userGroup,
          },
        ];
        this.executeAction();
      } else {
        this.groupId = uniqId();
        this.actions = [
          {
            name: 'GroupAction',
            type: 'new',
            shapeId: this.firstShape.id,
            secondShapeId: shape.id,
            groupId: this.groupId,
          },
        ];
        this.executeAction();
        this.group = app.workspace.getGroup(this.groupId);
      }
      this.currentStep = 'filling-group';
    } else {
      // filling-group
      let userGroup = app.workspace.getShapeGroup(shape);
      if (userGroup) {
        //La forme fait partie d'un autre groupe, on fusionne
        let index1 = app.workspace.getGroupIndex(this.group),
          index2 = app.workspace.getGroupIndex(userGroup);
        //On garde le groupe ayant l'index le plus petit
        if (index1 > index2) {
          [index1, index2] = [index2, index1];
          [this.group, userGroup] = [userGroup, this.group];
        }
        this.actions = [
          {
            name: 'GroupAction',
            type: 'merge',
            group: this.group,
            groupIdx: index1,
            otherGroup: userGroup,
            otherGroupIdx: index2,
          },
        ];
        this.executeAction();
      } else {
        this.actions = [
          {
            name: 'GroupAction',
            type: 'add',
            shapeId: shape.id,
            group: this.group,
          },
        ];
        this.executeAction();
      }
    }

    let shapesList = [];
    if (this.currentStep == 'selecting-second-shape') shapesList = [this.firstShape];
    else shapesList = this.group.shapesIds.map(id => app.workspace.getShapeById(id));

    let constr = app.interactionAPI.getEmptySelectionConstraints();
    constr.eventType = 'click';
    constr.shapes.canSelect = true;
    constr.shapes.blacklist = shapesList;
    app.interactionAPI.setSelectionConstraints(constr);

    app.drawAPI.askRefresh('upper');
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
      center = shape.center,
      pos = { x: center.x - 25, y: center.y };
    if (group) {
      let groupIndex = app.workspace.getGroupIndex(group);
      app.drawAPI.drawText(ctx, 'Groupe ' + (groupIndex + 1), pos);
    } else if (this.currentStep == 'selecting-second-shape' && this.firstShape == shape) {
      let groupIndex = app.workspace.shapeGroups.length;
      app.drawAPI.drawText(ctx, 'Groupe ' + (groupIndex + 1), pos);
    }
  }
}
