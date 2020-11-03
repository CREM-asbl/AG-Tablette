import { app } from '../../Core/App';
import { State } from '../../Core/States/State';
import { html } from 'lit-element';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Segment } from '../../Core/Objects/Segment';
import { Point } from '../../Core/Objects/Point';
import { uniqId } from '../../Core/Tools/general';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateIrregularState extends State {
  constructor() {
    super(
      'createIrregularPolygon',
      'Créer un polygone irrégulier',
      'geometry_creator'
    );

    // listen-canvas-click
    this.points = [];

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
    this.points = [];

    this.shapeId = uniqId();

    this.mouseClickId = app.addListener('canvasclick', this.handler);
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

    app.removeListener('canvasclick', this.mouseClickId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'canvasclick') {
      this.onClick();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  onClick() {
    let newPoint = new Point(app.workspace.lastKnownMouseCoordinates);

    if (
      this.points.length > 2 &&
      SelectManager.arePointsInSelectionDistance(this.points[0], newPoint)
    ) {
      this.actions = [
        {
          name: 'CreateIrregularAction',
          points: this.points,
          shapeId: this.shapeId,
        },
      ];
      this.executeAction();
      this.restart();
      window.dispatchEvent(new CustomEvent('refresh'));
    } else if (
      this.points.some(pt =>
        SelectManager.arePointsInMagnetismDistance(pt, newPoint)
      )
    ) {
      // si point egal à point de la forme
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: "La forme créée n'est pas valide." },
        })
      );
      return;
    } else {
      // regarder ajustement avec points des autres formes
      let constraints = SelectManager.getEmptySelectionConstraints().points;
      constraints.canSelect = true;
      let adjustedPoint = SelectManager.selectPoint(
        newPoint,
        constraints,
        false
      );
      if (adjustedPoint) {
        this.points.push(new Point(adjustedPoint));
      } else {
        this.points.push(newPoint);
      }
    }
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  draw() {
    this.points.forEach((pt, idx, pts) => {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: pt, color: '#E90CC8', size: 2 },
        })
      );
      if (idx > 0)
        window.dispatchEvent(
          new CustomEvent('draw-segment', {
            detail: {
              segment: new Segment(pts[idx - 1], pt),
              color: '#E90CC8',
              size: 2,
            },
          })
        );
    });
  }
}
