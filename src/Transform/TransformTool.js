import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { Shape } from '../Core/Objects/Shape';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import {
    computeShapeTransform,
    computeAllShapeTransform,
    computeConstructionSpec,
    projectionOnConstraints
} from '../GeometryTools/recomputeShape';
import { getAllInvolvedShapes } from '../GeometryTools/general';

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

    app.workspace.selectionConstraints.points.types = ['vertex'];
    app.workspace.selectionConstraints.points.whitelist = null;
    app.workspace.selectionConstraints.points.blacklist = null;

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

  objectSelected(point) {
    if (point.reference) {
      point = app.mainDrawingEnvironment.findObjectById(point.reference, 'point');
    }

    app.upperDrawingEnvironment.removeAllObjects();

    point.computeTransformConstraint();
    this.constraints = point.transformConstraints;

    this.pointSelectedId = point.id;

    let involvedShapes = [point.shape];
    getAllInvolvedShapes(point.shape, involvedShapes);

    this.drawingShapes = involvedShapes.map(
      (s) => {
        let newShape = new Shape({
          ...s,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: s.getSVGPath('no scale', false, false),
          divisionPointInfos: s.segments.map((seg, idx) => seg.divisionPoints.map((dp) => {
            return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: idx, id: dp.id };
          })).flat(),
        });
        let segIds = newShape.segments.map((seg, idx) => seg.id = s.segments[idx].id);
        let ptIds = newShape.points.map((seg, idx) => seg.id = s.points[idx].id);
        newShape.segmentIds = [...segIds];
        newShape.pointIds = [...ptIds];
        newShape.segments.forEach((seg, idx) => {
          seg.isInfinite = s.segments[idx].isInfinite;
          seg.isSemiInfinite = s.segments[idx].isSemiInfinite;
          seg.vertexIds = [...s.segments[idx].vertexIds];
          seg.divisionPointIds = [...s.segments[idx].divisionPointIds];
        });
        newShape.points.forEach((pt, idx) => {
          pt.segmentIds = [...s.points[idx].segmentIds];
          pt.reference = s.points[idx].reference;
          pt.visible = s.points[idx].visible;
          pt.transformConstraints = s.points[idx].transformConstraints;
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
      point.coordinates = app.workspace.lastKnownMouseCoordinates;
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
      computeShapeTransform(shape, [0]);
      if (shape.name == 'RightAngleTrapeze2')
        computeConstructionSpec(shape);
      computeAllShapeTransform(shape);
    } else if (app.tool.currentStep == 'selectPoint') {
      app.mainDrawingEnvironment.shapes.forEach((s) => {
        let points = s.vertexes;
        points.forEach((pt) => {
          const transformConstraints = pt.transformConstraints;
          const colorPicker = {
            [transformConstraints.isFree]: '#0f0',
            [transformConstraints.isBlocked]: '#f00',
            [transformConstraints.isConstructed]: '#f00',
            [transformConstraints.isConstrained]: '#FF8C00',
          };
          const color = colorPicker[true];

          if (color != '#f00')
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

  drawConstraints(point) {
    if (point.transformConstraints.isConstrained) {
      point.transformConstraints.lines.forEach(ln => {
        let segment = ln.segment;
        let shape = new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: segment.getSVGPath('no scale', true),
          borderColor: app.settings.constraintsDrawColor,
          opacity: 0,
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
