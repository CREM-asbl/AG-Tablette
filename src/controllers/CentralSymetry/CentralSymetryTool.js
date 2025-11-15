import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { SelectManager } from '../Core/Managers/SelectManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { CharacteristicElements } from '../Core/Objects/CharacteristicElements';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { findObjectById, removeObjectById } from '../Core/Tools/general';

/**
 */
export class CentralSymetryTool extends Tool {
  constructor() {
    super('centralSymetry', 'Symétrie centrale', 'transformation');
  }

  start() {
    this.removeListeners();
    this.duration = app.settings.geometryTransformationAnimation
      ? app.settings.geometryTransformationAnimationDuration
      : 0.001;

    setTimeout(
      () =>
        setState({
          tool: {
            ...app.tool,
            name: this.name,
            currentStep: 'selectCharacteristicElement',
          },
        }),
      50,
    );
  }

  selectCharacteristicElement() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    this.showLastCharacteristicElements();

    this.pointDrawn = null;
    this.characteristicElements = null;

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animateCharacteristicElement() {
    this.removeListeners();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    this.animate();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  selectObject() {
    if (this.drawingShapes)
      this.drawingShapes.forEach((s) => {
        removeObjectById(s.id);
      });
    const shapesToDelete = [];
    app.upperCanvasLayer.shapes.forEach((s) => {
      if (s.geometryObject.geometryIsCharacteristicElements)
        shapesToDelete.push(s);
    });
    shapesToDelete.forEach((s) => removeObjectById(s.id));
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  central() {
    this.removeListeners();

    this.startTime = Date.now();
    this.animate();
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  canvasMouseDown() {
    const coord = app.workspace.lastKnownMouseCoordinates;
    this.pointDrawn = new Point({
      coordinates: coord,
      layer: 'upper',
      color: app.settings.referenceDrawColor,
      size: 2,
    });
    setState({
      tool: {
        ...app.tool,
        name: this.name,
        currentStep: 'animateCharacteristicElement',
      },
    });
  }

  canvasMouseUp() {
    this.stopAnimation();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    app.workspace.selectionConstraints.points.canSelectFromUpper = true;

    const coord = app.workspace.lastKnownMouseCoordinates;
    let object = SelectManager.selectObject(coord);
    if (object) {
      if (object.shape.geometryObject.geometryIsCharacteristicElements) {
        this.characteristicElements = new CharacteristicElements(
          object.shape.geometryObject.geometryTransformationCharacteristicElements,
        );
      } else {
        app.workspace.selectionConstraints.points.canSelectFromUpper = false;
        object = SelectManager.selectObject(coord);

        this.characteristicElements = new CharacteristicElements({
          type: 'symetryCenter',
          elementIds: [object.id],
        });
      }
    }
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'selectObject' },
    });
  }

  objectSelected(object) {
    if (!object) return;

    this.involvedShapes = ShapeManager.getAllBindedShapes(object);
    this.drawingShapes = this.involvedShapes.map(
      (s) =>
        new s.constructor({
          ...s,
          layer: 'upper',
          path: s.getSVGPath('no scale', false),
          id: undefined,
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.vertexes.map((pt) => {
            return pt.color;
          }),
        }),
    );
    setState({
      tool: {
        ...app.tool,
        currentStep: 'central',
      },
    });
  }

