import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { uniqId, createElem } from '../Core/Tools/general';
import { SelectManager } from '../Core/Managers/SelectManager';

/**
 * Ajout de formes sur l'espace de travail
 */
export class RegularCreateState extends State {
  constructor() {
    super(
      'create_regular_polygon',
      'Créer un polygone régulier',
      'geometry_creator'
    );

    // listen-canvas-click -> select-second-point
    this.currentStep = null;

    // numbre of points in the shape
    this.numberOfPoints = 4;

    // first point of the shape to create
    this.firstPoint = null;

    // second point of the shape to create
    this.secondPoint = null;

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
    this.currentStep = 'choose-nb-parts';
    let popup = createElem('regular-popup');
    popup.points = this.numberOfPoints;

    this.firstPoint = null;
    this.secondPoint = null;
    this.shapeId = uniqId();

    this.mouseClickId = app.addListener('canvasclick', this.handler);
    window.addEventListener('setNumberOfPoints', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart(manualRestart = false) {
    this.end();
    if (manualRestart) {
      this.start();
      return;
    }

    this.firstPoint = null;
    this.secondPoint = null;
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
    window.removeEventListener('setNumberOfPoints', this.handler);
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

  setNumberOfPoints(points) {
    this.numberOfPoints = parseInt(points);
    this.currentStep = 'listen-canvas-click';
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
    } else {
      // 'select-second-point'
      this.secondPoint = newPoint;
      this.actions = [
        {
          name: 'RegularCreateAction',
          firstPoint: this.firstPoint,
          secondPoint: this.secondPoint,
          numberOfPoints: this.numberOfPoints,
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
    if (this.currentStep != 'select-second-point') return;

    let shape = this.createPolygon();

    window.dispatchEvent(
      new CustomEvent('draw-shape', { detail: { shape: shape, borderSize: 2 } })
    );

    shape.vertexes.forEach(pt => {
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

  createPolygon() {
    let newPoint = new Point(app.workspace.lastKnownMouseCoordinates);

    let newSegments = this.getNewSegments(newPoint);

    let shape = new Shape({
      segments: newSegments,
      borderColor: app.settings.get('temporaryDrawColor'),
    });

    return shape;
  }

  getNewSegments(newPoint) {
    let externalAngle = (Math.PI * 2) / this.numberOfPoints;

    let segments = [];

    segments.push(new Segment(this.firstPoint, newPoint));

    let length = this.firstPoint.dist(newPoint);

    let startAngle = Math.atan2(
      -(this.firstPoint.y - newPoint.y),
      -(this.firstPoint.x - newPoint.x)
    );

    for (let i = 0; i < this.numberOfPoints - 2; i++) {
      let dx = length * Math.cos(startAngle - (i + 1) * externalAngle);
      let dy = length * Math.sin(startAngle - (i + 1) * externalAngle);

      let np = segments[i].vertexes[1].addCoordinates(dx, dy);

      segments.push(new Segment(segments[i].vertexes[1], np));
    }

    segments.push(
      new Segment(
        segments[this.numberOfPoints - 2].vertexes[1],
        this.firstPoint
      )
    );

    return segments;
  }
}
