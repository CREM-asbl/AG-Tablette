import { app } from '../../Core/App';
import { Tool } from '../../Core/States/Tool';
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
export class CreateTriangleTool extends Tool {
  constructor() {
    super('createTriangle', 'Créer un triangle', 'geometryCreator');

    // show-triangles -> select-points
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    // Le tyle de forme que l'on va créer (rectangle, IsoscelesTriangle, RightAngleIsoscelesTriangle, trapèze)
    this.triangleSelected = null;
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
    this.currentStep = 'show-triangles';

    if (!this.trianglesList) {
      import('./triangles-list');
      this.trianglesList = createElem('triangles-list');
    }
    this.trianglesList.style.display = 'flex';

    window.addEventListener('triangle-selected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.points = [];
    this.numberOfPointsDrawn = 0;
    this.segments = [];
    this.getConstraints(this.numberOfPointsDrawn);

    if (this.triangleSelected) {
      this.currentStep = 'select-points';
      window.dispatchEvent(
        new CustomEvent('triangle-selected', {
          detail: { triangleSelected: this.triangleSelected },
        }),
      );
      this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
    } else {
      this.currentStep = 'show-triangles';
    }

    window.addEventListener('triangle-selected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      if (this.trianglesList) this.trianglesList.remove();
      this.trianglesList = null;
    }
    this.stopAnimation();
    window.removeEventListener('triangle-selected', this.handler);
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
    } else if (event.type == 'triangle-selected') {
      this.setTriangle(event.detail.triangleSelected);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  setTriangle(triangleSelected) {
    if (triangleSelected) {
      this.triangleSelected = triangleSelected;
      if (this.trianglesList)
        this.trianglesList.triangleSelected = triangleSelected;
      this.currentStep = 'select-points';
      this.points = [];
      this.numberOfPointsDrawn = 0;
      this.segments = [];
      this.getConstraints(this.numberOfPointsDrawn);
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
      if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
        if (this.numberOfPointsDrawn < 3) this.finishShape();
        let seg = new Segment({
          drawingEnvironment: app.upperDrawingEnvironment,
          vertexIds: [this.points[2].id, this.points[0].id],
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
          segmentIds: [this.segments[0].id],
          pointIds: this.segments[0].vertexIds,
          borderColor: app.settings.temporaryDrawColor,
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
          name: 'CreateTriangleAction',
          coordinates: this.points.map((pt) => pt.coordinates),
          triangleName: this.triangleSelected,
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
        this.numberOfPointsDrawn < 3
      ) {
        this.finishShape();
      }
    }
  }

  numberOfPointsRequired() {
    let numberOfPointsRequired = 0;
    if (this.triangleSelected == 'EquilateralTriangle')
      numberOfPointsRequired = 2;
    else if (this.triangleSelected == 'RightAngleTriangle')
      numberOfPointsRequired = 3;
    else if (this.triangleSelected == 'IsoscelesTriangle')
      numberOfPointsRequired = 3;
    else if (this.triangleSelected == 'RightAngleIsoscelesTriangle')
      numberOfPointsRequired = 3;
    else if (this.triangleSelected == 'IrregularTriangle')
      numberOfPointsRequired = 3;
    return numberOfPointsRequired;
  }

  finishShape() {
    if (this.triangleSelected == 'EquilateralTriangle') {
      let externalAngle = (Math.PI * 2) / 3;

      let length = this.points[0].coordinates.dist(this.points[1].coordinates);

      let startAngle = this.points[0].coordinates.angleWith(
        this.points[1].coordinates,
      );

      let dx = length * Math.cos(startAngle - externalAngle);
      let dy = length * Math.sin(startAngle - externalAngle);

      let newCoordinates = this.points[1].coordinates.add(
        new Coordinates({ x: dx, y: dy }),
      );

      if (this.points.length == 2) {
        this.points[2] = new Point({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: newCoordinates,
          color: app.settings.temporaryDrawColor,
          size: 2,
        });
      } else {
        this.points[2].coordinates = newCoordinates;
      }

      if (this.segments.length == 1) {
        this.segments.push(
          new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[1].id, this.points[2].id],
          }),
        );
      }
    }
  }

  getConstraints(pointNb) {
    if (pointNb == 0) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 1) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 2) {
      if (this.triangleSelected == 'RightAngleTriangle') {
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
      } else if (this.triangleSelected == 'IsoscelesTriangle') {
        let angle = this.points[0].coordinates.angleWith(
          this.points[1].coordinates,
        );
        let middle = this.points[0].coordinates.middleWith(
          this.points[1].coordinates,
        );
        let perpendicularAngle = angle + Math.PI / 2;
        let lines = [
          [
            middle,
            new Coordinates({
              x: middle.x + Math.cos(perpendicularAngle) * 100,
              y: middle.y + Math.sin(perpendicularAngle) * 100,
            }),
          ],
        ];
        this.constraints = new GeometryConstraint('isContrained', lines);
      } else if (this.triangleSelected == 'RightAngleIsoscelesTriangle') {
        let angle = this.points[0].coordinates.angleWith(
          this.points[1].coordinates,
        );
        let length = this.points[0].coordinates.dist(
          this.points[1].coordinates,
        );
        let perpendicularAngle = angle + Math.PI / 2;
        let points = [
          this.points[1].coordinates.add(
            new Coordinates({
              x: Math.cos(perpendicularAngle) * length,
              y: Math.sin(perpendicularAngle) * length,
            }),
          ),
          this.points[1].coordinates.substract(
            new Coordinates({
              x: Math.cos(perpendicularAngle) * length,
              y: Math.sin(perpendicularAngle) * length,
            }),
          ),
        ];
        this.constraints = new GeometryConstraint('isContrained', [], points);
      } else if (this.triangleSelected == 'IrregularTriangle') {
        new GeometryConstraint('isFree');
      }
    }
  }
}
