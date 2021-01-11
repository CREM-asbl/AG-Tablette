import { app } from '../../Core/App';
import { State } from '../../Core/States/State';
import { html } from 'lit-element';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';
import { Point } from '../../Core/Objects/Point';
import { uniqId, createElem } from '../../Core/Tools/general';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Coordinates } from '../../Core/Objects/Coordinates';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateRegularState extends State {
  constructor() {
    super(
      'createRegularPolygon',
      'Créer un polygone régulier',
      'geometry_creator'
    );

    // listen-canvas-click -> select-second-point
    this.currentStep = null;

    // numbre of points in the shape
    this.numberOfPoints = 4;

    // first point of the shape to create
    this.firstCoordinates = null;

    // second point of the shape to create
    this.secondCoordinates = null;

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

    this.firstCoordinates = null;
    this.secondCoordinates = null;

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

    this.firstCoordinates = null;
    this.secondCoordinates = null;

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
      console.error('unsupported event type : ', event.type);
    }
  }

  setNumberOfPoints(points) {
    this.numberOfPoints = parseInt(points);
    this.currentStep = 'listen-canvas-click';
  }

  onClick() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates
    );

    let constraints = SelectManager.getEmptySelectionConstraints().points;
    constraints.canSelect = true;
    let adjustedCoordinates = SelectManager.selectPoint(
      newCoordinates,
      constraints,
      false
    );
    if (adjustedCoordinates) {
      newCoordinates = new Coordinates(adjustedCoordinates);
    }

    if (this.currentStep == 'listen-canvas-click') {
      this.firstCoordinates = newCoordinates;
      this.currentStep = 'select-second-point';
      this.animate();
    } else {
      // 'select-second-point'
      this.secondCoordinates = newCoordinates;
      // let reference = Shape.getReference(this.firstCoordinates, this.secondCoordinates);
      this.actions = [
        {
          name: 'CreateRegularAction',
          firstCoordinates: this.firstCoordinates,
          secondCoordinates: this.secondCoordinates,
          numberOfPoints: this.numberOfPoints,
          reference: null, //reference,
        },
      ];
      this.executeAction();
      this.restart();
      window.dispatchEvent(new CustomEvent('refresh'));
    }

    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  refreshStateUpper() {
    app.upperDrawingEnvironment.removeAllObjects();
    if (this.currentStep == 'select-second-point') {
      let newCoordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates
      );

      let path = this.getPath(this.firstCoordinates, newCoordinates);

      new Shape({
        path: path,
        drawingEnvironment: app.upperDrawingEnvironment,
        borderColor: app.settings.get('temporaryDrawColor'),
      });
    }
  }

  getPath(firstCoordinates, secondCoordinates) {
    let externalAngle = (Math.PI * 2) / this.numberOfPoints;

    let path = [
      'M',
      firstCoordinates.x,
      firstCoordinates.y,
      'L',
      secondCoordinates.x,
      secondCoordinates.y,
    ];

    let length = firstCoordinates.dist(secondCoordinates);

    let startAngle = Math.atan2(
      -(firstCoordinates.y - secondCoordinates.y),
      -(firstCoordinates.x - secondCoordinates.x)
    );

    let currentCoordinates = secondCoordinates;

    for (let i = 0; i < this.numberOfPoints - 2; i++) {
      let dx = length * Math.cos(startAngle - (i + 1) * externalAngle);
      let dy = length * Math.sin(startAngle - (i + 1) * externalAngle);

      currentCoordinates = currentCoordinates.add({ x: dx, y: dy });

      path.push('L', currentCoordinates.x, currentCoordinates.y);
    }

    path.push('L', firstCoordinates.x, firstCoordinates.y);

    path = path.join(' ');

    return path;
  }
}
