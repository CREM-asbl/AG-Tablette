import { app } from '../../Core/App';
import { State } from '../../Core/States/State';
import { html } from 'lit-element';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Segment } from '../../Core/Objects/Segment';
import { Point } from '../../Core/Objects/Point';
import { uniqId } from '../../Core/Tools/general';
import { Coordinates } from '../../Core/Objects/Coordinates';
import { Shape } from '../../Core/Objects/Shape';

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

    this.mouseDownId = app.addListener('canvasmousedown', this.handler);
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

    app.removeListener('canvasmousedown', this.mouseDownId);
    app.removeListener('canvasmouseup', this.mouseUpId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'canvasmousedown') {
      this.onMouseDown();
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  onMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates
    );

    this.points.push(
      new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.get('temporaryDrawColor'),
        size: 2,
      })
    );
    if (this.points.length > 1) {
      let seg = new Segment({
        drawingEnvironment: app.upperDrawingEnvironment,
        vertexIds: [
          this.points[this.points.length - 2].id,
          this.points[this.points.length - 1].id,
        ],
      });
      new Shape({
        drawingEnvironment: app.upperDrawingEnvironment,
        segmentIds: [seg.id],
        pointIds: seg.vertexIds,
        borderColor: app.settings.get('temporaryDrawColor'),
      });
    }
    app.removeListener('canvasmousedown', this.mouseDownId);
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
    this.animate();
  }

  onMouseUp() {
    if (
      this.points.length > 2 &&
      SelectManager.areCoordinatesInMagnetismDistance(
        this.points[0].coordinates,
        this.points[this.points.length - 1].coordinates
      )
    ) {
      this.stopAnimation();
      // this.adjustPoint(this.points[this.points.length - 1]);
      this.actions = [
        {
          name: 'CreateIrregularAction',
          coordinates: this.points.map(pt => pt.coordinates),
          reference: null, //reference,
        },
      ];
      this.executeAction();
      app.upperDrawingEnvironment.removeAllObjects();
      this.restart();
    } else {
      this.stopAnimation();
      // this.adjustPoint(this.points[this.points.length - 1]);
      this.currentStep = '';
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.currentStep = 'listen-canvas-click';
      this.mouseDownId = app.addListener('canvasmousedown', this.handler);
      app.removeListener('canvasmouseup', this.mouseUpId);
    }
  }

  adjustPoint(point) {
    if (
      this.points.length > 2 &&
      SelectManager.areCoordinatesInMagnetismDistance(
        this.points[0].coordinates,
        point.coordinates
      )
    )
      point.coordinates = new Coordinates(this.points[0].coordinates);
    else {
      let constraints = SelectManager.getEmptySelectionConstraints().points;
      constraints.canSelect = true;
      let adjustedCoordinates = SelectManager.selectPoint(
        point.coordinates,
        constraints,
        false
      );
      if (adjustedCoordinates)
        point.coordinates = new Coordinates(adjustedCoordinates);
    }
  }

  refreshStateUpper() {
    if (this.currentStep == 'listen-canvas-click' && this.points.length > 0) {
      this.points[this.points.length - 1].coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates
      );
      this.adjustPoint(this.points[this.points.length - 1]);
    }
  }
}
