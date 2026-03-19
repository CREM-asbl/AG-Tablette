import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { SelectManager } from '../Core/Managers/SelectManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { CharacteristicElements } from '../Core/Objects/CharacteristicElements';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { findObjectById, removeObjectById } from '../Core/Tools/general';
import { orthogonalSymetryHelpConfig } from './orthogonalSymetry.helpConfig';

export class OrthogonalSymetryTool extends Tool {
  constructor() {
    super('orthogonalSymetry', 'Symétrie orthogonale', 'transformation');
  }

  updateToolStep(step, extraState = {}) {
    appActions.setToolState(extraState);
    appActions.setCurrentStep(step);
  }

  start() {
    helpConfigRegistry.register(this.name, orthogonalSymetryHelpConfig);

    this.removeListeners();
    this.duration = app.settings.geometryTransformationAnimation
      ? app.settings.geometryTransformationAnimationDuration
      : 0.001;

    appActions.setActiveTool(this.name);

    setTimeout(
      () => this.updateToolStep('selectFirstReference'),
      50,
    );
  }

  selectFirstReference() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    this.referenceShapeId = null;
    this.showLastCharacteristicElements();

    this.pointsDrawn = [];
    this.characteristicElements = null;

    setTimeout(
      () => this.updateToolStep('selectReference'),
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
      if (
        s.geometryObject?.geometryIsCharacteristicElements &&
        s.id != this.referenceShapeId
      )
        shapesToDelete.push(s);
    });
    shapesToDelete.forEach((s) => removeObjectById(s.id));

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  ortho() {
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
    return findObjectById(app.tool.referenceShapeId || this.referenceShapeId);
  }

  canvasMouseDown() {
    const coord = app.workspace.lastKnownMouseCoordinates;
    if (this.pointsDrawn.length === 0) {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'mousedown';
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.canSelectFromUpper = true;
      app.workspace.selectionConstraints.points.canSelect = false;
      const object = SelectManager.selectObject(coord);
      const isSegmentLike = (candidate) =>
        !!candidate &&
        typeof candidate.isArc === 'function' &&
        typeof candidate.getSVGPath === 'function';

      const getDistanceToSegment = (segment, point) => {
        if (!segment || typeof segment.projectionOnSegment !== 'function') {
          return Number.POSITIVE_INFINITY;
        }
        const projected = segment.projectionOnSegment(point);
        if (!projected) return Number.POSITIVE_INFINITY;
        if (typeof projected.dist === 'function') {
          return projected.dist(point);
        }
        const dx = (projected.x ?? 0) - (point.x ?? 0);
        const dy = (projected.y ?? 0) - (point.y ?? 0);
        return Math.sqrt(dx * dx + dy * dy);
      };

      const findNearestSegment = (point) => {
        const zoomLevel = app.workspace.zoomLevel || 1;
        const maxDistance = 30 / zoomLevel;

        const upperSegments = app.upperCanvasLayer.shapes
          .flatMap((shape) => shape.segments || [])
          .filter(isSegmentLike);
        const mainSegments = app.mainCanvasLayer.shapes
          .flatMap((shape) => shape.segments || [])
          .filter(isSegmentLike);

        const allSegments = [...upperSegments, ...mainSegments];
        let bestSegment = null;
        let bestDistance = Number.POSITIVE_INFINITY;
        allSegments.forEach((segment) => {
          const distance = getDistanceToSegment(segment, point);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestSegment = segment;
          }
        });

        return bestDistance <= maxDistance ? bestSegment : null;
      };

      let selectedSegment =
        isSegmentLike(object)
          ? object
          : object?.segments?.find((seg) => isSegmentLike(seg)) || null;

      if (!selectedSegment && typeof SelectManager.selectSegment === 'function') {
        const segmentConstraints =
          SelectManager.getEmptySelectionConstraints().segments;
        segmentConstraints.canSelect = true;
        segmentConstraints.blockHidden = true;
        segmentConstraints.canSelectFromUpper = true;
        selectedSegment = SelectManager.selectSegment(coord, segmentConstraints);
      }

      if (!selectedSegment) {
        selectedSegment = findNearestSegment(coord);
      }

      if (selectedSegment && !selectedSegment.isArc()) {
        if (selectedSegment.layer === 'upper') {
          this.characteristicElements =
            selectedSegment.shape.geometryObject.geometryTransformationCharacteristicElements;
          let referenceShape;
          if (this.characteristicElements.type === 'axis') {
            referenceShape = new LineShape({
              path: this.characteristicElements.firstElement.getSVGPath(
                'no scale',
                true,
              ),
              layer: 'upper',
              strokeColor: app.settings.referenceDrawColor,
              strokeWidth: 2,
              geometryObject: new GeometryObject({
                geometryIsCharacteristicElements: true,
                geometryTransformationCharacteristicElements:
                  this.characteristicElements,
              }),
            });
          } else {
            const firstPoint = this.characteristicElements.firstElement;
            const secondPoint = this.characteristicElements.secondElement;
            referenceShape = new LineShape({
              path: `M ${firstPoint.coordinates.x} ${firstPoint.coordinates.y} L ${secondPoint.coordinates.x} ${secondPoint.coordinates.y}`,
              layer: 'upper',
              strokeColor: app.settings.referenceDrawColor,
              strokeWidth: 2,
              geometryObject: new GeometryObject({
                geometryIsCharacteristicElements: true,
                geometryTransformationCharacteristicElements:
                  this.characteristicElements,
              }),
            });
          }
          referenceShape.segments[0].isInfinite = true;
          this.referenceShapeId = referenceShape.id;
          this.updateToolStep('selectObject', {
            referenceShapeId: referenceShape.id,
          });
          window.dispatchEvent(new CustomEvent('refreshUpper'));
        } else {
          this.characteristicElements = new CharacteristicElements({
            type: 'axis',
            elementIds: [selectedSegment.id],
          });
          const referenceShape = new LineShape({
            path: selectedSegment.getSVGPath('no scale', true),
            layer: 'upper',
            strokeColor: app.settings.referenceDrawColor,
            strokeWidth: 2,
            geometryObject: new GeometryObject({
              geometryIsCharacteristicElements: true,
              geometryTransformationCharacteristicElements:
                this.characteristicElements,
            }),
          });
          referenceShape.segments[0].isInfinite = true;
          this.referenceShapeId = referenceShape.id;
          this.updateToolStep('selectObject', {
            referenceShapeId: referenceShape.id,
          });
          window.dispatchEvent(new CustomEvent('refreshUpper'));
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
        this.updateToolStep('animateFirstRefPoint', {
          numberOfPointsDrawn: this.pointsDrawn.length,
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
        isInfinite: true,
      });
      const referenceShape = new LineShape({
        layer: 'upper',
        segmentIds: [segment.id],
        pointIds: this.pointsDrawn.map((pt) => pt.id),
        strokeColor: app.settings.referenceDrawColor,
        strokeWidth: 2,
        geometryObject: new GeometryObject({
          geometryIsCharacteristicElements: true,
        }),
      });
      this.referenceShapeId = referenceShape.id;
      this.updateToolStep('animateSecondRefPoint', {
        referenceShapeId: referenceShape.id,
        numberOfPointsDrawn: this.pointsDrawn.length,
      });
    }
  }

  canvasMouseUp() {
    this.stopAnimation();

    if (app.tool.currentStep === 'animateFirstRefPoint') {
      const coord = app.workspace.lastKnownMouseCoordinates;
      const object = SelectManager.selectObject(coord);
      if (object) {
        this.firstReference = object;
      } else {
        this.firstReference = this.pointsDrawn[0];
      }
      this.characteristicElements = new CharacteristicElements({
        type: 'two-points',
        elementIds: [this.firstReference.id],
      });
      this.updateToolStep('selectReference', {
        numberOfPointsDrawn: this.pointsDrawn.length,
      });
    } else if (app.tool.currentStep === 'animateSecondRefPoint') {
      const coord = app.workspace.lastKnownMouseCoordinates;
      const object = SelectManager.selectObject(coord);
      if (object) {
        this.secondReference = object;
      } else {
        this.secondReference = this.pointsDrawn[1];
      }
      this.characteristicElements.elementIds.push(this.secondReference.id);
      this.updateToolStep('selectObject', {
        referenceShapeId: app.tool.referenceShapeId || this.referenceShapeId,
        numberOfPointsDrawn: this.pointsDrawn.length,
      });
      window.dispatchEvent(new CustomEvent('refreshUpper'));
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
    this.updateToolStep('ortho', {
      referenceShapeId: app.tool.referenceShapeId || this.referenceShapeId,
      numberOfPointsDrawn: this.pointsDrawn?.length,
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
      this.drawingShapes.forEach((s) =>
        s.points.forEach((point) => {
          const center = this.referenceShape.segments[0].projectionOnSegment(
            point.coordinates,
          );
          point.startCoordinates = new Coordinates(point.coordinates);
          point.endCoordinates = new Coordinates({
            x: point.x + 2 * (center.x - point.x),
            y: point.y + 2 * (center.y - point.y),
          });
        }),
      );
    }
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.tool.name === 'orthogonalSymetry') {
      this.executeAction();
      this.updateToolStep('selectObject', {
        referenceShapeId: app.tool.referenceShapeId || this.referenceShapeId,
        numberOfPointsDrawn: this.pointsDrawn?.length,
      });
    } else {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep === 'ortho') {
      const progressInAnimation =
        Math.cos(Math.PI * (1 - this.progress)) / 2 + 0.5;
      app.upperCanvasLayer.points.forEach((point) => {
        if (point.startCoordinates) {
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(progressInAnimation),
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
      !app.workspace.orthogonalSymetryLastCharacteristicElements.find(
        (elements) => this.characteristicElements.equal(elements),
      )
    ) {
      app.workspace.orthogonalSymetryLastCharacteristicElements.push(
        this.characteristicElements,
      );
    }

    const selectedAxis = this.referenceShape.segments[0];

    const newShapes = this.involvedShapes.map((s) => {
      const newShape = new s.constructor({
        ...s,
        layer: 'main',
        id: undefined,
        familyName: 'transformation',
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
          geometryTransformationName: 'orthogonalSymetry',
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
      this.reverseShape(newShape, selectedAxis);
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

  reverseShape(shape, selectedAxis) {
    shape.reverse();

    shape.points.forEach((pt) => {
      this.computePointPosition(pt, selectedAxis);
    });
  }

  computePointPosition(point, selectedAxis) {
    const center = selectedAxis.projectionOnSegment(point);

    point.coordinates = point.coordinates.add(
      center.substract(point.coordinates).multiply(2),
    );
  }

  setSelectionConstraints() {
    const constraints = app.fastSelectionConstraints.mousedown_all_shape;
    constraints.shapes.blacklist = app.mainCanvasLayer.shapes.filter(
      (s) => s.geometryObject.geometryPointOnTheFlyChildId,
    );
    app.workspace.selectionConstraints = constraints;
  }

  showLastCharacteristicElements() {
    app.workspace.ensureCharacteristicElementsFromShapes?.('orthogonalSymetry');
    app.workspace.orthogonalSymetryLastCharacteristicElements.forEach(
      (characteristicElement) => {
        const firstElement = findObjectById(characteristicElement.elementIds[0]);
        const secondElement = findObjectById(
          characteristicElement.elementIds[1],
        );

        // Legacy data can miss `type: 'axis'` but still store a single linear element id.
        const hasSingleLinearReference =
          !!firstElement?.points?.[0] &&
          !!firstElement?.points?.[1] &&
          characteristicElement.elementIds.length <= 1;

        if (characteristicElement.type === 'axis' || hasSingleLinearReference) {
          const linearElement = firstElement;
          if (!linearElement?.points?.[0] || !linearElement?.points?.[1]) {
            return;
          }
          const coordinates = [
            linearElement.points[0].coordinates,
            linearElement.points[1].coordinates,
          ];
          const shape = new LineShape({
            layer: 'upper',
            path: `M ${coordinates[0].x} ${coordinates[0].y} L ${coordinates[1].x} ${coordinates[1].y}`,
            name: 'StraightLine',
            familyName: 'Line',
            strokeColor: app.settings.referenceDrawColor2,
            strokeWidth: 2,
            geometryObject: new GeometryObject({
              geometryIsCharacteristicElements: true,
              geometryTransformationCharacteristicElements:
                characteristicElement,
            }),
          });
          shape.segments[0].isInfinite = true;
        } else {
          const firstPoint = firstElement;
          const secondPoint = secondElement;
          if (!firstPoint?.coordinates || !secondPoint?.coordinates) {
            return;
          }

          const shape = new LineShape({
            layer: 'upper',
            path: `M ${firstPoint.coordinates.x} ${firstPoint.coordinates.y} L ${secondPoint.coordinates.x} ${secondPoint.coordinates.y}`,
            name: 'StraightLine',
            familyName: 'Line',
            strokeColor: app.settings.referenceDrawColor2,
            strokeWidth: 2,
            geometryObject: new GeometryObject({
              geometryIsCharacteristicElements: true,
              geometryTransformationCharacteristicElements:
                characteristicElement,
            }),
          });
          shape.segments[0].isInfinite = true;
          shape.points[0].color = app.settings.referenceDrawColor2;
          shape.points[0].size = 2;
          shape.points[1].color = app.settings.referenceDrawColor2;
          shape.points[1].size = 2;
        }
      },
    );
  }
}
