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

    // id of the shape that contains the point
    this.shapeId = null;

    // point to modify
    this.pointSelected = null;

    // destination point
    this.dest = null;

    // the constraints applied to pointSelected
    this.constraints = null;
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
    app.removeListener('canvasmouseup', this.mouseUpId);
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
    this.pointSelected = point;
    this.shapeId = this.pointSelected.shape.id;

    this.constraints = this.pointSelected.getTransformConstraint();

    this.currentStep = 'move-point';
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);

    this.animate();
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  onMouseUp() {
    this.dest = this.actions = [
      {
        name: 'TransformAction',
        shapeId: this.shapeId,
        pointSelected: this.pointSelected,
        pointDest: this.dest,
        line: this.line,
      },
    ];
    this.executeAction();
    this.restart();
  }

  draw() {
    if (this.currentStep == 'show-points') {
      app.workspace.shapes.forEach(s =>
        s.vertexes.forEach(pt => {
          const transformConstraints = pt.getTransformConstraint();
          const colorPicker = {
            '#0f0': transformConstraints.isFree,
            '#f00': transformConstraints.isBlocked,
            '#FF8C00': transformConstraints.isConstrained,
          };
          const color = Object.entries(colorPicker).filter(
            ([key, value]) => value
          )[0][0];

          window.dispatchEvent(
            new CustomEvent('draw-point', {
              detail: { point: pt, size: 3, color: color },
            })
          );
        })
      );
    } else if (this.currentStep == 'move-point') {
      let projectionOnLine;
      if (this.constraints.isConstrained) {
        projectionOnLine = this.projectionOnLine(
          app.workspace.lastKnownMouseCoordinates
        );
        this.dest = projectionOnLine.projection;
      } else {
        this.dest = app.workspace.lastKnownMouseCoordinates;
      }

      let colorPicker = {
        '#0f0': this.constraints.isFree,
        '#f00': this.constraints.isBlocked,
        '#FF8C00': this.constraints.isConstrained,
      };
      let color = Object.entries(colorPicker).filter(
        ([key, value]) => value
      )[0][0];

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
        let shapeCopy = new Shape(this.pointSelected.shape);
        this.line = projectionOnLine.line;

        let homothetyCenter = this.line.segment.vertexes[
          this.line.segment.vertexes[0].equal(this.pointSelected) ? 1 : 0
        ];
        shapeCopy.homothety(
          homothetyCenter.dist(this.dest) / this.pointSelected.segment.length,
          homothetyCenter
        );

        window.dispatchEvent(
          new CustomEvent('draw-shape', { detail: { shape: shapeCopy } })
        );
      }
    }
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
