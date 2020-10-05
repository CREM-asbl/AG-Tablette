import { app } from '../../Core/App';
import { State } from '../../Core/States/State';
import { html } from 'lit-element';
import { createElem, uniqId } from '../../Core/Tools/general';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';
import { Point } from '../../Core/Objects/Point';
import './triangles-list';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateTriangleState extends State {
  constructor() {
    super('create_triangle', 'Ajouter un triangle', 'geometry_creator');

    // show-triangles -> select-first-point -> select-second-point -> select-third-point
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // Le tyle de forme que l'on va ajouter (rectangle, IsoscelesTriangle, RightAngleIsoscelesTriangle, trapèze)
    this.triangleSelected = null;

    // id of the shape to create
    this.shapeId = null;
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

    this.points = [];
    this.shapeId = uniqId();

    if (!this.trianglesList) this.trianglesList = createElem('triangles-list');
    this.trianglesList.style.display = 'flex';

    window.addEventListener('triangle-selected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.points = [];
    this.shapeId = uniqId();
    if (this.triangleSelected) {
      this.currentStep = 'select-first-point';
      window.dispatchEvent(
        new CustomEvent('triangle-selected', {
          detail: { triangleSelected: this.triangleSelected },
        })
      );
    } else {
      this.currentStep = 'show-triangles';
    }

    window.addEventListener('triangle-selected', this.handler);
    this.mouseDownId = app.addListener('canvasclick', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      if (this.trianglesList) this.trianglesList.remove();
      this.trianglesList = null;
    }
    window.cancelAnimationFrame(this.requestAnimFrameId);
    window.removeEventListener('triangle-selected', this.handler);
    app.removeListener('canvasclick', this.mouseDownId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'triangle-selected') {
      this.setTriangle(event.detail.triangleSelected);
    } else if (event.type == 'canvasclick') {
      this.onClick();
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  setTriangle(triangleSelected) {
    if (triangleSelected) {
      this.triangleSelected = triangleSelected;
      if (this.trianglesList)
        this.trianglesList.triangleSelected = triangleSelected;
      this.currentStep = 'select-first-point';
      this.mouseDownId = app.addListener('canvasclick', this.handler);
    }
  }

  onClick() {
    let newPoint = new Point(app.workspace.lastKnownMouseCoordinates);

    this.constraints = this.getConstraints();
    if (this.constraints.isConstrained) {
      newPoint = this.projectionOnConstraints(
        app.workspace.lastKnownMouseCoordinates,
        this.constraints
      );
    } else {
      let constraints = SelectManager.getEmptySelectionConstraints().points;
      constraints.canSelect = true;
      let adjustedPoint = SelectManager.selectPoint(
        newPoint,
        constraints,
        false
      );
      if (adjustedPoint) {
        newPoint = new Point(adjustedPoint);
      }
    }

    if (this.currentStep == 'select-first-point') {
      this.points[0] = newPoint;
      this.currentStep = 'select-second-point';
      this.animate();
    } else if (this.currentStep == 'select-second-point') {
      this.points[1] = newPoint;
      this.currentStep = 'select-third-point';
    } else if (this.currentStep == 'select-third-point') {
      this.points[2] = newPoint;
    }

    if (this.canCreateShape()) {
      this.actions = [
        {
          name: 'CreateTriangleAction',
          points: this.points,
          triangleName: this.triangleSelected,
          shapeId: this.shapeId,
        },
      ];
      this.executeAction();
      this.restart();
      window.dispatchEvent(new CustomEvent('refresh'));
    }

    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  canCreateShape() {
    if (
      this.triangleSelected == 'RightAngleTriangle' &&
      (this.currentStep == 'select-second-point' ||
        this.currentStep == 'select-third-point') &&
      this.points.length > 2
    ) {
      return true;
    } else if (
      this.triangleSelected == 'IsoscelesTriangle' &&
      (this.currentStep == 'select-second-point' ||
        this.currentStep == 'select-third-point') &&
      this.points.length > 2
    ) {
      return true;
    } else if (
      this.triangleSelected == 'RightAngleIsoscelesTriangle' &&
      (this.currentStep == 'select-second-point' ||
        this.currentStep == 'select-third-point') &&
      this.points.length > 2
    ) {
      return true;
    }
  }

  getConstraints() {
    let constraints = {
      isFree: false,
      isConstrained: false,
      isBlocked: false,
      isConstructed: false,
      lines: [],
      points: [],
    };
    if (this.currentStep == 'select-first-point') {
      constraints.isFree = true;
    } else if (this.currentStep == 'select-second-point') {
      constraints.isFree = true;
    } else if (this.currentStep == 'select-third-point') {
      if (this.triangleSelected == 'RightAngleTriangle') {
        constraints.isConstrained = true;
        let segment = new Segment(this.points[0], this.points[1]);
        let angle = segment.getAngleWithHorizontal();
        let perpendicularAngle = angle + Math.PI / 2;
        let perpendicularLine = {
          segment: new Segment(
            this.points[1],
            new Point(
              this.points[1].x + Math.cos(perpendicularAngle) * 100,
              this.points[1].y + Math.sin(perpendicularAngle) * 100
            )
          ),
          isInfinite: true,
        };
        constraints.lines.push(perpendicularLine);
      } else if (this.triangleSelected == 'IsoscelesTriangle') {
        constraints.isConstrained = true;
        let segment = new Segment(this.points[0], this.points[1]);
        let middleOfSegment = segment.middle;
        let angle = segment.getAngleWithHorizontal();
        let perpendicularAngle = angle + Math.PI / 2;
        let perpendicularLine = {
          segment: new Segment(
            middleOfSegment,
            new Point(
              middleOfSegment.x + Math.cos(perpendicularAngle) * 100,
              middleOfSegment.y + Math.sin(perpendicularAngle) * 100
            )
          ),
          isInfinite: true,
        };
        constraints.lines.push(perpendicularLine);
      } else if (this.triangleSelected == 'RightAngleIsoscelesTriangle') {
        constraints.isConstrained = true;
        let segment = new Segment(this.points[0], this.points[1]);
        let segmentLength = segment.length;
        let angle = segment.getAngleWithHorizontal();
        let perpendicularAngle = angle + Math.PI / 2;
        let firstPoint = new Point(
          this.points[1].x + Math.cos(perpendicularAngle) * segmentLength,
          this.points[1].y + Math.sin(perpendicularAngle) * segmentLength
        );
        let secondPoint = new Point(
          this.points[1].x - Math.cos(perpendicularAngle) * segmentLength,
          this.points[1].y - Math.sin(perpendicularAngle) * segmentLength
        );
        constraints.points.push(firstPoint);
        constraints.points.push(secondPoint);
      }
    }
    return constraints;
  }

  projectionOnConstraints(point, constraints) {
    let projectionsOnContraints = constraints.lines
      .map(line => {
        let projection = line.segment.projectionOnSegment(point);
        let dist = projection.dist(point);
        return { projection: projection, dist: dist };
      })
      .concat(
        constraints.points.map(pt => {
          let dist = pt.dist(point);
          return { projection: pt, dist: dist };
        })
      );
    projectionsOnContraints.sort((p1, p2) => (p1.dist > p2.dist ? 1 : -1));
    return projectionsOnContraints[0].projection;
  }

  draw() {
    this.constraints = this.getConstraints();
    let constrainedPoint = app.workspace.lastKnownMouseCoordinates;
    if (this.constraints.isConstrained) {
      constrainedPoint = this.projectionOnConstraints(
        app.workspace.lastKnownMouseCoordinates,
        this.constraints
      );
    }

    if (this.currentStep == 'select-second-point')
      this.points[1] = constrainedPoint;
    else if (this.currentStep == 'select-third-point')
      this.points[2] = constrainedPoint;

    if (this.constraints.isConstrained) {
      this.constraints.lines.forEach(ln => {
        window.dispatchEvent(
          new CustomEvent(ln.isInfinite ? 'draw-line' : 'draw-segment', {
            detail: {
              segment: ln.segment,
              color: app.settings.get('constraintsDrawColor'),
              size: 1,
            },
          })
        );
      });
      this.constraints.points.forEach(pt => {
        window.dispatchEvent(
          new CustomEvent('draw-point', {
            detail: {
              point: pt,
              color: app.settings.get('constraintsDrawColor'),
              size: 2,
            },
          })
        );
      });
    }

    if (this.canCreateShape()) {
      let temporaryShape = new Shape({
        segments: [
          new Segment(this.points[0], this.points[1]),
          new Segment(this.points[1], this.points[2]),
          new Segment(this.points[2], this.points[0]),
        ],
        borderColor: app.settings.get('temporaryDrawColor'),
      });
      window.dispatchEvent(
        new CustomEvent('draw-shape', {
          detail: { shape: temporaryShape, borderSize: 2 },
        })
      );
    } else {
      for (let i = 1; i < this.points.length; i++) {
        window.dispatchEvent(
          new CustomEvent('draw-segment', {
            detail: {
              segment: new Segment(this.points[i - 1], this.points[i]),
              color: app.settings.get('temporaryDrawColor'),
              size: 2,
            },
          })
        );
      }
    }

    this.points.forEach(pt => {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: {
            point: pt,
            color: app.settings.get('temporaryDrawColor'),
            size: 2,
          },
        })
      );
    });
  }
}
