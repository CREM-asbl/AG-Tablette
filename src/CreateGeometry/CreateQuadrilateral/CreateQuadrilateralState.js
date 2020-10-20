import { app } from '../../Core/App';
import { State } from '../../Core/States/State';
import { html } from 'lit-element';
import { createElem, uniqId } from '../../Core/Tools/general';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';
import { Point } from '../../Core/Objects/Point';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateQuadrilateralState extends State {
  constructor() {
    super('createQuadrilateral', 'Ajouter un quadrilatère', 'geometry_creator');

    // show-quadrilaterals -> select-first-point -> select-second-point -> select-third-point -> select-fourth-point
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // Le tyle de forme que l'on va ajouter (rectangle, losange, parallelogram, rightAngleTrapeze, isoscelesTrapeze, trapeze)
    this.quadrilateralSelected = null;

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
    this.currentStep = 'show-quadrilaterals';

    this.points = [];
    this.shapeId = uniqId();

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
    this.points = [];
    this.shapeId = uniqId();
    if (this.quadrilateralSelected) {
      this.currentStep = 'select-first-point';
      window.dispatchEvent(
        new CustomEvent('quadrilateral-selected', {
          detail: { quadrilateralSelected: this.quadrilateralSelected },
        })
      );
    } else {
      this.currentStep = 'show-quadrilaterals';
    }

    window.addEventListener('quadrilateral-selected', this.handler);
    this.mouseDownId = app.addListener('canvasclick', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      if (this.quadrilateralsList) this.quadrilateralsList.remove();
      this.quadrilateralsList = null;
    }
    window.cancelAnimationFrame(this.requestAnimFrameId);
    window.removeEventListener('quadrilateral-selected', this.handler);
    app.removeListener('canvasclick', this.mouseDownId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'quadrilateral-selected') {
      this.setQuadrilateral(event.detail.quadrilateralSelected);
    } else if (event.type == 'canvasclick') {
      this.onClick();
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  setQuadrilateral(quadrilateralSelected) {
    if (quadrilateralSelected) {
      this.quadrilateralSelected = quadrilateralSelected;
      if (this.quadrilateralsList)
        this.quadrilateralsList.quadrilateralSelected = quadrilateralSelected;
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
    }

    let constraints = SelectManager.getEmptySelectionConstraints().points;
    constraints.canSelect = true;
    let adjustedPoint = SelectManager.selectPoint(newPoint, constraints, false);
    if (adjustedPoint) {
      newPoint = new Point(adjustedPoint);
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
      this.currentStep = 'select-fourth-point';
    } else if (this.currentStep == 'select-fourth-point') {
      this.points[3] = newPoint;
    }

    if (this.canCreateShape()) {
      this.finishShape();
      this.actions = [
        {
          name: 'CreateQuadrilateralAction',
          points: this.points,
          quadrilateralName: this.quadrilateralSelected,
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
      this.quadrilateralSelected == 'Rectangle' &&
      (this.currentStep == 'select-third-point' ||
        this.currentStep == 'select-fourth-point') &&
      this.points.length >= 3
    ) {
      return true;
    } else if (
      this.quadrilateralSelected == 'Losange' &&
      (this.currentStep == 'select-third-point' ||
        this.currentStep == 'select-fourth-point') &&
      this.points.length >= 3
    ) {
      return true;
    } else if (
      this.quadrilateralSelected == 'Parallelogram' &&
      (this.currentStep == 'select-third-point' ||
        this.currentStep == 'select-fourth-point') &&
      this.points.length >= 3
    ) {
      return true;
    } else if (
      this.quadrilateralSelected == 'RightAngleTrapeze' &&
      (this.currentStep == 'select-third-point' ||
        this.currentStep == 'select-fourth-point') &&
      this.points.length >= 3
    ) {
      return true;
    } else if (
      this.quadrilateralSelected == 'IsoscelesTrapeze' &&
      (this.currentStep == 'select-third-point' ||
        this.currentStep == 'select-fourth-point') &&
      this.points.length >= 3
    ) {
      return true;
    } else if (
      this.quadrilateralSelected == 'Trapeze' &&
      this.currentStep == 'select-fourth-point' &&
      this.points.length == 4
    ) {
      return true;
    }
  }

  finishShape() {
    if (this.quadrilateralSelected == 'Rectangle') {
      this.points[3] = new Point(
        this.points[2].x - this.points[1].x + this.points[0].x,
        this.points[2].y - this.points[1].y + this.points[0].y
      );
    } else if (this.quadrilateralSelected == 'Losange') {
      let diagonnalCenter = new Segment(this.points[0], this.points[2]).middle;

      this.points[3] = new Point(
        2 * diagonnalCenter.x - this.points[1].x,
        2 * diagonnalCenter.y - this.points[1].y
      );
    } else if (this.quadrilateralSelected == 'Parallelogram') {
      this.points[3] = new Point(
        this.points[2].x - this.points[1].x + this.points[0].x,
        this.points[2].y - this.points[1].y + this.points[0].y
      );
    } else if (this.quadrilateralSelected == 'RightAngleTrapeze') {
      let initialSegment = new Segment(this.points[0], this.points[1]);
      let projection = initialSegment.projectionOnSegment(this.points[2]);
      this.points[3] = new Point(
        this.points[2].x - projection.x + this.points[0].x,
        this.points[2].y - projection.y + this.points[0].y
      );
    } else if (this.quadrilateralSelected == 'IsoscelesTrapeze') {
      let initialSegment = new Segment(this.points[0], this.points[1]);
      let projection = initialSegment.projectionOnSegment(this.points[2]);
      let middleOfSegment = initialSegment.middle;
      this.points[3] = new Point(
        this.points[2].x - 2 * projection.x + 2 * middleOfSegment.x,
        this.points[2].y - 2 * projection.y + 2 * middleOfSegment.y
      );
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
      if (this.quadrilateralSelected == 'Rectangle') {
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
      } else if (this.quadrilateralSelected == 'Losange') {
        constraints.isConstrained = true;
        let constraintLine = {
          segment: new Segment(
            this.points[0],
            this.points[0],
            null,
            null,
            this.points[1]
          ),
        };
        constraints.lines.push(constraintLine);
      } else if (this.quadrilateralSelected == 'Parallelogram') {
        constraints.isFree = true;
      } else if (this.quadrilateralSelected == 'RightAngleTrapeze') {
        constraints.isFree = true;
      } else if (this.quadrilateralSelected == 'IsoscelesTrapeze') {
        constraints.isFree = true;
      } else if (this.quadrilateralSelected == 'Trapeze') {
        constraints.isFree = true;
      }
    } else if (this.currentStep == 'select-fourth-point') {
      if (this.quadrilateralSelected == 'Trapeze') {
        constraints.isConstrained = true;
        let constraintLine = {
          segment: new Segment(
            this.points[2],
            new Point(
              this.points[2].x - this.points[1].x + this.points[0].x,
              this.points[2].y - this.points[1].y + this.points[0].y
            )
          ),
          isInfinite: true,
        };
        constraints.lines.push(constraintLine);
      } else {
        constraints.isConstructed = true;
      }
    }
    return constraints;
  }

  projectionOnConstraints(point, constraints) {
    let projectionsOnContraints = constraints.lines.map(line => {
      let projection = line.segment.projectionOnSegment(point);
      let dist = projection.dist(point);
      return { projection: projection, dist: dist };
    });
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
    else if (this.currentStep == 'select-fourth-point')
      this.points[3] = constrainedPoint;

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
    }

    if (this.canCreateShape()) {
      this.finishShape();
      let temporaryShape = new Shape({
        segments: [
          new Segment(this.points[0], this.points[1]),
          new Segment(this.points[1], this.points[2]),
          new Segment(this.points[2], this.points[3]),
          new Segment(this.points[3], this.points[0]),
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
