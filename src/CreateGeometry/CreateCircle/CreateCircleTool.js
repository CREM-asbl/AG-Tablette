import { app } from '../../Core/App';
import { Tool } from '../../Core/States/Tool';
import { html } from 'lit';
import { createElem, uniqId } from '../../Core/Tools/general';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';
import { Point } from '../../Core/Objects/Point';
import { GeometryConstraint } from '../../Core/Objects/GeometryConstraint';
import { Coordinates } from '../../Core/Objects/Coordinates';
import { isAngleBetweenTwoAngles } from '../../Core/Tools/geometry';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateCircleTool extends Tool {
  constructor() {
    super('createCircle', 'Créer un cercle', 'geometryCreator');

    // show-quadrilaterals -> select-points -> select-direction
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    this.clockwise = undefined;

    // Le tyle de figure que l'on va créer (circle, circlePart, circleArc)
    this.circleSelected = null;
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
    this.currentStep = 'show-circles';

    if (!this.circlesList) {
      import('./circles-list');
      this.circlesList = createElem('circles-list');
    }
    this.circlesList.style.display = 'flex';

    window.addEventListener('circle-selected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();

    if (this.circleSelected) {
      this.currentStep = 'select-points';
      window.dispatchEvent(
        new CustomEvent('circle-selected', {
          detail: { circleSelected: this.circleSelected },
        }),
      );
      this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
    } else {
      this.currentStep = 'show-circles';
    }
    this.points = [];
    this.numberOfPointsDrawn = 0;
    this.segments = [];
    this.clockwise = undefined;
    this.getConstraints(this.numberOfPointsDrawn);

    window.addEventListener('circle-selected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      if (this.circlesList) this.circlesList.remove();
      this.circlesList = null;
    }
    this.stopAnimation();
    window.removeEventListener('circle-selected', this.handler);
    app.removeListener('canvasclick', this.mouseClickId);
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
    } else if (event.type == 'canvasclick') {
      this.onClick();
    } else if (event.type == 'circle-selected') {
      this.setCircle(event.detail.circleSelected);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  setCircle(circleSelected) {
    if (circleSelected) {
      this.circleSelected = circleSelected;
      if (this.circlesList) this.circlesList.circleSelected = circleSelected;
      this.points = [];
      this.numberOfPointsDrawn = 0;
      this.segments = [];
      this.clockwise = undefined;
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
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
      this.numberOfPointsDrawn++;
      if (this.numberOfPointsDrawn == 2) {
        if (this.circleSelected == 'Circle') {
          let seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[1].id, this.points[1].id],
            arcCenterId: this.points[0].id,
          });
          this.segments.push(seg);
          new Shape({
            drawingEnvironment: app.upperDrawingEnvironment,
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            borderColor: app.settings.temporaryDrawColor,
          });
        } else if (this.circleSelected == 'CirclePart') {
          let seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[0].id, this.points[1].id],
          });
          this.segments.push(seg);
          new Shape({
            drawingEnvironment: app.upperDrawingEnvironment,
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            borderColor: app.settings.temporaryDrawColor,
          });
        }
      } else if (this.numberOfPointsDrawn == 3) {
        if (
          this.circleSelected == 'CirclePart' ||
          this.circleSelected == 'CircleArc'
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
        if (this.circleSelected == 'CirclePart') {
          let seg = new Segment({
            drawingEnvironment: app.upperDrawingEnvironment,
            vertexIds: [this.points[2].id, this.points[0].id],
          });
          this.segments.push(seg);
        }
        new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          segmentIds: this.segments.map((seg) => seg.id),
          pointIds: this.points.map((pt) => pt.id),
          borderColor: app.settings.temporaryDrawColor,
          opacity: this.circleSelected == 'CirclePart' ? 0.7 : 0,
        });
      }
      app.removeListener('canvasMouseDown', this.mouseDownId);
      this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
      this.animate();
    }
  }

  canvasMouseUp() {
    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      if (
        this.circleSelected == 'CirclePart' ||
        this.circleSelected == 'CircleArc'
      ) {
        this.stopAnimation();
        this.showArrow();
        app.removeListener('canvasMouseUp', this.mouseUpId);
        window.setTimeout(
          () =>
            (this.mouseClickId = app.addListener('canvasclick', this.handler)),
        );
        return;
      }
      this.stopAnimation();
      this.actions = [
        {
          name: 'CreateCircleAction',
          coordinates: this.points.map((pt) => pt.coordinates),
          circleName: this.circleSelected,
          clockwise: this.clockwise,
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

  showArrow() {
    this.currentStep = 'select-direction';
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  onClick() {
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
    this.stopAnimation();
    this.actions = [
      {
        name: 'CreateCircleAction',
        coordinates: this.points.map((pt) => pt.coordinates),
        circleName: this.circleSelected,
        clockwise: this.clockwise,
        reference: null, //reference,
      },
    ];
    this.executeAction();
    app.upperDrawingEnvironment.removeAllObjects();
    this.restart();
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
    }
  }

  numberOfPointsRequired() {
    let numberOfPointsRequired = 0;
    if (this.circleSelected == 'Circle') numberOfPointsRequired = 2;
    else if (this.circleSelected == 'CirclePart') numberOfPointsRequired = 3;
    else if (this.circleSelected == 'CircleArc') numberOfPointsRequired = 3;
    return numberOfPointsRequired;
  }

  getConstraints(pointNb) {
    if (pointNb == 0) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 1) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 2) {
      if (this.circleSelected == 'CirclePart') {
        let lines = [
          [
            this.points[1].coordinates,
            this.points[1].coordinates,
            this.points[0].coordinates,
          ],
        ];
        this.constraints = new GeometryConstraint('isContrained', lines);
      } else if (this.circleSelected == 'CircleArc') {
        let lines = [
          [
            this.points[1].coordinates,
            this.points[1].coordinates,
            this.points[0].coordinates,
          ],
        ];
        this.constraints = new GeometryConstraint('isContrained', lines);
      }
    }
  }
}
