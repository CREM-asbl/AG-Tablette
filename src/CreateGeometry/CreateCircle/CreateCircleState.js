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
export class CreateCircleState extends State {
  constructor() {
    super('createCircle', 'Créer un cercle', 'geometry_creator');

    // show-circles -> select-center -> select-first-point -> select-second-point
    this.currentStep = null;

    // arc center of the shape to create
    this.arcCenter = null;

    // points of the shape to create
    this.points = [];

    // Le tyle de forme que l'on va créer (circle, circlePart, circleArc)
    this.circleSelected = null;

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
    this.currentStep = 'show-circles';

    this.points = [];
    this.arcCenter = null;
    this.shapeId = uniqId();

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
    this.points = [];
    this.arcCenter = null;
    this.shapeId = uniqId();

    if (this.circleSelected) {
      this.currentStep = 'select-center';
      window.dispatchEvent(
        new CustomEvent('circle-selected', {
          detail: { circleSelected: this.circleSelected },
        })
      );
    } else {
      this.currentStep = 'show-circles';
    }

    window.addEventListener('circle-selected', this.handler);
    this.mouseDownId = app.addListener('canvasclick', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      if (this.circlesList) this.circlesList.remove();
      this.circlesList = null;
    }
    window.cancelAnimationFrame(this.requestAnimFrameId);
    window.removeEventListener('circle-selected', this.handler);
    app.removeListener('canvasclick', this.mouseDownId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'circle-selected') {
      this.setCircle(event.detail.circleSelected);
    } else if (event.type == 'canvasclick') {
      this.onClick();
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  setCircle(circleSelected) {
    if (circleSelected) {
      this.circleSelected = circleSelected;
      if (this.circlesList) this.circlesList.circleSelected = circleSelected;
      this.currentStep = 'select-center';
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

    if (this.currentStep == 'select-center') {
      this.arcCenter = newPoint;
      if (this.circleSelected == 'Circle') this.animate();
      this.currentStep = 'select-first-point';
    } else if (this.currentStep == 'select-first-point') {
      this.points[0] = newPoint;
      if (this.circleSelected != 'Circle') this.animate();
      this.currentStep = 'select-second-point';
    } else if (this.currentStep == 'select-second-point') {
      this.points[1] = newPoint;
    }

    if (this.canCreateShape()) {
      this.actions = [
        {
          name: 'CreateCircleAction',
          arcCenter: this.arcCenter,
          points: this.points,
          circleName: this.circleSelected,
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
    if (this.circleSelected == 'Circle' && this.points.length == 1) {
      return true;
    } else if (this.circleSelected == 'CirclePart' && this.points.length == 2) {
      return true;
    } else if (this.circleSelected == 'CircleArc' && this.points.length == 2) {
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
    if (this.currentStep == 'select-center') {
      constraints.isFree = true;
    } else if (this.currentStep == 'select-first-point') {
      constraints.isFree = true;
    } else if (this.currentStep == 'select-second-point') {
      if (this.circleSelected == 'CirclePart') {
        constraints.isConstrained = true;
        let constraintLine = {
          segment: new Segment(
            this.points[0],
            this.points[0],
            null,
            null,
            this.arcCenter
          ),
        };
        constraints.lines.push(constraintLine);
      } else if (this.circleSelected == 'CircleArc') {
        constraints.isConstrained = true;
        let constraintLine = {
          segment: new Segment(
            this.points[0],
            this.points[0],
            null,
            null,
            this.arcCenter
          ),
        };
        constraints.lines.push(constraintLine);
      } else {
        constraints.isFree = true;
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

    if (this.currentStep == 'select-first-point')
      this.points[0] = constrainedPoint;
    else if (this.currentStep == 'select-second-point')
      this.points[1] = constrainedPoint;

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
      let temporaryShape;
      if (this.circleSelected == 'Circle') {
        temporaryShape = new Shape({
          segments: [
            new Segment(
              this.points[0],
              this.points[0],
              temporaryShape,
              0,
              this.arcCenter
            ),
          ],
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      } else if (this.circleSelected == 'CirclePart') {
        temporaryShape = new Shape({
          segments: [
            new Segment(this.arcCenter, this.points[0]),
            new Segment(
              this.points[0],
              this.points[1],
              temporaryShape,
              0,
              this.arcCenter,
              true
            ),
            new Segment(this.points[1], this.arcCenter),
          ],
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      } else if (this.circleSelected == 'CircleArc') {
        temporaryShape = new Shape({
          segments: [
            new Segment(
              this.points[0],
              this.points[1],
              temporaryShape,
              0,
              this.arcCenter,
              true
            ),
          ],
          name: 'CircleArc',
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      }

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

    [...this.points, this.arcCenter]
      .filter(pt => pt)
      .forEach(pt => {
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