  animate() {
    if (app.tool.currentStep === 'animateCharacteristicElement') {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
      return;
    }
    this.lastProgress = this.progress || 0;
    if (this.lastProgress === 0) {
      app.upperCanvasLayer.points.forEach((point) => {
        point.startCoordinates = new Coordinates(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: point.x + 2 * (this.pointDrawn.x - point.x),
          y: point.y + 2 * (this.pointDrawn.y - point.y),
        });
      });
    }
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.tool.name === 'centralSymetry') {
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'selectObject' },
      });
    } else {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep === 'central') {
      app.upperCanvasLayer.points.forEach((point) => {
        if (point.startCoordinates)
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(this.progress),
          );
      });
    } else if (app.tool.currentStep === 'animateCharacteristicElement') {
      const coord = app.workspace.lastKnownMouseCoordinates;
      const object = SelectManager.selectObject(coord);
      if (object) {
        this.pointDrawn.coordinates = object.coordinates;
      } else {
        this.pointDrawn.coordinates = coord;
      }
    }
  }

  _executeAction() {
    if (!this.characteristicElements) {
      const coord = this.pointDrawn.coordinates;
      const point = new SinglePointShape({
        layer: 'main',
        path: `M ${coord.x} ${coord.y}`,
        name: 'Point',
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      }).points[0];
      this.characteristicElements = new CharacteristicElements({
        type: 'symetryCenter',
        elementIds: [point.id],
      });
    }
    if (
      !app.workspace.centralSymetryLastCharacteristicElements.find((elements) =>
        this.characteristicElements.equal(elements),
      )
    ) {
      app.workspace.centralSymetryLastCharacteristicElements.push(
        this.characteristicElements,
      );
    }
    const newShapes = this.involvedShapes.map((s) => {
      const newShape = new s.constructor({
        ...s,
        layer: 'main',
        familyName: 'transformation',
        id: undefined,
        path: s.getSVGPath('no scale', false),
        segmentsColor: s.segments.map((seg) => {
          return seg.color;
        }),
        pointsColor: s.vertexes.map((pt) => {
          return pt.color;
        }),
        geometryObject: new GeometryObject({
          geometryTransformationChildShapeIds: [],
          geometryTransformationParentShapeId: s.id,
          geometryTransformationCharacteristicElements:
            this.characteristicElements,
          geometryTransformationName: 'centralSymetry',
          geometryIsVisible: s.geometryObject.geometryIsVisible,
          geometryIsHidden: s.geometryObject.geometryIsHidden,
          geometryIsConstaintDraw: s.geometryObject.geometryIsConstaintDraw,
        }),
      });
      s.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      const symetryCenter = this.characteristicElements.firstElement;
      if (
        !symetryCenter.shape.geometryObject.geometryTransformationChildShapeIds.includes(
          newShape.id,
        )
      ) {
        symetryCenter.shape.geometryObject.geometryTransformationChildShapeIds.push(
          newShape.id,
        );
      }
      newShape.rotate(Math.PI, symetryCenter.coordinates);
      newShape.points.forEach((pt, idx) => {
        pt.geometryIsVisible = s.points[idx].geometryIsVisible;
        pt.geometryIsHidden = s.points[idx].geometryIsHidden;
      });
      return newShape;
    });

    if (newShapes.length > 1) {
      const userGroup = new ShapeGroup(0, 1);
      userGroup.shapesIds = newShapes.map((s) => s.id);
      GroupManager.addGroup(userGroup);
    }
  }

  setSelectionConstraints() {
    const constraints = app.fastSelectionConstraints.mousedown_all_shape;
    constraints.shapes.blacklist = app.mainCanvasLayer.shapes.filter(
      (s) => s.geometryObject.geometryPointOnTheFlyChildId,
    );
    app.workspace.selectionConstraints = constraints;
  }

  showLastCharacteristicElements() {
    app.workspace.centralSymetryLastCharacteristicElements.forEach(
      (characteristicElement) => {
        const point = findObjectById(characteristicElement.elementIds[0]);
        const shape = new SinglePointShape({
          layer: 'upper',
          path: `M ${point.coordinates.x} ${point.coordinates.y}`,
          name: 'Point',
          familyName: 'Point',
          geometryObject: new GeometryObject({
            geometryIsCharacteristicElements: true,
            geometryTransformationCharacteristicElements: characteristicElement,
          }),
        });
        shape.points[0].color = app.settings.referenceDrawColor2;
        shape.points[0].size = 2;
      },
    );
  }
}
