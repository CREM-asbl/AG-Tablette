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
export class CreateLineState extends State {
  constructor() {
    super('createLine', 'Créer une ligne', 'geometry_creator');

    // show-lines -> select-reference -> select-first-point -> select-second-point
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // la référence pour la contruction de parallèles ou perpendiculaires
    this.reference = null;

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
    this.currentStep = 'show-lines';

    this.points = [];
    this.reference = null;
    this.shapeId = uniqId();

    if (!this.linesList) {
      import('./lines-list');
      this.linesList = createElem('lines-list');
    }
    this.linesList.style.display = 'flex';

    window.addEventListener('line-selected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart(manualRestart = false) {
    this.end();

    this.points = [];
    this.reference = null;
    this.shapeId = uniqId();

    if (manualRestart || !this.lineSelected) {
      this.linesList.lineSelected = null;
      this.currentStep = 'show-lines';
    } else {
      if (
        this.lineSelected == 'StraightLine' ||
        this.lineSelected == 'SemiStraightLine' ||
        this.lineSelected == 'Segment'
      ) {
        this.currentStep = 'select-first-point';
        this.mouseClickId = app.addListener('canvasclick', this.handler);
      } else if (
        this.lineSelected == 'ParalleleStraightLine' ||
        this.lineSelected == 'PerpendicularStraightLine' ||
        this.lineSelected == 'ParalleleSemiStraightLine' ||
        this.lineSelected == 'PerpendicularSemiStraightLine' ||
        this.lineSelected == 'ParalleleSegment' ||
        this.lineSelected == 'PerpendicularSegment'
      ) {
        this.currentStep = 'select-reference';
        setTimeout(
          () =>
            (app.workspace.selectionConstraints =
              app.fastSelectionConstraints.click_all_segments)
        );
        this.objectSelectedId = app.addListener('objectSelected', this.handler);
      }
    }

    window.addEventListener('line-selected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      if (this.linesList) this.linesList.remove();
      this.linesList = null;
    }
    window.cancelAnimationFrame(this.requestAnimFrameId);
    window.removeEventListener('line-selected', this.handler);
    app.removeListener('canvasclick', this.mouseClickId);
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'line-selected') {
      this.setLine(event.detail.lineSelected);
    } else if (event.type == 'canvasclick') {
      this.onClick();
    } else if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  setLine(lineSelected) {
    if (lineSelected) {
      app.removeListener('canvasclick', this.mouseClickId);
      app.removeListener('objectSelected', this.objectSelectedId);
      this.lineSelected = lineSelected;
      if (this.linesList) this.linesList.lineSelected = lineSelected;
      if (
        this.lineSelected == 'StraightLine' ||
        this.lineSelected == 'SemiStraightLine' ||
        this.lineSelected == 'Segment'
      ) {
        this.currentStep = 'select-first-point';
        this.mouseClickId = app.addListener('canvasclick', this.handler);
      } else if (
        this.lineSelected == 'ParalleleStraightLine' ||
        this.lineSelected == 'PerpendicularStraightLine' ||
        this.lineSelected == 'ParalleleSemiStraightLine' ||
        this.lineSelected == 'PerpendicularSemiStraightLine' ||
        this.lineSelected == 'ParalleleSegment' ||
        this.lineSelected == 'PerpendicularSegment'
      ) {
        this.currentStep = 'select-reference';
        setTimeout(
          () =>
            (app.workspace.selectionConstraints =
              app.fastSelectionConstraints.click_all_segments)
        );
        this.objectSelectedId = app.addListener('objectSelected', this.handler);
      }
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un segment a été sélectionné
   * @param  {Segment} segment            Le segment sélectionnée
   */
  objectSelected(segment) {
    if (this.currentStep != 'select-reference') return;

    this.reference = segment;

    this.currentStep = 'select-first-point';
    this.animate();
    window.setTimeout(() => {
      this.mouseClickId = app.addListener('canvasclick', this.handler);
    });
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
      if (
        this.lineSelected == 'StraightLine' ||
        this.lineSelected == 'SemiStraightLine' ||
        this.lineSelected == 'Segment'
      )
        this.animate();
      this.currentStep = 'select-second-point';
    } else if (this.currentStep == 'select-second-point') {
      this.points[1] = newPoint;
    }

    if (this.canCreateShape()) {
      this.actions = [
        {
          name: 'CreateLineAction',
          points: this.points,
          reference: this.reference,
          lineName: this.lineSelected,
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
      (this.lineSelected == 'StraightLine' ||
        this.lineSelected == 'SemiStraightLine' ||
        this.lineSelected == 'ParalleleSemiStraightLine' ||
        this.lineSelected == 'PerpendicularSemiStraightLine' ||
        this.lineSelected == 'Segment') &&
      this.points.length == 2
    ) {
      return true;
    } else if (
      this.lineSelected == 'ParalleleStraightLine' &&
      this.reference &&
      this.points.length == 1
    ) {
      return true;
    } else if (
      this.lineSelected == 'PerpendicularStraightLine' &&
      this.reference &&
      this.points.length == 1
    ) {
      return true;
    } else if (
      this.lineSelected == 'ParalleleSegment' &&
      this.reference &&
      this.points.length == 2
    ) {
      return true;
    } else if (
      this.lineSelected == 'PerpendicularSegment' &&
      this.reference &&
      this.points.length == 2
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
      if (
        this.lineSelected == 'ParalleleSegment' ||
        this.lineSelected == 'ParalleleSemiStraightLine'
      ) {
        constraints.isConstrained = true;
        let referenceAngle = this.reference.getAngleWithHorizontal();
        let constraintLine = {
          segment: new Segment(
            this.points[0],
            this.points[0].addCoordinates(
              100 * Math.cos(referenceAngle),
              100 * Math.sin(referenceAngle)
            )
          ),
          isInfinite: true,
        };
        constraints.lines = [constraintLine];
      } else if (
        this.lineSelected == 'PerpendicularSegment' ||
        this.lineSelected == 'PerpendicularSemiStraightLine'
      ) {
        constraints.isConstrained = true;
        let constraintLine = {
          segment: new Segment(
            this.points[0],
            this.reference.projectionOnSegment(this.points[0])
          ),
          isInfinite: true,
        };
        constraints.lines = [constraintLine];
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

    if (
      this.currentStep == 'select-first-point' &&
      (this.lineSelected == 'ParalleleStraightLine' ||
        this.lineSelected == 'PerpendicularStraightLine')
    )
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
      if (this.lineSelected == 'StraightLine') {
        temporaryShape = new Shape({
          segments: [
            new Segment(
              this.points[0],
              this.points[1],
              temporaryShape,
              0,
              null,
              null,
              true
            ),
          ],
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      } else if (this.lineSelected == 'ParalleleStraightLine') {
        let segment = Segment.segmentWithAnglePassingThroughPoint(
          this.reference.getAngleWithHorizontal(),
          this.points[0]
        );
        segment.isInfinite = true;
        temporaryShape = new Shape({
          segments: [segment],
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      } else if (this.lineSelected == 'PerpendicularStraightLine') {
        let segment = Segment.segmentWithAnglePassingThroughPoint(
          this.reference.getAngleWithHorizontal() + Math.PI / 2,
          this.points[0]
        );
        segment.isInfinite = true;
        temporaryShape = new Shape({
          segments: [segment],
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      } else if (
        this.lineSelected == 'SemiStraightLine' ||
        this.lineSelected == 'ParalleleSemiStraightLine' ||
        this.lineSelected == 'PerpendicularSemiStraightLine'
      ) {
        temporaryShape = new Shape({
          segments: [
            new Segment(
              this.points[0],
              this.points[1],
              temporaryShape,
              0,
              null,
              null,
              false,
              true
            ),
          ],
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      } else if (this.lineSelected == 'Segment') {
        temporaryShape = new Shape({
          segments: [new Segment(this.points[0], this.points[1])],
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      } else if (this.lineSelected == 'ParalleleSegment') {
        temporaryShape = new Shape({
          segments: [new Segment(this.points[0], this.points[1])],
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      } else if (this.lineSelected == 'PerpendicularSegment') {
        temporaryShape = new Shape({
          segments: [new Segment(this.points[0], this.points[1])],
          borderColor: app.settings.get('temporaryDrawColor'),
        });
      }

      window.dispatchEvent(
        new CustomEvent('draw-shape', {
          detail: { shape: temporaryShape, borderSize: 2 },
        })
      );
    }

    if (this.reference) {
      window.dispatchEvent(
        new CustomEvent('draw-segment', {
          detail: {
            segment: this.reference,
            color: app.settings.get('temporaryDrawColor'),
            size: 2,
          },
        })
      );
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
