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
import { isAngleBetweenTwoAngles } from '../Core/Tools/geometry';

/**
 */
export class RotationTool extends Tool {
  constructor() {
    super('rotation', 'Rotation', 'transformation');
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

    this.showLastCharacteristicElements('rotationCenter');

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
      this.showLastCharacteristicElements('arcs');
    }

    // this.setSelectionConstraints();
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animateRefPoint() {
    this.removeListeners();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    this.animate();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  selectDirection() {
    this.removeListeners();

    window.setTimeout(
      () =>
        (this.mouseClickId = app.addListener('canvasClick', this.handler)),
    );
  }

  selectObject() {
    if (this.drawingShapes)
      this.drawingShapes.forEach(s => {
        removeObjectById(s.id)
      })

    this.removeListeners();

    let shapesToDelete = [];
    app.upperCanvasLayer.shapes.forEach(s => {
      if (s.geometryObject?.geometryIsCharacteristicElements)
        shapesToDelete.push(s);
    });
    shapesToDelete.forEach(s => removeObjectById(s.id));

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  rot() {
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
    if (this.pointsDrawn.length == 1) {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.canSelectFromUpper = true;
      app.workspace.selectionConstraints.points.canSelect = true;
      // app.workspace.selectionConstraints.segments.numberOfObjects = 'allInDistance';
      let object = SelectManager.selectObject(coord);
      if (object instanceof Segment && object.isArc() && object.shape instanceof ArrowLineShape) {
        let firstElementId = this.characteristicElements.elementIds[0];
        let referenceShape;
        if (object.layer == 'upper') {
          this.characteristicElements = new CharacteristicElements(object.shape.geometryObject.geometryTransformationCharacteristicElements);
          if (this.characteristicElements.type == 'arc') {
            referenceShape = new ArrowLineShape({
              path: this.characteristicElements.secondElement.getSVGPath('no scale', true),
              layer: 'upper',
              strokeColor: app.settings.referenceDrawColor,
              strokeWidth: 2,
            });
          } else {
            let points = this.characteristicElements.elements.slice(1).map(pt => new Point({...pt, id: null, shapeId: undefined, layer: 'upper'}));
            let radius = points[0].coordinates.dist(points[2].coordinates);
            let angle = points[2].coordinates.angleWith(points[1].coordinates);
            const projectionCoord = points[2].coordinates.add({
              x: radius * Math.cos(angle),
              y: radius * Math.sin(angle),
            });
            points[1].coordinates = projectionCoord;

            let counterclockwise = this.characteristicElements.counterclockwise;
            let seg = new Segment({
              layer: 'upper',
              idx: 0,
              vertexIds: [points[0].id, points[1].id],
              arcCenterId: points[2].id,
              counterclockwise: counterclockwise,
            });
            referenceShape = new ArrowLineShape({
              layer: 'upper',
              segmentIds: [seg.id],
              pointIds: points.map(pt => pt.id),
              name: 'arc',
              familyName: 'circle-shape',
              fillOpacity: 0,
              geometryObject: new GeometryObject({}),
              strokeWidth: 2,
              strokeColor: app.settings.referenceDrawColor,
            });
          }
        } else {
          this.characteristicElements = new CharacteristicElements({ type: 'arc', elementIds: [null, object.id] });
          referenceShape = new ArrowLineShape({
            path: object.getSVGPath('no scale', true),
            layer: 'upper',
            strokeColor: app.settings.referenceDrawColor,
            strokeWidth: 2,
          });
        }
        this.angle = referenceShape.segments[0].arcCenter.coordinates.angleWith(referenceShape.vertexes[0].coordinates) - referenceShape.segments[0].arcCenter.coordinates.angleWith(referenceShape.vertexes[1].coordinates);
        this.angle *= -1;
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject', referenceShapeId: referenceShape.id } });
        this.characteristicElements.elementIds[0] = firstElementId;
        return;
      }
    }
    this.pointsDrawn.push(new Point({
      coordinates: coord,
      layer: 'upper',
      color: app.settings.referenceDrawColor,
      size: 2,
    }));
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'animateRefPoint' } });
  }

  canvasMouseUp() {
    this.stopAnimation();

    let coord = app.workspace.lastKnownMouseCoordinates;
    let object = SelectManager.selectObject(coord);
    let reference = object ? object : this.pointsDrawn[this.pointsDrawn.length - 1];
    if (this.characteristicElements) {
      this.characteristicElements.elementIds.push(reference.id)
    } else {
      this.characteristicElements = new CharacteristicElements({ type: 'points', elementIds: [reference.id] });
    }
    if (this.pointsDrawn.length < 4) {
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } });
    } else {
      this.angle = this.pointsDrawn[2].coordinates.angleWith(this.pointsDrawn[1].coordinates) - this.pointsDrawn[2].coordinates.angleWith(this.pointsDrawn[3].coordinates);
      this.angle *= -1;

      let radius = this.pointsDrawn[1].coordinates.dist(this.pointsDrawn[2].coordinates);
      let angle = this.pointsDrawn[2].coordinates.angleWith(this.pointsDrawn[3].coordinates);
      const projectionCoord = this.pointsDrawn[2].coordinates.add({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
      let arcPoints0 = [
        new Point({
          coordinates: this.pointsDrawn[1].coordinates,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        }),
        new Point({
          coordinates: projectionCoord,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        }),
        new Point({
          coordinates: this.pointsDrawn[2].coordinates,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        }),
      ];
      let arcPoints1 = [
        new Point({
          coordinates: this.pointsDrawn[1].coordinates,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        }),
        new Point({
          coordinates: projectionCoord,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        }),
        new Point({
          coordinates: this.pointsDrawn[2].coordinates,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        }),
      ];
      let arcSeg0 = new Segment({
        layer: 'upper',
        idx: 0,
        vertexIds: [arcPoints0[0].id, arcPoints0[1].id],
        arcCenterId: arcPoints0[2].id,
        counterclockwise: this.angle < 0,
      });
      let arcSeg1 = new Segment({
        layer: 'upper',
        idx: 0,
        vertexIds: [arcPoints1[0].id, arcPoints1[1].id],
        arcCenterId: arcPoints1[2].id,
        counterclockwise: this.angle >= 0,
      });
      this.arcShape0 = new ArrowLineShape({
        layer: 'upper',
        segmentIds: [arcSeg0.id],
        pointIds: arcPoints0.map(pt => pt.id),
        name: 'arrow',
        familyName: 'circle-shape',
        strokeColor: app.settings.referenceDrawColor,
        fillOpacity: 0,
        geometryObject: {},
        strokeWidth: 2,
      });
      this.arcShape1 = new ArrowLineShape({
        layer: 'upper',
        segmentIds: [arcSeg1.id],
        pointIds: arcPoints1.map(pt => pt.id),
        name: 'arrow',
        familyName: 'circle-shape',
        strokeColor: app.settings.referenceDrawColor2,
        fillOpacity: 0,
        geometryObject: {},
        strokeWidth: 2,
      });

      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectDirection' } });
    }
  }

  canvasClick() {
    let angle = this.pointsDrawn[2].coordinates.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    let startAngle = this.pointsDrawn[2].coordinates.angleWith(
      this.pointsDrawn[1].coordinates,
    );
    let endAngle = this.pointsDrawn[2].coordinates.angleWith(
      this.pointsDrawn[3].coordinates,
    );
    let isAngleInside = isAngleBetweenTwoAngles(
      startAngle,
      endAngle,
      false,
      angle,
    );
    this.clockwise = isAngleInside;
    this.characteristicElements.clockwise = this.clockwise;
    if (this.arcShape0.segments[0].counterclockwise == this.clockwise) {
      removeObjectById(
        this.arcShape0.id
      );
      // this.characteristicElements.elementIds.splice(1, 3, ...this.arcShape1.segments[0].vertexIds, this.arcShape1.segments[0].arcCenterId);
    } else {
      removeObjectById(
        this.arcShape1.id
      );
      // this.characteristicElements.elementIds.splice(1, 3, ...this.arcShape0.segments[0].vertexIds, this.arcShape0.segments[0].arcCenterId);
    }

    if (!(this.angle < 0 ^ this.clockwise)) {
      if (this.angle > 0) this.angle -= 2 * Math.PI;
      else if (this.angle < 0) this.angle += 2 * Math.PI;
    }

    this.characteristicElements.elementIds.splice(2, 2, this.characteristicElements.elementIds[3],  this.characteristicElements.elementIds[2]);

    setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
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
        currentStep: 'rot'
      }
    });
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  animate() {
    if (app.tool.currentStep == 'animateRefPoint') {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
      return;
    }
    this.lastProgress = this.progress || 0;
    if (this.lastProgress == 0) {
      let rotationCenter = this.characteristicElements.firstElement;
      this.drawingShapes.forEach(s => s.points.forEach((point) => {
        point.startCoordinates = new Coordinates(point.coordinates);
        let startAngle = rotationCenter.coordinates.angleWith(
          point.coordinates
        );
        let length = rotationCenter.coordinates.dist(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: rotationCenter.x + Math.cos(startAngle + this.angle) * length,
          y: rotationCenter.x + Math.sin(startAngle + this.angle) * length,
        });
      }));
    }
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.tool.name == 'rotation') {
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
    if (app.tool.currentStep == 'rot') {
      app.upperCanvasLayer.points.forEach((point) => {
        if (point.startCoordinates) {
          let startAngle = this.pointsDrawn[0].coordinates.angleWith(
            point.startCoordinates
          );
          let length = this.pointsDrawn[0].coordinates.dist(point.startCoordinates);
          point.coordinates = new Coordinates({
            x: this.pointsDrawn[0].x + Math.cos(startAngle + this.angle * this.progress) * length,
            y: this.pointsDrawn[0].y + Math.sin(startAngle + this.angle * this.progress) * length,
          });
        }
      });
    } else if (app.tool.currentStep == 'animateRefPoint') {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.pointsDrawn[this.pointsDrawn.length - 1].coordinates = object.coordinates;
      } else {
        this.pointsDrawn[this.pointsDrawn.length - 1].coordinates = coord;
      }
    }
  }

  _executeAction() {
    if (this.characteristicElements.type == 'points') {
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
    } else {
      let rotationCenter = this.characteristicElements.firstElement;
      if (rotationCenter.layer == 'upper') {
        this.characteristicElements.elementIds[0] = new SinglePointShape({
          layer: 'main',
          path: `M ${rotationCenter.coordinates.x} ${rotationCenter.coordinates.y}`,
          name: 'Point',
          familyName: 'Point',
          geometryObject: new GeometryObject({}),
        }).points[0].id;
      }
    }

    if (!app.workspace.rotationLastCharacteristicElements.find(elements => this.characteristicElements.equal(elements))) {
      app.workspace.rotationLastCharacteristicElements.push(this.characteristicElements);
    }

    // let vector = this.referenceShape.segments[0];

    let newShapes = this.involvedShapes.map(s => {
      let newShape = new s.constructor({
        ...s,
        layer: 'main',
        familyName: 'transformation',
        id: undefined,
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
          geometryTransformationName: 'rotation',
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

      // newShape.geometryObject.geometryTransformationCharacteristicElementIds.map((refId) => {
      //   let ref = findObjectById(refId);
      //   if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
      //     ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      //   }
      // });

      newShape.rotate(this.angle, this.characteristicElements.firstElement.coordinates);
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

  setSelectionConstraints() {
    let constraints = app.fastSelectionConstraints.mousedown_all_shape;
    constraints.shapes.blacklist = app.mainCanvasLayer.shapes.filter(s => s.geometryObject.geometryPointOnTheFlyChildId);
    app.workspace.selectionConstraints = constraints;
  }

  showLastCharacteristicElements(typeOfObjectToShow) {
    if (typeOfObjectToShow == 'rotationCenter') {
      let allRotationCenters = app.workspace.rotationLastCharacteristicElements
        .map(lastElements => lastElements.firstElement)
        .filter((element, index, elements) => elements.indexOf(element) === index);
      allRotationCenters.forEach(point => {
        let shape = new SinglePointShape({
          layer: 'upper',
          path: `M ${point.coordinates.x} ${point.coordinates.y}`,
          name: 'Point',
          familyName: 'Point',
          geometryObject: new GeometryObject({
            geometryIsCharacteristicElements: true,
            geometryTransformationCharacteristicElements: null,
          }),
        })
        shape.points[0].color = app.settings.referenceDrawColor2;
        shape.points[0].size = 2;
      });
    } else {
      app.workspace.rotationLastCharacteristicElements.forEach(characteristicElement => {
        let points;
        if (characteristicElement.type == 'arc') {
          let arc = findObjectById(characteristicElement.elementIds[1]);
          points = [...arc.vertexes, arc.arcCenter];
        } else {
          points = characteristicElement.elements.slice(1);
          // shape.points[0].color = app.settings.referenceDrawColor;
          // shape.points[0].size = 2;
          // shape.points[1].color = app.settings.referenceDrawColor;
          // shape.points[1].size = 2;
          let radius = points[0].coordinates.dist(points[2].coordinates);
          let angle = points[2].coordinates.angleWith(points[1].coordinates);
          const projectionCoord = points[2].coordinates.add({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
          });
          points[1] = new Point({
            layer: 'upper',
            coordinates: projectionCoord,
            isVisible: false,
          });
        }
        let firstVertex = new Point({
          coordinates: points[0].coordinates,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        });
        let secondVertex = new Point({
          coordinates: points[1].coordinates,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        });
        let arcCenter = new Point({
          coordinates: points[2].coordinates,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        });
        let seg = new Segment({
          layer: 'upper',
          idx: 0,
          vertexIds: [firstVertex.id, secondVertex.id],
          arcCenterId: arcCenter.id,
          counterclockwise: !characteristicElement.clockwise,
        });
        let shapeCenter = new Point({
          coordinates: points[2].coordinates,
          layer: 'upper',
          type: 'shapeCenter',
          color: app.settings.referenceDrawColor,
          size: 0.1,
        })
        let shape = new ArrowLineShape({
          layer: 'upper',
          segmentIds: [seg.id],
          pointIds: [firstVertex, secondVertex, arcCenter, shapeCenter].map(pt => pt.id),
          name: 'arc',
          familyName: 'circle-shape',
          strokeColor: app.settings.referenceDrawColor2,
          strokeWidth: 2,
          fillOpacity: 0,
          geometryObject: new GeometryObject({
            geometryIsCharacteristicElements: true,
            geometryTransformationCharacteristicElements: characteristicElement,
          }),
        });
        seg.shapeId = shape.id;
      })
    }
  }
}
