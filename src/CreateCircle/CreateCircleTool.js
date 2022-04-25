import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { createElem } from '../Core/Tools/general';
import { isAngleBetweenTwoAngles } from '../Core/Tools/geometry';
import { GridManager } from '../Grid/GridManager';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateCircleTool extends Tool {
  constructor() {
    super('createCircle', 'Dessiner un cercle', 'geometryCreator');

    // show-quadrilaterals -> select-points -> select-direction
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    this.clockwise = undefined;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   */
   start() {
    this.removeListeners();
    this.stopAnimation();

    import('./circles-list');
    createElem('circles-list');
  }

  async drawFirstPoint() {
    this.removeListeners();
    this.stopAnimation();
    // let triangleDef = await import(`./trianglesDef.js`);
    // this.triangleDef = triangleDef[app.tool.selectedTriangle];

    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } }), 50);
  }

  drawPoint() {
    this.removeListeners();
    this.stopAnimation();

    this.getConstraints(this.numberOfPointsDrawn);

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animatePoint() {
    this.removeListeners();
    this.animate();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  showArrow() {
    this.removeListeners();
    this.stopAnimation();

    window.setTimeout(
      () =>
        (this.mouseClickId = app.addListener('canvasClick', this.handler)),
    );
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
    this.stopAnimation();
  }

  canvasMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    if (this.constraints.type == 'isConstrained' && !this.constraints.projectionOnConstraints(newCoordinates, true)) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez placer le point sur la contrainte.' } }))
      return;
    }

    if (app.tool.currentStep == 'drawPoint') {
      this.points[this.numberOfPointsDrawn] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
      this.numberOfPointsDrawn++;
      if (this.numberOfPointsDrawn == 2) {
        if (app.tool.selectedCircle == 'Circle') {
          let seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[1].id, this.points[1].id],
            arcCenterId: this.points[0].id,
          });
          this.segments.push(seg);
          new RegularShape({
            drawingEnvironment: app.upperDrawingEnvironment,
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        } else if (app.tool.selectedCircle == 'CirclePart') {
          let seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[0].id, this.points[1].id],
          });
          this.segments.push(seg);
          new RegularShape({
            drawingEnvironment: app.upperDrawingEnvironment,
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        } else if (app.tool.selectedCircle == '30degreesArc') {
          let angle = this.points[0].coordinates.angleWith(this.points[1].coordinates) + Math.PI / 6;
          let radius = this.points[0].coordinates.dist(this.points[1].coordinates);
          let thirdPointCoordinates = new Coordinates({
            x: this.points[0].coordinates.x + Math.cos(angle) * radius,
            y: this.points[0].coordinates.y + Math.sin(angle) * radius,
          })
          this.points[this.numberOfPointsDrawn] = new Point({
            drawingEnvironment: app.upperDrawingEnvironment,
            coordinates: thirdPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          });
          let seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[1].id, this.points[2].id],
            arcCenterId: this.points[0].id,
          });
          this.segments.push(seg);
          new ArrowLineShape({
            drawingEnvironment: app.upperDrawingEnvironment,
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        } else if (app.tool.selectedCircle == '45degreesArc') {
          let angle = this.points[0].coordinates.angleWith(this.points[1].coordinates) + Math.PI / 4;
          let radius = this.points[0].coordinates.dist(this.points[1].coordinates);
          let thirdPointCoordinates = new Coordinates({
            x: this.points[0].coordinates.x + Math.cos(angle) * radius,
            y: this.points[0].coordinates.y + Math.sin(angle) * radius,
          })
          this.points[this.numberOfPointsDrawn] = new Point({
            drawingEnvironment: app.upperDrawingEnvironment,
            coordinates: thirdPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          });
          let seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[1].id, this.points[2].id],
            arcCenterId: this.points[0].id,
          });
          this.segments.push(seg);
          new ArrowLineShape({
            drawingEnvironment: app.upperDrawingEnvironment,
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        }
      } else if (this.numberOfPointsDrawn == 3) {
        if (
          app.tool.selectedCircle == 'CirclePart' ||
          app.tool.selectedCircle == 'CircleArc'
        ) {
          let seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[1].id, this.points[2].id],
            arcCenterId: this.points[0].id,
          });
          this.segments.push(seg);
          seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[2].id, this.points[1].id],
            arcCenterId: this.points[0].id,
          });
          this.segments.push(seg);
        }
        if (app.tool.selectedCircle == 'CirclePart') {
          let seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[2].id, this.points[0].id],
          });
          this.segments.push(seg);
        }
        new RegularShape({
          drawingEnvironment: app.upperDrawingEnvironment,
          segmentIds: this.segments.map((seg) => seg.id),
          pointIds: this.points.map((pt) => pt.id),
          strokeColor: app.settings.temporaryDrawColor,
          fillOpacity: 0,
        });
      }
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' } });
    }
  }

  canvasMouseUp() {
    if (this.numberOfPointsDrawn == 2 && this.points[0].coordinates.dist(this.points[1].coordinates) < app.settings.magnetismDistance) {
      let firstPointCoordinates = this.points[0].coordinates;
      this.numberOfPointsDrawn = 1;
      app.upperDrawingEnvironment.removeAllObjects();
      this.points[0] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: firstPointCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
      this.segments = [];
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez placer le point autre part.' } }));
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
      return;
    }

    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      if (
        app.tool.selectedCircle == 'CirclePart' ||
        app.tool.selectedCircle == 'CircleArc'
      ) {
        this.stopAnimation();
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'showArrow' } });
      } else {
        this.stopAnimation();
        this.executeAction();
        app.upperDrawingEnvironment.removeAllObjects();
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' } });
      }
    } else {
      this.getConstraints(this.numberOfPointsDrawn);
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
    }
  }

  canvasClick() {
    let angle = this.points[0].coordinates.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    let startAngle = this.points[0].coordinates.angleWith(
      this.points[1].coordinates,
    );
    let endAngle = this.points[0].coordinates.angleWith(
      this.points[2].coordinates,
    );
    let isAngleInside = isAngleBetweenTwoAngles(
      startAngle,
      endAngle,
      false,
      angle,
    );
    this.clockwise = isAngleInside;
    this.executeAction();
    app.upperDrawingEnvironment.removeAllObjects();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' } });
  }

  adjustPoint(point) {
    if (this.constraints.isFree) {
      let constraints = SelectManager.getEmptySelectionConstraints().points;
      constraints.canSelect = true;
      let adjustedCoordinates = SelectManager.selectPoint(
        point.coordinates,
        constraints,
        false,
      );
      if (adjustedCoordinates) {
        point.coordinates = new Coordinates(adjustedCoordinates.coordinates);
      } else {
        let gridPoint = GridManager.getClosestGridPoint(point.coordinates);
        if (gridPoint)
          point.coordinates = new Coordinates(gridPoint.coordinates);
      }
    } else {
      let adjustedCoordinates = this.constraints.projectionOnConstraints(
        point.coordinates,
      );
      point.coordinates = new Coordinates(adjustedCoordinates);
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'animatePoint') {
      this.points[this.numberOfPointsDrawn - 1].coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.points[this.numberOfPointsDrawn - 1]);
      if (app.tool.selectedCircle == '30degreesArc' && this.numberOfPointsDrawn == 2) {
        let angle = this.points[0].coordinates.angleWith(this.points[1].coordinates) + Math.PI / 6;
        let radius = this.points[0].coordinates.dist(this.points[1].coordinates);
        let thirdPointCoordinates = new Coordinates({
          x: this.points[0].coordinates.x + Math.cos(angle) * radius,
          y: this.points[0].coordinates.y + Math.sin(angle) * radius,
        });
        this.points[this.numberOfPointsDrawn].coordinates = thirdPointCoordinates;
      } else if (app.tool.selectedCircle == '45degreesArc' && this.numberOfPointsDrawn == 2) {
        let angle = this.points[0].coordinates.angleWith(this.points[1].coordinates) + Math.PI / 4;
        let radius = this.points[0].coordinates.dist(this.points[1].coordinates);
        let thirdPointCoordinates = new Coordinates({
          x: this.points[0].coordinates.x + Math.cos(angle) * radius,
          y: this.points[0].coordinates.y + Math.sin(angle) * radius,
        });
        this.points[this.numberOfPointsDrawn].coordinates = thirdPointCoordinates;
      }
    }
  }

  numberOfPointsRequired() {
    let numberOfPointsRequired = 0;
    if (app.tool.selectedCircle == 'Circle') numberOfPointsRequired = 2;
    else if (app.tool.selectedCircle == 'CirclePart') numberOfPointsRequired = 3;
    else if (app.tool.selectedCircle == 'CircleArc') numberOfPointsRequired = 3;
    else if (app.tool.selectedCircle == '30degreesArc') numberOfPointsRequired = 2;
    else if (app.tool.selectedCircle == '45degreesArc') numberOfPointsRequired = 2;
    return numberOfPointsRequired;
  }

  getConstraints(pointNb) {
    if (pointNb == 0) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 1) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 2) {
      if (app.tool.selectedCircle == 'CirclePart') {
        let lines = [
          [
            this.points[1].coordinates,
            this.points[1].coordinates,
            this.points[0].coordinates,
          ],
        ];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      } else if (app.tool.selectedCircle == 'CircleArc') {
        let lines = [
          [
            this.points[1].coordinates,
            this.points[1].coordinates,
            this.points[0].coordinates,
          ],
        ];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      }
    }
  }

  _executeAction() {
    if (app.tool.selectedCircle == 'CirclePart') {
      this.points.push(new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: this.points[0].coordinates,
        type: 'arcCenter',
      }));
    }
    let points = this.points.map(
      pt =>
        new Point({
          drawingEnvironment: app.mainDrawingEnvironment,
          coordinates: new Coordinates(pt.coordinates),
          type: 'vertex',
        })
    );
    let segments = [];

    let idx = 0;
    if (app.tool.selectedCircle == 'Circle') {
      points[0].type = 'arcCenter';
      points[1].idx = 0;
      [points[0], points[1]] = [points[1], points[0]];
      let seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[0].id, points[0].id],
        arcCenterId: points[1].id,
      });
      segments.push(seg);
    } else if (app.tool.selectedCircle == 'CirclePart') {
      let seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[0].id, points[1].id],
      });
      segments.push(seg);
      seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[1].id, points[2].id],
        arcCenterId: points[3].id,
        counterclockwise: !this.clockwise,
      });
      segments.push(seg);
      seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[2].id, points[0].id],
      });
      segments.push(seg);
    } else if (app.tool.selectedCircle == 'CircleArc') {
      [points[0], points[1], points[2]] = [points[1], points[2], points[0]];
      let seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[0].id, points[1].id],
        arcCenterId: points[2].id,
        counterclockwise: !this.clockwise,
      });
      segments.push(seg);
    } else {
      [points[0], points[1], points[2]] = [points[1], points[2], points[0]];
      points[0].type = 'vertex';
      points[0].idx = 0;
      points[1].type = 'vertex';
      points[1].idx = 1;
      points[2].type = 'arcCenter';
      let seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[0].id, points[1].id],
        arcCenterId: points[2].id,
        counterclockwise: false,
      });
      segments.push(seg);
    }

    let constructor = RegularShape;
    if (app.tool.selectedCircle.endsWith('degreesArc'))
      constructor = ArrowLineShape;
    let shape = new constructor({
      drawingEnvironment: app.mainDrawingEnvironment,
      segmentIds: segments.map(seg => seg.id),
      pointIds: points.map(pt => pt.id),
      name: app.tool.selectedCircle,
      familyName: 'circle-shape',
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    segments.forEach((seg, idx) => {
      seg.idx = idx;
      seg.shapeId = shape.id;
    });

    points.forEach((pt, idx) => {
      pt.shapeId = shape.id;
    });

    let ref;
    if (ref = app.mainDrawingEnvironment.points.filter(pt => pt.id != shape.vertexes[0].id).find(pt => pt.coordinates.equal(shape.vertexes[0].coordinates))) {
      if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
        ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      shape.vertexes[0].reference = ref.id;
    }
    // si pas circle-part
    if (ref = app.mainDrawingEnvironment.points.filter(pt => pt.shape.id != shape.id).find(pt => pt.coordinates.equal(shape.segments[0].arcCenter.coordinates))) {
      if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
        ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      shape.segments[0].arcCenter.reference = ref.id;
    }

    // window.dispatchEvent(new CustomEvent('refresh'));
  }
}
