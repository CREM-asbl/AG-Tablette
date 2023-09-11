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

export class OrthogonalSymetryTool extends Tool {
  constructor() {
    super('orthogonalSymetry', 'Symétrie orthogonale', 'transformation');
  }

  start() {
    this.removeListeners();
    this.duration = app.settings.geometryTransformationAnimation ? app.settings.geometryTransformationAnimationDuration : 0.001;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectFirstReference' } }), 50);
  }

  selectFirstReference() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    this.showLastCharacteristicElements();

    this.pointsDrawn = [];
    this.characteristicElements = null;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  selectReference() {
    this.removeListeners();

    if (this.pointsDrawn.length == 1) {
      let shapesToDelete = [];
      app.upperCanvasLayer.shapes.forEach(s => {
        if (s.geometryObject?.geometryIsCharacteristicElements)
          shapesToDelete.push(s);
      });
      shapesToDelete.forEach(s => removeObjectById(s.id));
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
      this.drawingShapes.forEach(s => {
        removeObjectById(s.id);
      })

    let shapesToDelete = [];
    app.upperCanvasLayer.shapes.forEach(s => {
      if (s.geometryObject?.geometryIsCharacteristicElements)
        shapesToDelete.push(s);
    });
    shapesToDelete.forEach(s => removeObjectById(s.id));

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
    return findObjectById(app.tool.referenceShapeId);
  }

  canvasMouseDown() {
    let coord = app.workspace.lastKnownMouseCoordinates;
    if (this.pointsDrawn.length == 0) {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.canSelectFromUpper = true;
      app.workspace.selectionConstraints.points.canSelect = true;
      let object = SelectManager.selectObject(coord);
      if (object instanceof Segment && !object.isArc()) {
        if (object.layer == 'upper') {
          this.characteristicElements = object.shape.geometryObject.geometryTransformationCharacteristicElements;
          let referenceShape;
          if (this.characteristicElements.type == 'axis') {
            referenceShape = new LineShape({
              path: this.characteristicElements.firstElement.getSVGPath('no scale', true),
              layer: 'upper',
              strokeColor: app.settings.referenceDrawColor,
              strokeWidth: 2,
            });
          } else {
            let firstPoint = this.characteristicElements.firstElement;
            let secondPoint = this.characteristicElements.secondElement;
            referenceShape = new LineShape({
              path: `M ${firstPoint.coordinates.x} ${firstPoint.coordinates.y} L ${secondPoint.coordinates.x} ${secondPoint.coordinates.y}`,
              layer: 'upper',
              strokeColor: app.settings.referenceDrawColor,
              strokeWidth: 2,
            });
          }
          referenceShape.segments[0].isInfinite = true;
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject', referenceShapeId: referenceShape.id } });
        } else {
          this.characteristicElements = new CharacteristicElements({ type: 'axis', elementIds: [object.id] });
          let referenceShape = new LineShape({
            path: object.getSVGPath('no scale', true),
            layer: 'upper',
            strokeColor: app.settings.referenceDrawColor,
            strokeWidth: 2,
          });
          referenceShape.segments[0].isInfinite = true;
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject', referenceShapeId: referenceShape.id } });
        }
      } else {
        this.pointsDrawn.push(new Point({
          coordinates: coord,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 2,
        }));
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'animateFirstRefPoint' } });
      }
    } else {
      this.pointsDrawn.push(new Point({
        coordinates: coord,
        layer: 'upper',
        color: app.settings.referenceDrawColor,
        size: 2,
      }));
      let segment = new Segment({
        layer: 'upper',
        vertexIds: this.pointsDrawn.map((pt) => pt.id),
        isInfinite: true,
      });
      let referenceShape = new LineShape({
        layer: 'upper',
        segmentIds: [segment.id],
        pointIds: this.pointsDrawn.map((pt) => pt.id),
        strokeColor: app.settings.referenceDrawColor,
        strokeWidth: 2,
      });
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'animateSecondRefPoint', referenceShapeId: referenceShape.id } });
    }
  }

  canvasMouseUp() {
    this.stopAnimation();

    if (app.tool.currentStep == 'animateFirstRefPoint') {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.firstReference = object;
      } else {
        this.firstReference = this.pointsDrawn[0];
      }
      this.characteristicElements = new CharacteristicElements({ type: 'two-points', elementIds: [this.firstReference.id] });
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } });
    } else {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.secondReference = object;
      } else {
        this.secondReference = this.pointsDrawn[1];
      }
      this.characteristicElements.elementIds.push(this.secondReference.id);
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
    }
  }

  objectSelected(object) {
    this.involvedShapes = ShapeManager.getAllBindedShapes(object);
    this.drawingShapes = this.involvedShapes.map(
      (s) =>
        new s.constructor({
          ...s,
          layer: 'upper',
          path: s.getSVGPath('no scale', false),
          id: undefined,
          // divisionPointInfos: s.divisionPoints.map((dp) => {
          //   return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, color: dp.color };
          // }),
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
        currentStep: 'ortho'
      }
    });
  }

  animate() {
    if (app.tool.currentStep == 'animateFirstRefPoint') {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
      return;
    } else if (app.tool.currentStep == 'animateSecondRefPoint') {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
      return;
    }
    this.lastProgress = this.progress || 0;
    if (this.lastProgress == 0) {
      this.drawingShapes.forEach(s => s.points.forEach((point) => {
        let center = this.referenceShape.segments[0].projectionOnSegment(point.coordinates);
        point.startCoordinates = new Coordinates(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: point.x + 2 * (center.x - point.x),
          y: point.y + 2 * (center.y - point.y),
        });
      }));
    }
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.tool.name == 'orthogonalSymetry') {
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
    if (app.tool.currentStep == 'ortho') {
      let progressInAnimation = Math.cos(Math.PI * (1 - this.progress)) / 2 + 0.5;
      app.upperCanvasLayer.points.forEach((point) => {
        if (point.startCoordinates) {
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(progressInAnimation),
          );
        }
      });
    } else if (app.tool.currentStep == 'animateFirstRefPoint') {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.pointsDrawn[0].coordinates = object.coordinates;
      } else {
        this.pointsDrawn[0].coordinates = coord;
      }
    } else if (app.tool.currentStep == 'animateSecondRefPoint') {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.pointsDrawn[1].coordinates = object.coordinates;
      } else {
        this.pointsDrawn[1].coordinates = coord;
      }
    }
  }

  _executeAction() {
    if (this.characteristicElements.type == 'two-points') {
      this.characteristicElements.elementIds.forEach((elemId, idx) => {
        let element = findObjectById(elemId);
        if (element.layer == 'upper') {
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

    if (!app.workspace.orthogonalSymetryLastCharacteristicElements.find(elements => this.characteristicElements.equal(elements))) {
      app.workspace.orthogonalSymetryLastCharacteristicElements.push(this.characteristicElements);
    }

    let selectedAxis = this.referenceShape.segments[0];

    let newShapes = this.involvedShapes.map(s => {
      let newShape = new s.constructor({
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
          geometryTransformationCharacteristicElements: this.characteristicElements,
          geometryTransformationName: 'orthogonalSymetry',
          geometryIsVisible: s.geometryObject.geometryIsVisible,
          geometryIsHidden: s.geometryObject.geometryIsHidden,
          geometryIsConstaintDraw: s.geometryObject.geometryIsConstaintDraw,
        }),
      });

      s.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      newShape.geometryObject.geometryTransformationCharacteristicElements.elementIds.forEach(refId => {
        let ref = findObjectById(refId);
        if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
      });
      this.reverseShape(newShape, selectedAxis);
      newShape.points.forEach((pt, idx) => {
        pt.geometryIsVisible = s.points[idx].geometryIsVisible;
        pt.geometryIsHidden = s.points[idx].geometryIsHidden;
      });
      return newShape;
    });

    if (newShapes.length > 1) {
      let userGroup = new ShapeGroup(0, 1);
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

  /**
   * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale
   * @param  {Point} point    le point
   * @param  {Object} axe      L'axe de symétrie
   * @return {Point}          Nouvelles coordonnées
   */
  computePointPosition(point, selectedAxis) {
    let center = selectedAxis.projectionOnSegment(point);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    point.coordinates = point.coordinates.add(
      center.substract(point.coordinates).multiply(2),
    );
  }

  setSelectionConstraints() {
    let constraints = app.fastSelectionConstraints.mousedown_all_shape;
    constraints.shapes.blacklist = app.mainCanvasLayer.shapes.filter(s => s.geometryObject.geometryPointOnTheFlyChildId);
    app.workspace.selectionConstraints = constraints;
  }

  showLastCharacteristicElements() {
    app.workspace.orthogonalSymetryLastCharacteristicElements.forEach(characteristicElement => {
      if (characteristicElement.type == 'axis') {
        let axis = findObjectById(characteristicElement.elementIds[0]);
        let coordinates = [axis.points[0].coordinates, axis.points[1].coordinates];
        let shape = new LineShape({
          layer: 'upper',
          path: `M ${coordinates[0].x} ${coordinates[0].y} L ${coordinates[1].x} ${coordinates[1].y}`,
          name: 'StraightLine',
          familyName: 'Line',
          strokeColor: app.settings.referenceDrawColor2,
          strokeWidth: 2,
          geometryObject: new GeometryObject({
            geometryIsCharacteristicElements: true,
            geometryTransformationCharacteristicElements: characteristicElement,
          }),
        });
        shape.segments[0].isInfinite = true;
      } else {
        let firstPoint = findObjectById(characteristicElement.elementIds[0]);
        let secondPoint = findObjectById(characteristicElement.elementIds[1]);

        let shape = new LineShape({
          layer: 'upper',
          path: `M ${firstPoint.coordinates.x} ${firstPoint.coordinates.y} L ${secondPoint.coordinates.x} ${secondPoint.coordinates.y}`,
          name: 'StraightLine',
          familyName: 'Line',
          strokeColor: app.settings.referenceDrawColor2,
          strokeWidth: 2,
          geometryObject: new GeometryObject({
            geometryIsCharacteristicElements: true,
            geometryTransformationCharacteristicElements: characteristicElement,
          }),
        });
        shape.points[0].color = app.settings.referenceDrawColor2;
        shape.points[0].size = 2;
        shape.points[1].color = app.settings.referenceDrawColor2;
        shape.points[1].size = 2;
      }
    })
  }
}
