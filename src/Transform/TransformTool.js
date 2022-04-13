import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Tool } from '../Core/States/Tool';
import { getAllLinkedShapesInGeometry } from '../GeometryTools/general';
import {
    computeAllShapeTransform,
    computeConstructionSpec,
    computeShapeTransform,
    projectionOnConstraints,
    computeDivisionPoint
} from '../GeometryTools/recomputeShape';
import { GridManager } from '../Grid/GridManager';

/**
 * Ajout de figures sur l'espace de travail
 */
export class TransformTool extends Tool {
  constructor() {
    super('transform', 'Modifier une figure', 'operation');

    // show-points -> move-point
    this.currentStep = null;

    // id of the shape that contains the point
    this.shapeId = null;

    // point to modify
    this.pointSelected = null;

    // destination point
    this.pointDest = null;

    // the constraints applied to pointSelected
    this.constraints = null;

    // line de contrainte (segment, droite, demi-droite ou arc de cercle, cercle)
    this.line = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br /></p>
    `;
  }

  start() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();

    this.shapeId = null;
    this.pointSelected = null;
    this.pointDest = null;
    this.constraints = null;
    this.line = null;

    app.mainDrawingEnvironment.shapes.forEach((s) => {
      s.vertexes.forEach((pt) => {
        pt.computeTransformConstraint();
      });
      if (s.familyName == 'circle-shape' || s.familyName == 'Irregular') {
        s.points.filter(pt =>
          pt.type == 'arcCenter'
        ).forEach(pt => {
          pt.computeTransformConstraint();
        });
      }
    });

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectPoint' } }), 50);
  }

  selectPoint() {
    this.constraintsDrawn = false;
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'mousedown';
    app.workspace.selectionConstraints.points.canSelect = true;

    app.workspace.selectionConstraints.points.types = ['vertex', 'arcCenter'];
    app.workspace.selectionConstraints.points.whitelist = null;
    app.workspace.selectionConstraints.points.blacklist = null;
    app.workspace.selectionConstraints.points.numberOfObjects = 'allInDistance';

    window.dispatchEvent(new CustomEvent('refreshUpper'));
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  transform() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
    this.animate();
  }

  end() {
    this.constraintsDrawn = false;
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  objectSelected(points) {
    for (let i = 0; i < points.length; i++) {
      if (points[i].reference) {
        points[i] = app.mainDrawingEnvironment.findObjectById(points[i].reference, 'point');
        i--;
      } else {
        points[i].computeTransformConstraint();
        let constraints = points[i].transformConstraints;
        if (constraints.isBlocked || constraints.isConstructed) {
          points.splice(i, 1);
          i--;
        }
      }
    }

    if (points.length == 0)
      return

    let point = points.find(point => point.shape.name == 'PointOnLine');
    if (!point)
      point = points[0]

    this.constraints = point.transformConstraints;

    app.upperDrawingEnvironment.removeAllObjects();

    this.pointSelectedId = point.id;

    // let involvedShapes = [point.shape];
    // getAllLinkedShapesInGeometry(point.shape, involvedShapes);
    let involvedShapes = app.mainDrawingEnvironment.shapes;

    this.drawingShapes = involvedShapes.map(
      (s) => {
        let newShape = new s.constructor({
          ...s,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: s.getSVGPath('no scale', false, false),
          divisionPointInfos: s.divisionPoints.map((dp) => {
            return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, id: dp.id, color: dp.color };
          }),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points.map((pt) => {
            return pt.color;
          }),
        });
        let segIds = newShape.segments.map((seg, idx) => seg.id = s.segments[idx].id);
        let ptIds = newShape.points.map((pt, idx) => pt.id = s.points[idx].id);
        newShape.segmentIds = [...segIds];
        newShape.pointIds = [...ptIds];
        newShape.segments.forEach((seg, idx) => {
          seg.isInfinite = s.segments[idx].isInfinite;
          seg.isSemiInfinite = s.segments[idx].isSemiInfinite;
          seg.vertexIds = [...s.segments[idx].vertexIds];
          seg.divisionPointIds = [...s.segments[idx].divisionPointIds];
          seg.arcCenterId = s.segments[idx].arcCenterId;
        });
        newShape.points.forEach((pt, idx) => {
          pt.segmentIds = [...s.points[idx].segmentIds];
          pt.reference = s.points[idx].reference;
          pt.visible = s.points[idx].visible;
          pt.ratio = s.points[idx].ratio;
          pt.transformConstraints = s.points[idx].transformConstraints;
          pt.type = s.points[idx].type;
          pt.endpointIds = [...s.points[idx].endpointIds];
        });
        return newShape;
      }
    );

    app.mainDrawingEnvironment.editingShapeIds = involvedShapes.map(
      (s) => s.id,
    );

    // if (this.constraints.isConstructed || this.constraints.isBlocked) return;

    setState({ tool: { ...app.tool, name: this.name, currentStep: 'transform' } })
    // window.dispatchEvent(new CustomEvent('refresh'));
  }

  canvasMouseUp() {
    this.stopAnimation();
    // if (this.line == null) {
    //   // pas de contrainte
    //   let constraints = SelectManager.getEmptySelectionConstraints().points;
    //   constraints.canSelect = true;
    //   let adjustedPoint = SelectManager.selectPoint(
    //     this.pointDest,
    //     constraints,
    //     false,
    //   );
    //   if (adjustedPoint) {
    //     this.pointDest.setCoordinates(adjustedPoint);
    //   }
    // }

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectPoint' } })
    // this.restart();
  }

  _executeAction() {
    app.mainDrawingEnvironment.editingShapeIds.forEach((sId, idxS) => {
      let s = app.mainDrawingEnvironment.findObjectById(sId);
      s.points.forEach((pt, idxPt) => {
        pt.coordinates = new Coordinates(this.drawingShapes[idxS].points[idxPt].coordinates);
        pt.ratio = this.drawingShapes[idxS].points[idxPt].ratio;
      });
    });
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'transform') {
      let point = app.upperDrawingEnvironment.findObjectById(this.pointSelectedId, 'point');
      if (!this.constraintsDrawn) {
        this.drawConstraints(point);
      }
      let shape = point.shape;
      if (shape.name == 'Trapeze' && point.idx < 3) {
        computeConstructionSpec(shape);
      } else if (point.idx < 2) {
        switch (shape.name) {
          case 'Rectangle':
          case 'Losange':
          case 'Parallelogram':
          // case 'RightAngleTrapeze':
          case 'RightAngleTrapeze2':
          case 'IsoscelesTrapeze':
          case 'RightAngleIsoscelesTriangle':
          case 'RightAngleTriangle':
          case 'IsoscelesTriangle':
            computeConstructionSpec(shape);
            break;
          default:
            break;
        }
      }
      if (point.idx == 0) {
        switch (shape.name) {
          case 'ParalleleSemiStraightLine':
          case 'PerpendicularSemiStraightLine':
          case 'ParalleleSegment':
          case 'PerpendicularSegment':
            computeConstructionSpec(shape);
          default:
            break;
        }
      }
      point.coordinates = app.workspace.lastKnownMouseCoordinates;
      this.adjustPoint(point);
      if (shape.name == 'Trapeze' && point.idx >= 3) {
        point.coordinates = projectionOnConstraints(point.coordinates, point.transformConstraints);
        computeConstructionSpec(shape);
      } else if (point.idx >= 2) {
        switch (shape.name) {
          case 'Rectangle':
          case 'Losange':
          case 'RightAngleIsoscelesTriangle':
          case 'RightAngleTriangle':
          case 'IsoscelesTriangle':
          case 'RightAngleTrapeze2':
            point.coordinates = projectionOnConstraints(point.coordinates, point.transformConstraints);
          case 'Parallelogram':
          // case 'RightAngleTrapeze':
          case 'IsoscelesTrapeze':
            computeConstructionSpec(shape, point.idx);
            break;
          default:
            break;
        }
      }
      if (point.idx == 1) {
        switch (shape.name) {
          case 'ParalleleSemiStraightLine':
          case 'PerpendicularSemiStraightLine':
          case 'ParalleleSegment':
          case 'PerpendicularSegment':
            point.coordinates = projectionOnConstraints(point.coordinates, point.transformConstraints);
            computeConstructionSpec(shape);
          default:
            break;
        }
      }
      if (shape.name == 'PointOnLine') {
        let reference = app.upperDrawingEnvironment.findObjectById(shape.geometryObject.geometryParentObjectId1, 'segment');
        point.coordinates = reference.projectionOnSegment(point.coordinates);
        // let ratio = reference.vertexes[0].coordinates.dist(shape.points[0].coordinates) / reference.length;
        let ratioX = (point.coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
        let ratioY = (point.coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
        let ratio = ratioX;
        if (isNaN(ratio))
          ratio = ratioY;

        if (ratio < 0 && (reference.shape.name.endsWith('SemiStraightLine') || !reference.shape.name.endsWith('StraightLine')))
          ratio = 0;
        if (ratio > 1 && !reference.shape.name.endsWith('StraightLine'))
          ratio = 1;
        if (reference.shape.name == 'Circle') {
          let refShape = reference.shape;
          const angle = refShape.segments[0].arcCenter.coordinates.angleWith(point.coordinates);
          const refAngle = refShape.segments[0].arcCenter.coordinates.angleWith(refShape.vertexes[0].coordinates);
          ratio = (angle - refAngle) / Math.PI / 2;
          if (ratio < 0)
            ratio += 1;
        }
        point.ratio = ratio;
      }
      computeShapeTransform(shape);
      if (shape.name == 'RightAngleTrapeze2')
        computeConstructionSpec(shape);
      if (shape.name == 'PointOnLine') {
        let reference = app.upperDrawingEnvironment.findObjectById(shape.geometryObject.geometryParentObjectId1, 'segment');
        computeShapeTransform(reference.shape);
        computeAllShapeTransform(reference.shape);
      } else {
        computeAllShapeTransform(shape);
      }
    } else if (app.tool.currentStep == 'selectPoint') {
      app.mainDrawingEnvironment.shapes.filter(s => s.geometryObject.geometryIsVisible !== false && s.geometryObject.geometryIsHidden !== true).forEach((s) => {
        let points = [...s.vertexes, ...s.points.filter(pt => pt.type == 'arcCenter')];
        points.forEach((pt) => {
          const transformConstraints = pt.transformConstraints;
          const colorPicker = {
            [transformConstraints.isFree]: '#0f0',
            [transformConstraints.isBlocked]: '#f00',
            [transformConstraints.isConstructed]: '#f00',
            [transformConstraints.isConstrained]: '#FF8C00',
          };
          const color = colorPicker[true];

          if (color != '#f00' && color != undefined)
            new Point({
              drawingEnvironment: app.upperDrawingEnvironment,
              coordinates: pt.coordinates,
              size: 2,
              color: color,
            })
          // window.dispatchEvent(
          //   new CustomEvent('draw-point', {
          //     detail: { point: pt, size: 2, color: color },
          //   }),
          // );
        });
      });
    }
  }

  adjustPoint(point) {
    let constraints = SelectManager.getEmptySelectionConstraints().points;
    constraints.canSelect = true;
    if (point.shape.name == 'PointOnLine') {
      let segment = app.upperDrawingEnvironment.findObjectById(point.shape.geometryObject.geometryParentObjectId1, 'segment');
      constraints.whitelist = [
        { shapeId: segment.shape.id, type: 'divisionPoint', index: segment.idx },
        { shapeId: segment.shape.id, type: 'vertex', index: segment.idx },
        { shapeId: segment.shape.id, type: 'vertex', index: (segment.idx + 1) % segment.shape.segmentIds.length }
      ];
    } else if (point.transformConstraints.isConstrained) {
      return;
    } else {
      constraints.blacklist = this.drawingShapes.map((s) => {
        return { shapeId: s.id };
      });
    }
    let adjustedCoordinates = SelectManager.selectPoint(
      point.coordinates,
      constraints,
      false,
    );
    if (adjustedCoordinates) {
      point.coordinates = new Coordinates(adjustedCoordinates.coordinates);
    } else if (point.shape.name != 'PointOnLine') {
      let gridPoint = GridManager.getClosestGridPoint(point.coordinates);
      if (gridPoint)
        point.coordinates = new Coordinates(gridPoint.coordinates);
    }
  }

  drawConstraints(point) {
    if (point.transformConstraints.isConstrained) {
      point.transformConstraints.lines.forEach(ln => {
        let segment = ln.segment;
        let shape = new LineShape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: segment.getSVGPath('no scale', true),
          strokeColor: app.settings.constraintsDrawColor,
          fillOpacity: 0,
        });
        if (ln.isInfinite)
          shape.segments[0].isInfinite = true;
        shape.vertexes.forEach(pt => pt.visible = false);
      });
      point.transformConstraints.points.forEach(pt => {
        new Point({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: pt,
          color: app.settings.constraintsDrawColor,
          size: 2,
        });
      });
      this.constraintsDrawn = true;
    }
  }
}
