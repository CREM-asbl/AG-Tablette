import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { Shape } from '../Core/Objects/Shape';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { computeShapeTransform, computeAllShapeTransform } from '../GeometryTools/recomputeShape';
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
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  objectSelected(point) {
    // this.shapeId = this.pointSelected.shape.id;

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
          path: s.getSVGPath('no scale'),
          divisionPointInfos: s.segments.map((seg, idx) => seg.divisionPoints.map((dp) => {
            return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: idx, id: dp.id };
          })).flat(),
        });
        let segIds = newShape.segments.map((seg, idx) => seg.id = s.segments[idx].id);
        let ptIds = newShape.points.map((seg, idx) => seg.id = s.points[idx].id);
        newShape.segmentIds = [...segIds];
        newShape.pointIds = [...ptIds];
        newShape.segments.forEach((seg, idx) => {
          seg.vertexIds = [...s.segments[idx].vertexIds];
          seg.divisionPointIds = [...s.segments[idx].divisionPointIds];
        });
        newShape.points.forEach((pt, idx) => {
          pt.segmentIds = [...s.points[idx].segmentIds];
          pt.reference = s.points[idx].reference;
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
      point.coordinates = app.workspace.lastKnownMouseCoordinates;
      computeShapeTransform(point.shape);
      computeAllShapeTransform(point.shape);
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
    return;
    if (this.currentStep == 'show-points') {
      app.workspace.shapes.forEach((s) => {
        let points = s.modifiablePoints;
        points.forEach((pt) => {
          const transformConstraints = pt.transformConstraints;
          const colorPicker = {
            [transformConstraints.isFree]: '#0f0',
            [transformConstraints.isBlocked]: '#f00',
            [transformConstraints.isConstructed]: '#f00',
            [transformConstraints.isConstrained]: '#FF8C00',
          };
          const color = colorPicker[true];

          window.dispatchEvent(
            new CustomEvent('draw-point', {
              detail: { point: pt, size: 2, color: color },
            }),
          );
        });
      });
    } else if (this.currentStep == 'move-point') {
      if (this.constraints.isConstrained) {
        this.pointDest = this.projectionOnConstraints(
          app.workspace.lastKnownMouseCoordinates,
          this.constraints,
        );

        this.constraints.lines.forEach((line) => {
          window.dispatchEvent(
            new CustomEvent(line.isInfinite ? 'draw-line' : 'draw-segment', {
              detail: { segment: line.segment, color: '#080' },
            }),
          );
        });
        this.constraints.points.forEach((pt) => {
          window.dispatchEvent(
            new CustomEvent('draw-point', {
              detail: {
                point: pt,
                color: app.settings.constraintsDrawColor,
                size: 2,
              },
            }),
          );
        });
      } else {
        this.pointDest = app.workspace.lastKnownMouseCoordinates;
      }

      let shapeCopy = new Shape({
        ...this.pointSelected.shape,
        borderColor: app.settings.temporaryDrawColor,
      });

      shapeCopy.applyTransform(this.pointSelected, this.pointDest);

      window.dispatchEvent(
        new CustomEvent('draw-shape', {
          detail: { shape: shapeCopy, borderSize: 2 },
        }),
      );

      shapeCopy.modifiablePoints.forEach((pt) => {
        window.dispatchEvent(
          new CustomEvent('draw-point', {
            detail: {
              point: pt,
              size: 2,
              color: app.settings.temporaryDrawColor,
            },
          }),
        );
      });

      shapeCopy.updateGeometryReferenced(true);
    }
  }

  projectionOnConstraints(point, constraints) {
    let projectionsOnContraints = constraints.lines
      .map((line) => {
        let projection = line.segment.projectionOnSegment(point);
        let dist = projection.dist(point);
        return { projection: projection, dist: dist };
      })
      .concat(
        constraints.points.map((pt) => {
          let dist = pt.dist(point);
          return { projection: pt, dist: dist };
        }),
      );
    projectionsOnContraints.sort((p1, p2) => (p1.dist > p2.dist ? 1 : -1));
    return projectionsOnContraints[0].projection;
  }
}
