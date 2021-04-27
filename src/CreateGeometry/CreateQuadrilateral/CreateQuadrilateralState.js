import { app } from '../../Core/App';
import { Tool } from '../../Core/States/State';
import { html } from 'lit-element';
import { createElem, uniqId } from '../../Core/Tools/general';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';
import { Point } from '../../Core/Objects/Point';
import { GeometryConstraint } from '../../Core/Objects/GeometryConstraint';
import { Coordinates } from '../../Core/Objects/Coordinates';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateQuadrilateralTool extends Tool {
  constructor() {
    super('createQuadrilateral', 'Créer un quadrilatère', 'geometryCreator');

    // show-quadrilaterals -> select-points
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    // Le tyle de forme que l'on va créer (rectangle, IsoscelesTriangle, RightAngleIsoscelesTriangle, trapèze)
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

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.currentStep = 'show-quadrilaterals';

    if (!this.quadrilateralsList) {
      import('./quadrilaterals-list');
      this.quadrilateralsList = createElem('quadrilaterals-list');
    }
    this.quadrilateralsList.style.display = 'flex';

    window.addEventListener('quadrilateral-selected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    if (this.quadrilateralSelected) {
      this.currentStep = 'select-points';
      window.dispatchEvent(
        new CustomEvent('quadrilateral-selected', {
          detail: { quadrilateralSelected: this.quadrilateralSelected },
        }),
      );
      this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
    } else {
      this.currentStep = 'show-quadrilaterals';
    }
    this.points = [];
    this.numberOfPointsDrawn = 0;
    this.segments = [];
    this.getConstraints(this.numberOfPointsDrawn);

    window.addEventListener('quadrilateral-selected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      if (this.quadrilateralsList) this.quadrilateralsList.remove();
      this.quadrilateralsList = null;
    }
    this.stopAnimation();
    window.removeEventListener('quadrilateral-selected', this.handler);
    app.removeListener('canvasMouseDown', this.mouseDownId);
    app.removeListener('canvasMouseUp', this.mouseUpId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'canvasMouseDown') {
      this.canvasMouseDown();
    } else if (event.type == 'canvasMouseUp') {
      this.canvasMouseUp();
    } else if (event.type == 'quadrilateral-selected') {
      this.setQuadrilateral(event.detail.quadrilateralSelected);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  setQuadrilateral(quadrilateralSelected) {
    if (quadrilateralSelected) {
      this.quadrilateralSelected = quadrilateralSelected;
      if (this.quadrilateralsList)
        this.quadrilateralsList.quadrilateralSelected = quadrilateralSelected;
      this.points = [];
      this.numberOfPointsDrawn = 0;
      this.segments = [];
      this.getConstraints(this.numberOfPointsDrawn);
      this.currentStep = 'select-points';
      this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
    }
  }

  canvasMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    if (this.currentStep == 'select-points') {
      this.points[this.numberOfPointsDrawn] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.get('temporaryDrawColor'),
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
      if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
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
          borderColor: app.settings.get('temporaryDrawColor'),
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
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      }
      app.removeListener('canvasMouseDown', this.mouseDownId);
      this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
      this.animate();
    }
  }

  canvasMouseUp() {
    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      this.stopAnimation();
      this.actions = [
        {
          name: 'CreateQuadrilateralAction',
          coordinates: this.points.map((pt) => pt.coordinates),
          quadrilateralName: this.quadrilateralSelected,
          reference: null, //reference,
        },
      ];
      this.executeAction();
      app.upperDrawingEnvironment.removeAllObjects();
      this.restart();
    } else {
      this.getConstraints(this.numberOfPointsDrawn);
      this.currentStep = '';
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.currentStep = 'select-points';
      this.stopAnimation();
      this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
      app.removeListener('canvasMouseUp', this.mouseUpId);
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
    if (this.currentStep == 'select-points') {
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

  finishShape() {
    if (this.quadrilateralSelected == 'Square') {
      let externalAngle = (Math.PI * 2) / 4;

      let length = this.points[0].coordinates.dist(this.points[1].coordinates);

      let startAngle = this.points[0].coordinates.angleWith(
        this.points[1].coordinates,
      );

      for (let i = 0; i < 2; i++) {
        let dx = length * Math.cos(startAngle - externalAngle * (i + 1));
        let dy = length * Math.sin(startAngle - externalAngle * (i + 1));
        let newCoordinates = this.points[i + 1].coordinates.add(
          new Coordinates({ x: dx, y: dy }),
        );
        if (this.points.length == i + 2) {
          this.points[i + 2] = new Point({
            drawingEnvironment: app.upperDrawingEnvironment,
            coordinates: newCoordinates,
            color: app.settings.get('temporaryDrawColor'),
            size: 2,
          });
        } else {
          this.points[i + 2].coordinates = newCoordinates;
        }
      }
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
          color: app.settings.get('temporaryDrawColor'),
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

  getConstraints(pointNb) {
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
