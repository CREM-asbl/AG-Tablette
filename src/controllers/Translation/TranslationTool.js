import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { SelectManager } from '../Core/Managers/SelectManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { CharacteristicElements } from '../Core/Objects/CharacteristicElements';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { findObjectById, removeObjectById } from '../Core/Tools/general';

/**
 */
export class TranslationTool extends Tool {
  constructor() {
    super('translation', 'Translation', 'transformation');
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
            currentStep: 'selectFirstReference',
          },
        }),
      50,
    );
  }

  selectFirstReference() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    this.showLastCharacteristicElements();

    this.pointsDrawn = [];
    this.characteristicElements = null;

    setTimeout(
      () =>
        setState({
          tool: {
            ...app.tool,
            name: this.name,
            currentStep: 'selectReference',
          },
        }),
      50,
    );
  }

  selectReference() {
    this.removeListeners();

    if (this.pointsDrawn.length === 1) {
      const shapesToDelete = [];
      app.upperCanvasLayer.shapes.forEach((s) => {
        if (s.geometryObject?.geometryIsCharacteristicElements)
          shapesToDelete.push(s);
      });
      shapesToDelete.forEach((s) => removeObjectById(s.id));
    }

    // this.setSelectionConstraints();
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animateFirstRefPoint() {
    this.removeListeners();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    this.animate();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  animateSecondRefPoint() {
    this.removeListeners();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    this.animate();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  selectObject() {
    this.removeListeners();

    if (this.drawingShapes)
      this.drawingShapes.forEach((s) => {
        removeObjectById(s.id);
      });

    const shapesToDelete = [];
    app.upperCanvasLayer.shapes.forEach((s) => {
      if (s.geometryObject?.geometryIsCharacteristicElements)
        shapesToDelete.push(s);
    });
    shapesToDelete.forEach((s) => removeObjectById(s.id));

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  trans() {
    this.removeListeners();

    this.startTime = Date.now();
    this.animate();
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  get referenceShape() {
    return findObjectById(app.tool.referenceShapeId);
  }

  canvasMouseDown() {
    const coord = app.workspace.lastKnownMouseCoordinates;
    if (this.pointsDrawn.length === 0) {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.canSelectFromUpper = true;
      app.workspace.selectionConstraints.points.canSelect = true;
      const object = SelectManager.selectObject(coord);
      if (
        object instanceof Segment &&
        !object.isArc() &&
        object.shape instanceof ArrowLineShape
      ) {
        if (object.layer === 'upper') {
          this.characteristicElements =
            object.shape.geometryObject.geometryTransformationCharacteristicElements;
          let referenceShape;
          if (this.characteristicElements.type === 'vector') {
            referenceShape = new ArrowLineShape({
              path: this.characteristicElements.firstElement.getSVGPath(
                'no scale',
                true,
              ),
              layer: 'upper',
              strokeColor: app.settings.referenceDrawColor,
              strokeWidth: 2,
            });
          } else {
            const firstPoint = this.characteristicElements.firstElement;
            const secondPoint = this.characteristicElements.secondElement;
            referenceShape = new ArrowLineShape({
              path: `M ${firstPoint.coordinates.x} ${firstPoint.coordinates.y} L ${secondPoint.coordinates.x} ${secondPoint.coordinates.y}`,
              layer: 'upper',
              strokeColor: app.settings.referenceDrawColor,
              strokeWidth: 2,
            });
          }
          setState({
            tool: {
              ...app.tool,
              name: this.name,
              currentStep: 'selectObject',
              referenceShapeId: referenceShape.id,
            },
          });
        } else {
          this.characteristicElements = new CharacteristicElements({
            type: 'vector',
            elementIds: [object.id],
          });
          const referenceShape = new ArrowLineShape({
            path: object.getSVGPath('no scale', true),
            layer: 'upper',
            strokeColor: app.settings.referenceDrawColor,
            strokeWidth: 2,
          });
          setState({
            tool: {
              ...app.tool,
              name: this.name,
              currentStep: 'selectObject',
              referenceShapeId: referenceShape.id,
            },
          });
        }
      } else {
        this.pointsDrawn.push(
          new Point({
            coordinates: coord,
            layer: 'upper',
            color: app.settings.referenceDrawColor,
            size: 2,
          }),
        );
        setState({
          tool: {
            ...app.tool,
            name: this.name,
            currentStep: 'animateFirstRefPoint',
          },
        });
      }
    } else {
      this.pointsDrawn.push(
        new Point({
          coordinates: coord,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 2,
        }),
      );
      const segment = new Segment({
        layer: 'upper',
        vertexIds: this.pointsDrawn.map((pt) => pt.id),
      });
      const referenceShape = new ArrowLineShape({
        layer: 'upper',
        segmentIds: [segment.id],
        pointIds: this.pointsDrawn.map((pt) => pt.id),
        strokeColor: app.settings.referenceDrawColor,
        strokeWidth: 2,
      });
      setState({
        tool: {
          ...app.tool,
          name: this.name,
          currentStep: 'animateSecondRefPoint',
          referenceShapeId: referenceShape.id,
        },
      });
    }
  }

  canvasMouseUp() {
    this.stopAnimation();

    if (app.tool.currentStep === 'animateFirstRefPoint') {
      const coord = app.workspace.lastKnownMouseCoordinates;
      const object = SelectManager.selectObject(coord);
      const reference = object ? object : this.pointsDrawn[0];
      this.characteristicElements = new CharacteristicElements({
        type: 'two-points',
        elementIds: [reference.id],
      });
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'selectReference' },
      });
    } else {
      const coord = app.workspace.lastKnownMouseCoordinates;
      const object = SelectManager.selectObject(coord);
      if (object) {
        this.secondReference = object;
      } else {
        this.secondReference = this.pointsDrawn[1];
      }
      this.characteristicElements.elementIds.push(this.secondReference.id);
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'selectObject' },
      });
    }
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
        currentStep: 'trans',
      },
    });
  }

  animate() {
    if (app.tool.currentStep === 'animateFirstRefPoint') {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
      return;
    } else if (app.tool.currentStep === 'animateSecondRefPoint') {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
      return;
    }
    this.lastProgress = this.progress || 0;
    if (this.lastProgress === 0) {
      const vector = this.referenceShape.points[1].coordinates.substract(
        this.referenceShape.points[0].coordinates,
      );
      this.drawingShapes.forEach((s) =>
        s.points.forEach((point) => {
          point.startCoordinates = new Coordinates(point.coordinates);
          point.endCoordinates = new Coordinates({
            x: point.x + vector.x,
            y: point.y + vector.y,
          });
        }),
      );
    }
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.tool.name === 'translation') {
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
    if (app.tool.currentStep === 'trans') {
      app.upperCanvasLayer.points.forEach((point) => {
        if (point.startCoordinates) {
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(this.progress),
          );
        }
      });
    } else if (app.tool.currentStep === 'animateFirstRefPoint') {
      const coord = app.workspace.lastKnownMouseCoordinates;
      const object = SelectManager.selectObject(coord);
      if (object) {
        this.pointsDrawn[0].coordinates = object.coordinates;
      } else {
        this.pointsDrawn[0].coordinates = coord;
      }
    } else if (app.tool.currentStep === 'animateSecondRefPoint') {
      const coord = app.workspace.lastKnownMouseCoordinates;
      const object = SelectManager.selectObject(coord);
      if (object) {
        this.pointsDrawn[1].coordinates = object.coordinates;
      } else {
        this.pointsDrawn[1].coordinates = coord;
      }
    }
  }

  _executeAction() {
    if (this.characteristicElements.type === 'two-points') {
      this.characteristicElements.elementIds.forEach((elemId, idx) => {
        const element = findObjectById(elemId);
        if (element.layer === 'upper') {
          this.characteristicElements.elementIds[idx] = new SinglePointShape({
            layer: 'main',
            path: `M ${element.coordinates.x} ${element.coordinates.y}`,
            name: 'Point',
            familyName: 'Point',
            geometryObject: new GeometryObject({}),
          }).points[0].id;
        }
      });
    }

    if (
      !app.workspace.translationLastCharacteristicElements.find((elements) =>
        this.characteristicElements.equal(elements),
      )
    ) {
      app.workspace.translationLastCharacteristicElements.push(
        this.characteristicElements,
      );
    }

    const vector = this.referenceShape.segments[0];

    const newShapes = this.involvedShapes.map((s) => {
      const newShape = new s.constructor({
        ...s,
        layer: 'main',
        id: undefined,
        familyName: 'transformation',
        path: s.getSVGPath('no scale', false),
        // divisionPointInfos: s.divisionPoints.map((dp) => {
        //   return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, color: dp.color };
        // }),
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
          geometryTransformationName: 'translation',
          geometryIsVisible: s.geometryObject.geometryIsVisible,
          geometryIsHidden: s.geometryObject.geometryIsHidden,
          geometryIsConstaintDraw: s.geometryObject.geometryIsConstaintDraw,
        }),
      });

      s.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      newShape.geometryObject.geometryTransformationCharacteristicElements.elementIds.forEach(
        (refId) => {
          const ref = findObjectById(refId);
          if (
            !ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(
              newShape.id,
            )
          ) {
            ref.shape.geometryObject.geometryTransformationChildShapeIds.push(
              newShape.id,
            );
          }
        },
      );
      newShape.translate(
        vector.points[1].coordinates.substract(vector.points[0].coordinates),
      );
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
    app.workspace.translationLastCharacteristicElements.forEach(
      (characteristicElement) => {
        if (characteristicElement.type === 'vector') {
          const axis = findObjectById(characteristicElement.elementIds[0]);
          const coordinates = [
            axis.points[0].coordinates,
            axis.points[1].coordinates,
          ];
          const shape = new ArrowLineShape({
            layer: 'upper',
            path: `M ${coordinates[0].x} ${coordinates[0].y} L ${coordinates[1].x} ${coordinates[1].y}`,
            name: 'Vector',
            familyName: 'Line',
            strokeColor: app.settings.referenceDrawColor2,
            strokeWidth: 2,
            geometryObject: new GeometryObject({
              geometryIsCharacteristicElements: true,
              geometryTransformationCharacteristicElements:
                characteristicElement,
            }),
          });
        } else {
          const firstPoint = findObjectById(
            characteristicElement.elementIds[0],
          );
          const secondPoint = findObjectById(
            characteristicElement.elementIds[1],
          );

          const shape = new ArrowLineShape({
            layer: 'upper',
            path: `M ${firstPoint.coordinates.x} ${firstPoint.coordinates.y} L ${secondPoint.coordinates.x} ${secondPoint.coordinates.y}`,
            name: 'Vector',
            familyName: 'Line',
            strokeColor: app.settings.referenceDrawColor2,
            strokeWidth: 2,
            geometryObject: new GeometryObject({
              geometryIsCharacteristicElements: true,
              geometryTransformationCharacteristicElements:
                characteristicElement,
            }),
          });
          shape.points[0].color = app.settings.referenceDrawColor;
          shape.points[0].size = 2;
          shape.points[1].color = app.settings.referenceDrawColor;
          shape.points[1].size = 2;
        }
      },
    );
  }
}
