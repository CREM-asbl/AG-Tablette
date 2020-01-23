import { app } from '../App';
import { State } from './State';
import { uniqId } from '../Tools/general';
import { ShapeManager } from '../ShapeManager';
import { GroupManager } from '../GroupManager';

/**
 * Grouper des formes.
 */
export class GroupState extends State {
  constructor() {
    super('group', 'Grouper', 'tool');

    // listen-canvas-click -> selecting-second-shape -> filling-group
    this.currentStep = null;

    this.group = null;

    this.firstShape = null;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    if (this.currentStep == 'listen-canvas-click') {
      setTimeout(
        () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
      );
    } else {
      let shapesList = [];
      if (this.currentStep == 'selecting-second-shape') shapesList = [this.firstShape];
      else shapesList = this.group.shapesIds.map(id => ShapeManager.getShapeById(id));

      window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.shapes.canSelect = true;
      app.workspace.selectionConstraints.shapes.blacklist = shapesList;
    }

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (this.status != 'paused') {
      this.currentStep = 'listen-canvas-click';
    }
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(shape, mouseCoordinates) {
    //Étapes
    if (this.currentStep == 'listen-canvas-click') {
      let userGroup = GroupManager.getShapeGroup(shape);
      if (userGroup) {
        this.group = userGroup;
        this.currentStep = 'filling-group';
      } else {
        this.firstShape = shape;
        this.currentStep = 'selecting-second-shape';
      }
    } else if (this.currentStep == 'selecting-second-shape') {
      let userGroup = GroupManager.getShapeGroup(shape);
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
        this.group = GroupManager.getGroup(this.groupId);
      }
      this.currentStep = 'filling-group';
    } else {
      // filling-group
      let userGroup = GroupManager.getShapeGroup(shape);
      if (userGroup) {
        //La forme fait partie d'un autre groupe, on fusionne
        let index1 = GroupManager.getGroupIndex(this.group),
          index2 = GroupManager.getGroupIndex(userGroup);
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
    else shapesList = this.group.shapesIds.map(id => ShapeManager.getShapeById(id));

    window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.shapes.canSelect = true;
    app.workspace.selectionConstraints.shapes.blacklist = shapesList;

    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin après avoir dessiné une forme sur le
   * canvas principal
   * @param  {Context2D} ctx   le canvas
   * @param  {Shape} shape La forme dessinée
   */
  shapeDrawn(ctx, shape) {
    let group = GroupManager.getShapeGroup(shape),
      center = shape.center,
      pos = { x: center.x - 25, y: center.y };
    if (group) {
      let groupIndex = GroupManager.getGroupIndex(group);
      window.dispatchEvent(
        new CustomEvent('draw-text', {
          detail: { ctx: app.mainCtx, text: 'Groupe ' + (groupIndex + 1), position: pos },
        }),
      );
    } else if (this.currentStep == 'selecting-second-shape' && this.firstShape == shape) {
      let groupIndex = app.workspace.shapeGroups.length;
      window.dispatchEvent(
        new CustomEvent('draw-text', {
          detail: { ctx: app.mainCtx, text: 'Groupe ' + (groupIndex + 1), position: pos },
        }),
      );
    }
  }
}
