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
export class RectangleState extends State {
  constructor() {
    super('create_rectangle', 'Créer un rectangle', 'geometry_creator');

    // listen-canvas-click -> select-second-point -> select-third-point
    this.currentStep = null;

    // first point of the shape to create
    this.firstPoint = null;

    // second point of the shape to create
    this.secondPoint = null;

    // third point of the shape to create
    this.thirdPoint = null;

    // fourth point of the shape to create (computed)
    this.fourthPoint = null;

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
    this.fourthPoint = null;
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
    this.fourthPoint = null;
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
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  onClick() {
    let newPoint = new Point(app.workspace.lastKnownMouseCoordinates);

    if (this.currentStep == 'select-third-point') {
      newPoint = this.projectionOnLine(newPoint).projection;
    }

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
      this.thirdPoint = newPoint;

      this.actions = [
        {
          name: 'RectangleAction',
          firstPoint: this.firstPoint,
          secondPoint: this.secondPoint,
          thirdPoint: this.thirdPoint,
          fourthPoint: this.fourthPoint,
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
            color: app.settings.get('temporaryDrawColor'),
            size: 2,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: {
            point: app.workspace.lastKnownMouseCoordinates,
            color: app.settings.get('temporaryDrawColor'),
            size: 2,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: {
            point: this.firstPoint,
            color: app.settings.get('temporaryDrawColor'),
            size: 2,
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

      this.fourthPoint = new Point(
        this.thirdPoint.x - this.secondPoint.x + this.firstPoint.x,
        this.thirdPoint.y - this.secondPoint.y + this.firstPoint.y
      );

      let shape = new Shape({
        segments: [
          new Segment(this.firstPoint, this.secondPoint),
          new Segment(this.secondPoint, this.thirdPoint),
          new Segment(this.thirdPoint, this.fourthPoint),
          new Segment(this.fourthPoint, this.firstPoint),
        ],
        borderColor: app.settings.get('temporaryDrawColor'),
      });

      window.dispatchEvent(
        new CustomEvent('draw-shape', {
          detail: { shape: shape, borderSize: 2 },
        })
      );

      [
        this.firstPoint,
        this.secondPoint,
        this.thirdPoint,
        this.fourthPoint,
      ].forEach(pt => {
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

  getThirdPointContraints() {
    let constraints = {
      isConstrained: true,
      lines: [],
    };
    let segment = new Segment(this.firstPoint, this.secondPoint);
    let angle = segment.getAngleWithHorizontal();
    let perpendicularAngle = angle + Math.PI / 2;
    let perpendicularLine = {
      segment: new Segment(
        this.secondPoint,
        new Point(
          this.secondPoint.x + Math.cos(perpendicularAngle) * 100,
          this.secondPoint.y + Math.sin(perpendicularAngle) * 100
        )
      ),
      isInfinite: true,
    };
    constraints.lines.push(perpendicularLine);
    return constraints;
  }

  projectionOnLine(point) {
    let projectionsOnContraints = this.constraints.lines.map(line => {
      let projection = line.segment.projectionOnSegment(point);
      let dist = projection.dist(point);
      return { projection: projection, dist: dist, line: line };
    });
    projectionsOnContraints.sort((p1, p2) => (p1.dist > p2.dist ? 1 : -1));
    return projectionsOnContraints[0];
  }
}
