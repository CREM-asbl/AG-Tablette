import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Shape } from '../Core/Objects/Shape';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';

/**
 * Retourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class ReverseState extends State {
  constructor() {
    super('reverse', 'Retourner', 'move');

    // listen-canvas-click -> selecting-symmetrical-arch -> reversing-shape
    this.currentStep = null;

    //La forme que l'on retourne
    this.selectedShape = null;

    //Timestamp au démarrage de l'animation
    this.startTime = null;

    //Objet représentant l'axe de symétrie utilisée pour le retournement
    this.axe = null;

    //Durée en secondes de l'animation
    this.duration = 2;

    //Couleur des axes de symétrie
    this.symmetricalAxeColor = '#080';

    this.axis = [];

    this.axisAngle = null;

    //Longueur en pixels des 4 arcs de symétrie
    this.symmetricalAxeLength = 200;

    // L'ensemble des formes liées à la forme sélectionnée, y compris la forme elle-même
    this.involvedShapes = [];

    this.requestAnimFrameId = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Pour retourner une forme, touchez-là, puis touchez un des axes de
        symétrie apparus sur la forme pour la retourner selon cet axe de
        symétrie.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    if (this.currentStep == 'selecting-symmetry-axis') {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.shapes.canSelect = true;
      app.workspace.selectionConstraints.points.blacklist = [
        this.selectedShape,
      ];
    } else {
      setTimeout(
        () =>
          (app.workspace.selectionConstraints =
            app.fastSelectionConstraints.click_all_shape)
      );
    }

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.stopAnimation();
    app.upperDrawingEnvironment.removeAllObjects();
    if (this.status != 'paused') {
      this.currentStep = 'listen-canvas-click';
      this.selectedShape = null;
      app.mainDrawingEnvironment.editingShapeIds = [];
    }

    app.removeListener('objectSelected', this.objectSelectedId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onClick)
   * @param  {Object} object            La forme sélectionnée
   */
  objectSelected(object) {
    if (this.currentStep == 'reversing-shape') return;
    if (
      this.currentStep == 'selecting-symmetry-axis' &&
      object instanceof Segment
    ) {
      this.axis
        .filter(axis => axis.id != object.shape.id)
        .forEach(axis =>
          app.upperDrawingEnvironment.removeObjectById(axis.id, 'shape')
        );

      this.startTime = Date.now();
      this.selectedAxis = object;
      this.axisAngle = this.selectedAxis.getAngleWithHorizontal();

      this.drawingShapes.forEach(shape => {
        shape.segments.forEach(seg => {
          if (seg.arcCenter) {
            let tangentCoord1 = seg.centerProjectionOnSegment(this.axisAngle);
            let tangentPoint1 = new Point({
              drawingEnvironment: app.upperDrawingEnvironment,
              coordinates: tangentCoord1,
              startCoordinates: new Coordinates(tangentCoord1),
              endCoordinates: new Coordinates({
                x: tangentCoord1.x + 2 * (seg.arcCenter.x - tangentCoord1.x),
                y: tangentCoord1.y + 2 * (seg.arcCenter.y - tangentCoord1.y),
              }),
              visible: false,
            });
            seg.tangentPoint1 = tangentPoint1;

            let tangentCoord2 = seg.centerProjectionOnSegment(
              this.axisAngle + Math.PI / 2
            );
            let tangentPoint2 = new Point({
              drawingEnvironment: app.upperDrawingEnvironment,
              coordinates: tangentCoord2,
              startCoordinates: new Coordinates(tangentCoord2),
              endCoordinates: new Coordinates({
                x: tangentCoord2.x + 2 * (seg.arcCenter.x - tangentCoord2.x),
                y: tangentCoord2.y + 2 * (seg.arcCenter.y - tangentCoord2.y),
              }),
              visible: false,
            });
            seg.tangentPoint2 = tangentPoint2;

            seg.axisAngle = this.axisAngle;
          }
        });
      });

      app.upperDrawingEnvironment.points.forEach(point => {
        let center = this.selectedAxis.projectionOnSegment(point);

        point.startCoordinates = new Coordinates(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: point.x + 2 * (center.x - point.x),
          y: point.y + 2 * (center.y - point.y),
        });
      });

      this.currentStep = 'reversing-shape';

      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('reverse-animation'));
      this.animate();
    } else if (object instanceof Shape) {
      this.selectedShape = object;
      this.center = this.selectedShape.centerCoordinates;
      this.involvedShapes = ShapeManager.getAllBindedShapes(
        this.selectedShape,
        true
      );

      app.upperDrawingEnvironment.removeAllObjects();
      this.drawingShapes = this.involvedShapes.map(
        s =>
          new Shape({
            ...s,
            drawingEnvironment: app.upperDrawingEnvironment,
            path: s.getSVGPath('no scale'),
            id: undefined,
          })
      );
      app.mainDrawingEnvironment.editingShapeIds = this.involvedShapes.map(
        s => s.id
      );
      this.createAllSymmetryAxis();

      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.whitelist = this.axis.map(
        s => {
          return { shapeId: s.id };
        }
      );
      app.workspace.selectionConstraints.segments.canSelectFromUpper = true;
      app.workspace.selectionConstraints.shapes.canSelect = true;
      app.workspace.selectionConstraints.shapes.blacklist = [
        { shapeId: this.selectedShape.id },
      ];

      this.currentStep = 'selecting-symmetry-axis';
      window.dispatchEvent(new CustomEvent('refreshUpper'));

      window.dispatchEvent(new CustomEvent('refresh'));
    }
  }

  createAllSymmetryAxis() {
    this.axis[0] = this.createSymmetryAxis('N');
    this.axis[1] = this.createSymmetryAxis('NW');
    this.axis[2] = this.createSymmetryAxis('W');
    this.axis[3] = this.createSymmetryAxis('SW');
  }

  createSymmetryAxis(orientation) {
    let path = '';
    if (orientation == 'N') {
      path = [
        'M',
        this.center.x,
        this.center.y - this.symmetricalAxeLength / 2,
        'L',
        this.center.x,
        this.center.y + this.symmetricalAxeLength / 2,
      ].join(' ');
    } else if (orientation == 'NW') {
      path = [
        'M',
        this.center.x - (0.683 * this.symmetricalAxeLength) / 2,
        this.center.y - (0.683 * this.symmetricalAxeLength) / 2,
        'L',
        this.center.x + (0.683 * this.symmetricalAxeLength) / 2,
        this.center.y + (0.683 * this.symmetricalAxeLength) / 2,
      ].join(' ');
    } else if (orientation == 'W') {
      path = [
        'M',
        this.center.x - this.symmetricalAxeLength / 2,
        this.center.y,
        'L',
        this.center.x + this.symmetricalAxeLength / 2,
        this.center.y,
      ].join(' ');
    } else if (orientation == 'SW') {
      path = [
        'M',
        this.center.x + (0.683 * this.symmetricalAxeLength) / 2,
        this.center.y - (0.683 * this.symmetricalAxeLength) / 2,
        'L',
        this.center.x - (0.683 * this.symmetricalAxeLength) / 2,
        this.center.y + (0.683 * this.symmetricalAxeLength) / 2,
      ].join(' ');
    } else {
      console.error('orientation not supported : ', orientation);
    }
    let axis = new Shape({
      drawingEnvironment: app.upperDrawingEnvironment,
      path: path,
      borderColor: this.symmetricalAxeColor,
      isPointed: false,
    });
    return axis;
  }

  /**
   * Gère l'animation du retournement.
   */
  animate() {
    this.lastProgress = this.progress || 0;
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.state == 'reverse') {
      this.actions = [
        {
          name: 'ReverseAction',
          shapeId: this.selectedShape.id,
          involvedShapesIds: this.involvedShapes.map(s => s.id),
          selectedAxisId: this.selectedAxis.id,
          shapesPos: this.involvedShapes.map(s =>
            ShapeManager.getShapeIndex(s)
          ),
        },
      ];
      this.executeAction();
      this.restart();
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refresh'));
    } else {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate()
      );
    }
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  refreshStateUpper() {
    if (this.currentStep == 'reversing-shape' && this.status == 'running') {
      app.upperDrawingEnvironment.points.forEach(point => {
        point.coordinates = point.startCoordinates.substract(
          point.startCoordinates
            .substract(point.endCoordinates)
            .multiply(this.progress)
        );
      });

      if (this.progress > 0.5 && this.lastProgress < 0.5) {
        // milieu animation
        app.upperDrawingEnvironment.shapes.forEach(s => {
          s.isReversed = !s.isReversed;
          s.reverse();
        });
      }
    }
  }
}
