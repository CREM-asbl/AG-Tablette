import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { Shape } from '../Core/Objects/Shape';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';

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
      <h2>${toolName}</h2>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br /></p>
    `;
  }

  start() {
    this.shapeId = null;
    this.pointSelected = null;
    this.pointDest = null;
    this.constraints = null;
    this.line = null;

    app.workspace.shapes.forEach((s) => {
      s.modifiablePoints.forEach((pt) => {
        pt.computeTransformConstraint();
      });
    });

    window.dispatchEvent(new CustomEvent('refreshUpper'));
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectPoint' } }), 50);
  }

  selectPoint() {
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'mousedown';
    app.workspace.selectionConstraints.points.canSelect = true;

    app.workspace.selectionConstraints.points.types = ['vertex'];
    app.workspace.selectionConstraints.points.whitelist = null;
    app.workspace.selectionConstraints.points.blacklist = null;

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

  getAllInvolvedShapes(shape, involvedShapes) {
    shape.hasGeometryReferenced.forEach(ref => {
      let s = app.mainDrawingEnvironment.findObjectById(ref);
      involvedShapes = [...involvedShapes, s];
      this.getAllInvolvedShapes(s, involvedShapes);
    });
    return involvedShapes;
  }

  objectSelected(point) {
    // this.shapeId = this.pointSelected.shape.id;

    point.computeTransformConstraint();
    this.constraints = point.transformConstraints;

    this.pointSelectedId = point.id;

    let involvedShapes = this.getAllInvolvedShapes(point.shape, [point.shape]);
    console.log(involvedShapes);

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
        });
        return newShape;
      }
    );
    console.log(this.drawingShapes);

    app.mainDrawingEnvironment.editingShapeIds = involvedShapes.map(
      (s) => s.id,
    );

    console.log(this.constraints);
    // if (this.constraints.isConstructed || this.constraints.isBlocked) return;

    setState({ tool: { ...app.tool, name: this.name, currentStep: 'transform' } })
    // window.dispatchEvent(new CustomEvent('refresh'));
  }

  canvasMouseUp() {
    if (this.line == null) {
      // pas de contrainte
      let constraints = SelectManager.getEmptySelectionConstraints().points;
      constraints.canSelect = true;
      let adjustedPoint = SelectManager.selectPoint(
        this.pointDest,
        constraints,
        false,
      );
      if (adjustedPoint) {
        this.pointDest.setCoordinates(adjustedPoint);
      }
    }

    this.executeAction();
    this.restart();
  }

  refreshStateUpper() {
    console.log(app.tool.currentStep);
    if (app.tool.currentStep == 'transform') {
      let point = app.upperDrawingEnvironment.findObjectById(this.pointSelectedId, 'point');
      point.coordinates = app.workspace.lastKnownMouseCoordinates;
      console.log('here');
      this.computeShapeTransform(point.shape);
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
  computeShapeTransform(shape) {
    console.log(shape);
    if (shape.familyName == 'Regular') {
      let externalAngle = (Math.PI * 2) / shape.segments.length;
      if (shape.isReversed) {
        externalAngle *= -1;
      }
      let v1 = shape.segments[0].vertexes[0].coordinates;
      let v2 = shape.segments[0].vertexes[1].coordinates;

      let length = v1.dist(v2);
      let startAngle = Math.atan2(-(v1.y - v2.y), -(v1.x - v2.x));

      for (let i = 2; i < shape.vertexes.length; i++) {
        let dx = length * Math.cos(startAngle - (i - 1) * externalAngle);
        let dy = length * Math.sin(startAngle - (i - 1) * externalAngle);

        let coord = shape.vertexes[i - 1].coordinates.add(new Coordinates({x: dx, y: dy}));

        shape.vertexes[i].coordinates = coord;
      }
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
