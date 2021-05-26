import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Text } from '../Core/Objects/Text';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';

/**
 * Grouper des formes.
 */
export class GroupTool extends Tool {
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
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();

    setTimeout(() => {
      app.mainDrawingEnvironment.shapes.map((s) => {
        if (GroupManager.getShapeGroup(s) != null) {
          new Text({
            drawingEnvironment: app.upperDrawingEnvironment,
            coordinates: s.centerCoordinates,
            referenceId: s.id,
            type: 'group',
          });
        }
      });
      window.dispatchEvent(new CustomEvent('refreshUpper'));
    }, 50);

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectSecondShape() {
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  fillGroup() {
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    let mustExecuteAction = false;

    if (app.tool.currentStep == 'start') {
      let userGroup = GroupManager.getShapeGroup(shape);
      if (userGroup) {
        this.group = userGroup;
        setState({ tool: { ...app.tool, currentStep: 'fillGroup' } });
      } else {
        this.firstShapeId = shape.id;
        setState({ tool: { ...app.tool, currentStep: 'selectSecondShape' } });
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: shape.centerCoordinates,
          message: 'Groupe ' + (app.workspace.shapeGroups.length + 1),
          referenceId: this.firstShapeId,
          type: 'group',
        });
      }
    } else if (app.tool.currentStep == 'selectSecondShape') {
      let userGroup = GroupManager.getShapeGroup(shape);
      if (shape.id == this.firstShapeId) {
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: { message: 'La forme choisie fait déjà partie du groupe' },
          }),
        );
        return;
      } else if (userGroup) {
        this.group = userGroup;
        this.mode = 'add';
      } else {
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: shape.centerCoordinates,
          referenceId: shape.id,
          type: 'group',
        });
        this.mode = 'new';
        this.secondShapeId = shape.id;
        this.group = GroupManager.getShapeGroup(shape);
      }
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'fillGroup' },
      });
    } else {
      // fillGroup
      this.secondGroup = GroupManager.getShapeGroup(shape);
      if (this.secondGroup) {
        //La forme fait partie d'un autre groupe, on fusionne
        let index1 = GroupManager.getGroupIndex(this.group),
          index2 = GroupManager.getGroupIndex(this.secondGroup);
        if (index1 == index2) {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: {
                message: 'La forme choisie fait déjà partie du groupe',
              },
            }),
          );
          return;
        }
        //On garde le groupe ayant l'index le plus petit
        if (index1 > index2) {
          [index1, index2] = [index2, index1];
          [this.group, this.secondGroup] = [this.secondGroup, this.group];
        }
        this.mode = 'merge';
      } else {
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: shape.centerCoordinates,
          referenceId: shape.id,
          type: 'group',
        });
        this.mode = 'add';
        this.firstShapeId = shape.id;
      }
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'fillGroup' },
      });
    }

    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  _executeAction() {
    if (this.mode == 'new') {
      this.group = new ShapeGroup(this.firstShapeId, this.secondShapeId);
      GroupManager.addGroup(this.group);
    } else if (this.mode == 'add') {
      this.group.addShape(this.firstShapeId);
    } else {
      // merge
      let group1 = this.group,
        group2 = this.secondGroup;

      group1.shapesIds = [...group1.shapesIds, ...group2.shapesIds];
      GroupManager.deleteGroup(group2);
    }
  }
}
