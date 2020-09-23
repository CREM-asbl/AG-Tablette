import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { uniqId } from '../Core/Tools/general';
import { SelectManager } from '../Core/Managers/SelectManager';

/**
 * Ajout de formes sur l'espace de travail
 */
export class RightAngleTriangleState extends State {
  constructor() {
    super(
      'create_right_angle_triangle',
      'Créer un triangle rectangle',
      'geometry_creator'
    );

    // listen-canvas-click -> select-second-point -> select-third-point
    this.currentStep = null;

    // first point of the shape to create
    this.firstPoint = null;

    // second point of the shape to create
    this.secondPoint = null;

    // second point of the shape to create
    this.thirdPoint = null;

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
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br /></p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';

    this.firstPoint = null;
    this.secondPoint = null;
    this.thirdPoint = null;
    this.shapeId = uniqId();

    this.mouseClickId = app.addListener('canvasclick', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();

    this.firstPoint = null;
    this.secondPoint = null;
    this.thirdPoint = null;
    this.shapeId = uniqId();

    this.currentStep = 'listen-canvas-click';

    this.mouseClickId = app.addListener('canvasclick', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    window.cancelAnimationFrame(this.requestAnimFrameId);

    app.removeListener('canvasclick', this.mouseClickId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'canvasclick') {
      this.onClick();
    } else if (event.type == 'setNumberOfPoints') {
      this.setNumberOfPoints(event.detail.nbOfPoints);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  onClick() {
    let newPoint = new Point(app.workspace.lastKnownMouseCoordinates);

    let constraints = SelectManager.getEmptySelectionConstraints().points;
    constraints.canSelect = true;
    let adjustedPoint = SelectManager.selectPoint(newPoint, constraints, false);
    if (adjustedPoint) {
      newPoint = new Point(adjustedPoint);
    }

    if (this.currentStep == 'listen-canvas-click') {
      this.firstPoint = newPoint;
      this.currentStep = 'select-second-point';
      this.animate();
    } else if (this.currentStep == 'select-second-point') {
      this.secondPoint = newPoint;
      this.currentStep = 'select-third-point';
    } else {
      // select-third-point
      this.thirdPoint = this.projectionOnLine(newPoint).projection;

      this.actions = [
        {
          name: 'RightAngleTriangleAction',
          firstPoint: this.firstPoint,
          secondPoint: this.secondPoint,
          thirdPoint: this.thirdPoint,
          shapeId: this.shapeId,
        },
      ];
      this.executeAction();
      this.restart();
      window.dispatchEvent(new CustomEvent('refresh'));
    }

    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  draw() {
    if (this.currentStep == 'select-second-point') {
      window.dispatchEvent(
        new CustomEvent('draw-segment', {
          detail: {
            segment: new Segment(
              this.firstPoint,
              app.workspace.lastKnownMouseCoordinates
            ),
          },
        })
      );
    } else if (this.currentStep == 'select-third-point') {
      this.constraints = this.getThirdPointContraints();

      this.constraints.lines.forEach(line => {
        window.dispatchEvent(
          new CustomEvent(line.isInfinite ? 'draw-line' : 'draw-segment', {
            detail: { segment: line.segment, color: '#080' },
          })
        );
      });

      this.thirdPoint = this.projectionOnLine(
        app.workspace.lastKnownMouseCoordinates
      ).projection;

      let shape = new Shape({
        segments: [
          new Segment(this.firstPoint, this.secondPoint),
          new Segment(this.secondPoint, this.thirdPoint),
          new Segment(this.thirdPoint, this.firstPoint),
        ],
      });

      window.dispatchEvent(
        new CustomEvent('draw-shape', { detail: { shape: shape } })
      );
    }
  }

  getThirdPointContraints() {
    let constraints = {
      isConstrained: true,
      lines: [],
    };
    let segment = new Segment(this.firstPoint, this.secondPoint);
    let angle = segment.getAngleWithHorizontal();
    let perpendicularAngle = angle + Math.PI / 2;
    let perpendicularLine1 = {
      segment: new Segment(
        this.firstPoint,
        new Point(
          this.firstPoint.x + Math.cos(perpendicularAngle) * 100,
          this.firstPoint.y + Math.sin(perpendicularAngle) * 100
        )
      ),
      isInfinite: true,
    };
    let perpendicularLine2 = {
      segment: new Segment(
        this.secondPoint,
        new Point(
          this.secondPoint.x + Math.cos(perpendicularAngle) * 100,
          this.secondPoint.y + Math.sin(perpendicularAngle) * 100
        )
      ),
      isInfinite: true,
    };
    let circle = {
      segment: new Segment(
        this.firstPoint,
        this.firstPoint,
        null,
        0,
        segment.middle
      ),
    };
    constraints.lines.push(perpendicularLine1, perpendicularLine2, circle);
    return constraints;
  }

  projectionOnLine(point) {
    let projectionsOnContraints = this.constraints.lines.map(line => {
      console.log(line.segment);
      let projection = line.segment.projectionOnSegment(point);
      let dist = projection.dist(point);
      return { projection: projection, dist: dist, line: line };
    });
    projectionsOnContraints.sort((p1, p2) => (p1.dist > p2.dist ? 1 : -1));
    return projectionsOnContraints[0];
  }
}
