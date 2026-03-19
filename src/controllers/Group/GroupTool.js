
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { Tool } from '../Core/States/Tool';
import { groupHelpConfig } from './group.helpConfig';

/**
 * Grouper des figures.
 */
export class GroupTool extends Tool {
  constructor() {
    super('group', 'Grouper', 'tool');

    this.group = null;

    this.firstShape = null;

    this.groupsColor = [
      '#77b5fe',
      '#096a09',
      '#f00020',
      '#03224c',
      '#34c924',
      '#d473d4',
      '#fd3f92',
      '#ff8400',
    ];
  }

  updateToolStep(step, extraState = {}) {
    appActions.setToolState(extraState);
    appActions.setCurrentStep(step);
  }



  start() {
    helpConfigRegistry.register(this.name, groupHelpConfig);

    appActions.setActiveTool(this.name);

    setTimeout(
      () => {
        this.updateToolStep('listen');
        this.listen();
      },
      50,
    );
  }

  listen() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();

    app.mainCanvasLayer.shapes.map((s) => {
      const currentGroup = GroupManager.getShapeGroup(s);
      if (currentGroup !== null) {
        new s.constructor({
          ...s,
          layer: 'upper',
          path: s.getSVGPath('no scale', false, false),
          fillOpacity: 0,
          strokeColor: currentGroup.color,
          strokeWidth: 3,
          divisionPointInfos: s.divisionPoints.map((dp) => {
            return {
              coordinates: dp.coordinates,
              ratio: dp.ratio,
              segmentIdx: dp.segments[0].idx,
              id: dp.id,
              color: dp.color,
            };
          }),
          pointsColor: s.points.map((pt) => {
            return pt.color;
          }),
        });
      }
    });

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);

    window.dispatchEvent(new CustomEvent('refreshUpper'));
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

  end() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
  }

  objectSelected(shape) {
    if (app.tool.currentStep === 'listen') {
      const userGroup = GroupManager.getShapeGroup(shape);
      if (userGroup) {
        this.group = userGroup;
        this.updateToolStep('fillGroup');
      } else {
        this.firstShapeId = shape.id;
        new shape.constructor({
          ...shape,
          layer: 'upper',
          path: shape.getSVGPath('no scale', false, false),
          fillOpacity: 0,
          strokeColor: this.groupsColor[app.nextGroupColorIdx % 8],
          strokeWidth: 3,
          divisionPointInfos: shape.divisionPoints.map((dp) => {
            return {
              coordinates: dp.coordinates,
              ratio: dp.ratio,
              segmentIdx: dp.segments[0].idx,
              id: dp.id,
              color: dp.color,
            };
          }),
          pointsColor: shape.points.map((pt) => {
            return pt.color;
          }),
        });
        this.updateToolStep('selectSecondShape');
      }
    } else if (app.tool.currentStep === 'selectSecondShape') {
      const userGroup = GroupManager.getShapeGroup(shape);
      if (shape.id === this.firstShapeId) {
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: { message: 'La figure choisie fait déjà partie du groupe' },
          }),
        );
        return;
      } else if (userGroup) {
        this.group = userGroup;
        this.mode = 'add';
      } else {
        this.mode = 'new';
        this.secondShapeId = shape.id;
        this.group = GroupManager.getShapeGroup(shape);
      }
      this.executeAction();
      this.updateToolStep('fillGroup');
    } else {
      // fillGroup
      this.secondGroup = GroupManager.getShapeGroup(shape);
      if (this.secondGroup) {
        //La figure fait partie d'un autre groupe, on fusionne
        let index1 = GroupManager.getGroupIndex(this.group),
          index2 = GroupManager.getGroupIndex(this.secondGroup);
        if (index1 === index2) {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: {
                message: 'La figure choisie fait déjà partie du groupe',
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
        this.mode = 'add';
        this.firstShapeId = shape.id;
      }
      this.executeAction();
      this.updateToolStep('fillGroup');
    }
  }

  _executeAction() {
    if (this.mode === 'new') {
      this.group = new ShapeGroup(this.firstShapeId, this.secondShapeId);
      GroupManager.addGroup(this.group);
    } else if (this.mode === 'add') {
      this.group.addShape(this.firstShapeId);
    } else {
      // merge
      const group1 = this.group,
        group2 = this.secondGroup;

      group1.shapesIds = [...group1.shapesIds, ...group2.shapesIds];
      GroupManager.deleteGroup(group2);
    }
    app.upperCanvasLayer.removeAllObjects();
    app.mainCanvasLayer.shapes.map((s) => {
      const currentGroup = GroupManager.getShapeGroup(s);
      if (currentGroup !== null) {
        new s.constructor({
          ...s,
          layer: 'upper',
          path: s.getSVGPath('no scale', false, false),
          fillOpacity: 0,
          strokeColor: currentGroup.color,
          strokeWidth: 3,
          divisionPointInfos: s.divisionPoints.map((dp) => {
            return {
              coordinates: dp.coordinates,
              ratio: dp.ratio,
              segmentIdx: dp.segments[0].idx,
              id: dp.id,
              color: dp.color,
            };
          }),
          pointsColor: s.points.map((pt) => {
            return pt.color;
          }),
        });
        console.info(s.getSVGPath('no scale', false, false));
      }
    });
  }
}
