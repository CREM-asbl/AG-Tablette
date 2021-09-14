import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem, uniqId } from '../Core/Tools/general';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateQuadrilateralTool extends Tool {
  constructor() {
    super('createQuadrilateral', 'Dessiner un quadrilatère', 'geometryCreator');

    // show-quadrilaterals -> select-points
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    // Le tyle de figure que l'on va créer (rectangle, IsoscelesTriangle, RightAngleIsoscelesTriangle, trapèze)
    this.quadrilateralSelected = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  start() {
    this.removeListeners();
    this.stopAnimation();

    import('./quadrilaterals-list');
    createElem('quadrilaterals-list');
  }

  async drawFirstPoint() {
    let quadrilateralsDef = await import(`./quadrilateralsDef.js`);
    this.quadrilateralDef = quadrilateralsDef[app.tool.selectedQuadrilateral];
    console.log(this.quadrilateralDef);

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

    this.points[this.numberOfPointsDrawn] = new Point({
      drawingEnvironment: app.upperDrawingEnvironment,
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });
    this.numberOfPointsDrawn++;
    if (this.numberOfPointsDrawn > 1) {
      let seg = new Segment({
        drawingEnvironment: app.upperDrawingEnvironment,
        vertexIds: [
          this.points[this.numberOfPointsDrawn - 2].id,
          this.points[this.numberOfPointsDrawn - 1].id,
        ],
      });
      this.segments.push(seg);
    }
    console.log('there', this.numberOfPointsDrawn, this.numberOfPointsRequired());
    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      console.log('here', this.numberOfPointsDrawn);
      if (this.numberOfPointsDrawn < 4) this.finishShape();
      let seg = new Segment({
        drawingEnvironment: app.upperDrawingEnvironment,
        vertexIds: [this.points[3].id, this.points[0].id],
      });
      this.segments.push(seg);
      let shape = new Shape({
        drawingEnvironment: app.upperDrawingEnvironment,
        segmentIds: this.segments.map((seg) => seg.id),
        pointIds: this.points.map((pt) => pt.id),
        borderColor: app.settings.temporaryDrawColor,
      });
      this.segments.forEach((seg, idx) => {
        seg.idx = idx;
        seg.shapeId = shape.id;
      });
    } else if (this.numberOfPointsDrawn > 1) {
      new Shape({
        drawingEnvironment: app.upperDrawingEnvironment,
        segmentIds: [this.segments[this.numberOfPointsDrawn - 2].id],
        pointIds: this.segments[this.numberOfPointsDrawn - 2].vertexIds,
        borderColor: app.settings.temporaryDrawColor,
      });
    }
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' } });
  }

  canvasMouseUp() {
    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      this.stopAnimation();
      this.executeAction();
      app.upperDrawingEnvironment.removeAllObjects();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' } });
    } else {
      this.getConstraints(this.numberOfPointsDrawn);
      // window.dispatchEvent(new CustomEvent('refreshUpper'));
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
    }
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
        point.coordinates = new Coordinates(adjustedCoordinates);
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
      if (
        this.numberOfPointsDrawn == this.numberOfPointsRequired() &&
        this.numberOfPointsDrawn < 4
      ) {
        this.finishShape();
      }
    }
  }

  numberOfPointsRequired() {
    console.log(this.quadrilateralDef.numberOfPointsRequired);
    return this.quadrilateralDef.numberOfPointsRequired;
  }

  finishShape() {
    console.log('here');
    this.quadrilateralDef.finishShape(this.points, this.segments);
  }

  getConstraints(pointNb) {
    this.constraints = this.quadrilateralDef.constraints[pointNb](this.points, this.segments);
  }

  _executeAction() {
    let familyName = '4-corner-shape';
    if (app.tool.selectedTriangle == 'Square') {
      familyName = 'Regular';
    } else if (app.tool.selectedTriangle == 'IrregularQuadrilateral') {
      familyName = 'Irregular';
    }

    let path = ['M', this.points[0].coordinates.x, this.points[0].coordinates.y];
    path.push('L', this.points[1].coordinates.x, this.points[1].coordinates.y);
    path.push('L', this.points[2].coordinates.x, this.points[2].coordinates.y);
    path.push('L', this.points[3].coordinates.x, this.points[3].coordinates.y);
    path.push('L', this.points[0].coordinates.x, this.points[0].coordinates.y);
    path = path.join(' ');

    let shape = new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: path,
      name: app.tool.selectedTriangle,
      familyName: familyName,
    });

    shape.points[0].name = 'firstPoint';
    shape.points[1].name = 'secondPoint';
    shape.points[2].name = 'thirdPoint';
    shape.points[3].name = 'fourthPoint';
    // window.dispatchEvent(new CustomEvent('refresh'));
  }

  numberOfPointsRequired2() {
    let numberOfPointsRequired = 0;
    if (this.quadrilateralSelected == 'Square') numberOfPointsRequired = 2;
    else if (this.quadrilateralSelected == 'Rectangle')
      numberOfPointsRequired = 3;
    else if (this.quadrilateralSelected == 'Losange')
      numberOfPointsRequired = 3;
    else if (this.quadrilateralSelected == 'Parallelogram')
      numberOfPointsRequired = 3;
    else if (this.quadrilateralSelected == 'RightAngleTrapeze')
      numberOfPointsRequired = 3;
    else if (this.quadrilateralSelected == 'IsoscelesTrapeze')
      numberOfPointsRequired = 3;
    else if (this.quadrilateralSelected == 'Trapeze')
      numberOfPointsRequired = 4;
    else if (this.quadrilateralSelected == 'IrregularQuadrilateral')
      numberOfPointsRequired = 4;
    return numberOfPointsRequired;
  }

  finishShape2() {
    if (this.quadrilateralSelected == 'Square') {

    } else if (this.numberOfPointsRequired() < 4) {
      let newCoordinates = Coordinates.nullCoordinates;
      if (
        this.quadrilateralSelected == 'Rectangle' ||
        this.quadrilateralSelected == 'Parallelogram'
      ) {
        newCoordinates = this.points[2].coordinates
          .substract(this.points[1].coordinates)
          .add(this.points[0].coordinates);
      } else if (this.quadrilateralSelected == 'Losange') {
        let diagonnalCenter = this.points[0].coordinates.middleWith(
          this.points[2].coordinates,
        );
        newCoordinates = diagonnalCenter
          .multiply(2)
          .substract(this.points[1].coordinates);
      } else if (this.quadrilateralSelected == 'RightAngleTrapeze') {
        let projection = this.segments[0].projectionOnSegment(
          this.points[2].coordinates,
        );
        newCoordinates = this.points[2].coordinates
          .substract(projection)
          .add(this.points[0].coordinates);
      } else if (this.quadrilateralSelected == 'IsoscelesTrapeze') {
        let projection = this.segments[0].projectionOnSegment(
          this.points[2].coordinates,
        );
        let middleOfSegment = this.segments[0].middle;
        newCoordinates = this.points[2].coordinates
          .substract(projection.multiply(2))
          .add(middleOfSegment.multiply(2));
      }
      if (this.points.length == 3) {
        this.points[3] = new Point({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: newCoordinates,
          color: app.settings.temporaryDrawColor,
          size: 2,
        });
      } else {
        this.points[3].coordinates = newCoordinates;
      }
    }

    if (this.segments.length < 4) {
      if (this.numberOfPointsRequired() < 3)
        this.segments.push(
          new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[1].id, this.points[2].id],
          }),
        );
      if (this.numberOfPointsRequired() < 4)
        this.segments.push(
          new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[2].id, this.points[3].id],
          }),
        );
    }
  }

  getConstraints2(pointNb) {
    if (pointNb == 0) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 1) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 2) {
      if (this.quadrilateralSelected == 'Rectangle') {
        let angle = this.points[0].coordinates.angleWith(
          this.points[1].coordinates,
        );
        let perpendicularAngle = angle + Math.PI / 2;
        let lines = [
          [
            this.points[1].coordinates,
            new Coordinates({
              x: this.points[1].x + Math.cos(perpendicularAngle) * 100,
              y: this.points[1].y + Math.sin(perpendicularAngle) * 100,
            }),
          ],
        ];
        this.constraints = new GeometryConstraint('isContrained', lines);
      } else if (this.quadrilateralSelected == 'Losange') {
        let lines = [
          [
            this.points[0].coordinates,
            this.points[0].coordinates,
            this.points[1].coordinates,
          ],
        ];
        this.constraints = new GeometryConstraint('isContrained', lines);
      } else {
        this.constraints = new GeometryConstraint('isFree');
      }
    } else if (pointNb == 3) {
      if (this.quadrilateralSelected == 'Trapeze') {
        let lines = [
          [
            this.points[2].coordinates,
            this.points[2].coordinates
              .substract(this.points[1].coordinates)
              .add(this.points[0].coordinates),
          ],
        ];
        this.constraints = new GeometryConstraint('isContrained', lines);
      } else {
        this.constraints = new GeometryConstraint('isFree');
      }
    }
  }
}
