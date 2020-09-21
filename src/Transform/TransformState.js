import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { Shape } from '../Core/Objects/Shape';

/**
 * Ajout de formes sur l'espace de travail
 */
export class TransformState extends State {
  constructor() {
    super('transform', 'Modifier un polygone', 'geometry_creator');

    // show-points -> move-point
    this.currentStep = null;

    // point to modify
    this.pointSelected = null;

    // the constraints applied to pointSelected
    this.constraints = null;

    // destination point
    this.dest = null;
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
    this.currentStep = 'show-points';

    window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
    app.workspace.selectionConstraints.eventType = 'mousedown';
    app.workspace.selectionConstraints.points.canSelect = true;

    app.workspace.selectionConstraints.points.types = ['vertex'];
    app.workspace.selectionConstraints.points.whitelist = null;
    app.workspace.selectionConstraints.points.blacklist = null;

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.start();
  }

  /**
   * stopper l'état
   */
  end() {
    window.cancelAnimationFrame(this.requestAnimFrameId);

    app.removeListener('objectSelected', this.objectSelectedId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  objectSelected(point) {
    this.point = point;

    console.log(this.point);

    this.constraints = this.point.getTransformConstraint();

    this.currentStep = 'move-point';
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);

    this.animate();
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  onMouseUp() {
    this.dest = this.actions = [
      {
        name: 'TransformAction',
        point: this.point,
      },
    ];
    this.executeAction();
    this.restart();
  }

  draw() {
    if (this.currentStep == 'show-points') {
      app.workspace.shapes.forEach(s =>
        s.vertexes.forEach(pt => {
          let transformConstraints = pt.getTransformConstraint();
          let color;
          if (transformConstraints.isFree) {
            color = '#0f0';
          } else if (transformConstraints.isBlocked) {
            color = '#f00';
          } else if (transformConstraints.isConstrained) {
            color = '#ff0';
          }
          window.dispatchEvent(
            new CustomEvent('draw-point', {
              detail: { point: pt, size: 3, color: color },
            })
          );
        })
      );
    } else if (this.currentStep == 'move-point') {
      let nearestPoint;
      if (this.constraints.isConstrained) {
        nearestPoint = this.nearestFromContraints(
          app.workspace.lastKnownMouseCoordinates
        );
        this.dest = nearestPoint.projection;
      } else {
        this.dest = app.workspace.lastKnownMouseCoordinates;
      }
      let color;
      if (this.constraints.isFree) {
        color = '#0f0';
      } else if (this.constraints.isBlocked) {
        color = '#f00';
      } else if (this.constraints.isConstrained) {
        color = '#FF8C00';
      }
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.dest, size: 3, color: color },
        })
      );
      if (this.constraints.isConstrained) {
        this.constraints.lines.forEach(line => {
          window.dispatchEvent(
            new CustomEvent(line.isInfinite ? 'draw-line' : 'draw-segment', {
              detail: { segment: line.segment, color: '#080' },
            })
          );
        });
        let shapeCopy = new Shape(this.point.shape);

        console.log('dest', this.dest);
        console.log('point', this.point);
        console.log(
          'other point',
          nearestPoint.constraint.segment.vertexes[0].equal(this.point)
            ? nearestPoint.constraint.segment.vertexes[1]
            : nearestPoint.constraint.segment.vertexes[0]
        );
        console.log(
          'scale',
          this.point.dist(this.dest) / this.point.segment.length
        );

        shapeCopy.homothety(
          nearestPoint.constraint.segment.vertexes[
            nearestPoint.constraint.segment.vertexes[0].equal(this.point)
              ? 1
              : 0
          ].dist(this.dest) / this.point.segment.length,
          nearestPoint.constraint.segment.vertexes[0].equal(this.point)
            ? nearestPoint.constraint.segment.vertexes[1]
            : nearestPoint.constraint.segment.vertexes[0]
        );

        console.log('vertexes', shapeCopy.vertexes);

        window.dispatchEvent(
          new CustomEvent('draw-shape', { detail: { shape: shapeCopy } })
        );
      }
    }
  }

  nearestFromContraints(point) {
    let projectionsOnContraints = this.constraints.lines.map(constraint => {
      let projection = constraint.segment.projectionOnSegment(point);
      let dist = projection.dist(point);
      return { projection: projection, dist: dist, constraint: constraint };
    });
    projectionsOnContraints.sort((p1, p2) => (p1.dist > p2.dist ? 1 : -1));
    return projectionsOnContraints[0];
  }
}
