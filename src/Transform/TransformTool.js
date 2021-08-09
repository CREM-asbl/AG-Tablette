import { app } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { Shape } from '../Core/Objects/Shape';
import { SelectManager } from '../Core/Managers/SelectManager';

/**
 * Ajout de figures sur l'espace de travail
 */
export class TransformTool extends Tool {
  constructor() {
    super('transform', 'Modifier un polygone', 'operation');

    // show-points -> move-point
    this.currentStep = null;

    // id of the shape that contains the point
    this.shapeId = null;

    // point to modify
    this.pointSelected = null;

    // destination point
    this.pointDest = null;

    // the constraints applied to pointSelected
    this.constraints = null;

    // line de contrainte (segment, droite, demi-droite ou arc de cercle, cercle)
    this.line = null;
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

    this.shapeId = null;
    this.pointSelected = null;
    this.pointDest = null;
    this.constraints = null;
    this.line = null;

    app.workspace.shapes.forEach((s) => {
      s.modifiablePoints.forEach((pt) => {
        pt.computeTransformConstraint();
      });
    });

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'mousedown';
    app.workspace.selectionConstraints.points.canSelect = true;

    app.workspace.selectionConstraints.points.types = ['modifiablePoint'];
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
    this.stopAnimation();

    app.removeListener('objectSelected', this.objectSelectedId);
    app.removeListener('canvasMouseUp', this.mouseUpId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'canvasMouseUp') {
      this.canvasMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  objectSelected(point) {
    this.pointSelected = point;
    this.shapeId = this.pointSelected.shape.id;

    this.pointSelected.computeTransformConstraint();
    this.constraints = this.pointSelected.transformConstraints;

    if (this.constraints.isConstructed || this.constraints.isBlocked) return;

    this.currentStep = 'move-point';
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);

    this.animate();
    // window.dispatchEvent(new CustomEvent('refresh'));
  }

  canvasMouseUp() {
    if (this.line == null) {
      // pas de contrainte
      let constraints = SelectManager.getEmptySelectionConstraints().points;
      constraints.canSelect = true;
      let adjustedPoint = SelectManager.selectPoint(
        this.pointDest,
        constraints,
        false,
      );
      if (adjustedPoint) {
        this.pointDest.setCoordinates(adjustedPoint);
      }
    }

    this.actions = [
      {
        name: 'TransformAction',
        shapeId: this.shapeId,
        pointSelected: this.pointSelected,
        pointDest: this.pointDest,
        line: this.line,
      },
    ];
    this.executeAction();
    this.restart();
  }

  refreshStateUpper() {
    if (this.currentStep == 'show-points') {
      app.workspace.shapes.forEach((s) => {
        let points = s.modifiablePoints;
        points.forEach((pt) => {
          const transformConstraints = pt.transformConstraints;
          const colorPicker = {
            [transformConstraints.isFree]: '#0f0',
            [transformConstraints.isBlocked]: '#f00',
            [transformConstraints.isConstructed]: '#f00',
            [transformConstraints.isConstrained]: '#FF8C00',
          };
          const color = colorPicker[true];

          window.dispatchEvent(
            new CustomEvent('draw-point', {
              detail: { point: pt, size: 2, color: color },
            }),
          );
        });
      });
    } else if (this.currentStep == 'move-point') {
      if (this.constraints.isConstrained) {
        this.pointDest = this.projectionOnConstraints(
          app.workspace.lastKnownMouseCoordinates,
          this.constraints,
        );

        this.constraints.lines.forEach((line) => {
          window.dispatchEvent(
            new CustomEvent(line.isInfinite ? 'draw-line' : 'draw-segment', {
              detail: { segment: line.segment, color: '#080' },
            }),
          );
        });
        this.constraints.points.forEach((pt) => {
          window.dispatchEvent(
            new CustomEvent('draw-point', {
              detail: {
                point: pt,
                color: app.settings.constraintsDrawColor,
                size: 2,
              },
            }),
          );
        });
      } else {
        this.pointDest = app.workspace.lastKnownMouseCoordinates;
      }

      let shapeCopy = new Shape({
        ...this.pointSelected.shape,
        borderColor: app.settings.temporaryDrawColor,
      });

      shapeCopy.applyTransform(this.pointSelected, this.pointDest);

      window.dispatchEvent(
        new CustomEvent('draw-shape', {
          detail: { shape: shapeCopy, borderSize: 2 },
        }),
      );

      shapeCopy.modifiablePoints.forEach((pt) => {
        window.dispatchEvent(
          new CustomEvent('draw-point', {
            detail: {
              point: pt,
              size: 2,
              color: app.settings.temporaryDrawColor,
            },
          }),
        );
      });

      shapeCopy.updateGeometryReferenced(true);
    }
  }

  projectionOnConstraints(point, constraints) {
    let projectionsOnContraints = constraints.lines
      .map((line) => {
        let projection = line.segment.projectionOnSegment(point);
        let dist = projection.dist(point);
        return { projection: projection, dist: dist };
      })
      .concat(
        constraints.points.map((pt) => {
          let dist = pt.dist(point);
          return { projection: pt, dist: dist };
        }),
      );
    projectionsOnContraints.sort((p1, p2) => (p1.dist > p2.dist ? 1 : -1));
    return projectionsOnContraints[0].projection;
  }
}
