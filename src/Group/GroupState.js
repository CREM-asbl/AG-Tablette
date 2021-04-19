import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Text } from '../Core/Objects/Text';

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
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil permet de
        former des groupes de formes, qui sont alors solidaires. Une forme ne
        peut appartenir qu'à un seul groupe.
        <br />
        Une fois cet outil sélectionné, le numéro du groupe apparaît sur chaque
        forme appartenant à un groupe.<br /><br />

        Pour créer un nouveau groupe, touchez deux formes n'appartenant pas à un
        groupe. Toutes les formes touchées par la suite seront ajoutées à ce
        groupe.<br /><br />

        Pour ajouter une forme à un groupe, touchez une des formes appartenant à
        ce groupe, puis touchez la forme que vous souhaitez ajouter.<br /><br />

        Pour fusionner deux groupes, touchez une des formes appartenant au
        premier groupe, puis touchez une des formes de l'autre groupe.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    app.mainDrawingEnvironment.shapes.map(s => {
      if (GroupManager.getShapeGroup(s) != null) {
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: s.centerCoordinates,
          referenceId: s.id,
          type: 'group',
        });
      }
    });
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    app.mainDrawingEnvironment.shapes.map(s => {
      if (GroupManager.getShapeGroup(s) != null) {
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: s.centerCoordinates,
          referenceId: s.id,
          type: 'group',
        });
      }
    });
    if (this.currentStep == 'listen-canvas-click') {
      setTimeout(
        () =>
          (app.workspace.selectionConstraints =
            app.fastSelectionConstraints.click_all_shape)
      );
    } else {
      let shapeIdsList = [];
      if (this.currentStep == 'selecting-second-shape')
        shapeIdsList = [this.firstShape.id];
      else shapeIdsList = this.group.shapesIds;

      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.shapes.canSelect = true;
      app.workspace.selectionConstraints.shapes.blacklist = shapeIdsList.map(
        id => {
          return { shapeId: id };
        }
      );
    }

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * stopper l'état
   */
  end() {
    if (this.status != 'paused') {
      this.currentStep = 'listen-canvas-click';
      app.upperDrawingEnvironment.removeAllObjects();
    }
    app.removeListener('objectSelected', this.objectSelectedId);
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep == 'listen-canvas-click') {
      let userGroup = GroupManager.getShapeGroup(shape);
      if (userGroup) {
        this.group = userGroup;
        this.currentStep = 'filling-group';
      } else {
        this.firstShapeId = shape.id;
        this.currentStep = 'selecting-second-shape';
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: shape.centerCoordinates,
          message: 'Groupe ' + (app.workspace.shapeGroups.length + 1),
          referenceId: this.firstShapeId,
          type: 'group',
        });
      }
    } else if (this.currentStep == 'selecting-second-shape') {
      let userGroup = GroupManager.getShapeGroup(shape);
      if (shape.id == this.firstShapeId) {
        window.dispatchEvent(new CustomEvent('show-notif', {detail: {message: 'La forme choisie fait déjà partie du groupe'}}));
        return;
      } else if (userGroup) {
        this.group = userGroup;
        this.actions = [
          {
            name: 'GroupAction',
            type: 'add',
            shapeId: this.firstShapeId,
            group: this.group,
          },
        ];
        this.executeAction();
      } else {
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: shape.centerCoordinates,
          referenceId: shape.id,
          type: 'group',
        });
        this.actions = [
          {
            name: 'GroupAction',
            type: 'new',
            shapeId: this.firstShapeId,
            secondShapeId: shape.id,
          },
        ];
        this.executeAction();
        this.group = GroupManager.getShapeGroup(shape);
      }
      this.currentStep = 'filling-group';
    } else {
      // filling-group
      let userGroup = GroupManager.getShapeGroup(shape);
      if (userGroup) {
        //La forme fait partie d'un autre groupe, on fusionne
        let index1 = GroupManager.getGroupIndex(this.group),
          index2 = GroupManager.getGroupIndex(userGroup);
        if (index1 == index2) {
          window.dispatchEvent(new CustomEvent('show-notif', {detail: {message: 'La forme choisie fait déjà partie du groupe'}}));
          return;
        }
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
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: shape.centerCoordinates,
          referenceId: shape.id,
          type: 'group',
        });
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

    let shapeIdsList = [];
    if (this.currentStep == 'selecting-second-shape')
      shapeIdsList = [this.firstShapeId];
    else shapeIdsList = this.group.shapesIds;

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.shapes.canSelect = true;
    app.workspace.selectionConstraints.shapes.blacklist = shapeIdsList.map(
      sId => {
        return { shapeId: sId };
      }
    );

    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
