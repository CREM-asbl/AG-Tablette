import { app, setState } from '../Core/App';
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

    // start -> select-axis -> reverse
    this.currentStep = null;

    //La forme que l'on retourne
    this.selectedShape = null;

    //Timestamp au démarrage de l'animation
    this.startTime = null;

    // Objet représentant l'axe de symétrie utilisée pour le retournement
    this.axis = null;

    //Durée en secondes de l'animation
    this.duration = 2;

    //Couleur des axes de symétrie
    this.symmetricalAxeColor = '#080';

    this.axes = [];

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
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectAxis() {
    this.removeListeners();

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  reverse() {
    this.removeListeners();
  }

  /**
   * stopper l'état
   */
  end() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onClick)
   * @param  {Object} object            La forme sélectionnée
   */
  objectSelected(object) {
    if (app.tool.currentStep == 'start' && object instanceof Shape) {
      this.selectedShape = object;
      this.center = this.selectedShape.centerCoordinates;
      this.involvedShapes = ShapeManager.getAllBindedShapes(
        this.selectedShape,
        true,
      );

      app.upperDrawingEnvironment.removeAllObjects();
      this.involvedShapes.sort(
        (s1, s2) =>
          ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
      );
      this.drawingShapes = this.involvedShapes.map(
        (s) =>
          new Shape({
            ...s,
            drawingEnvironment: app.upperDrawingEnvironment,
            path: s.getSVGPath('no scale'),
            id: undefined,
          }),
      );
      app.mainDrawingEnvironment.editingShapeIds = this.involvedShapes.map(
        (s) => s.id,
      );
      this.createAllSymmetryAxes();

      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.whitelist = this.axes.map(
        (s) => {
          return { shapeId: s.id };
        },
      );
      app.workspace.selectionConstraints.segments.canSelectFromUpper = true;
      app.workspace.selectionConstraints.shapes.canSelect = true;
      app.workspace.selectionConstraints.shapes.blacklist = [
        { shapeId: this.selectedShape.id },
      ];

      setState({ tool: { ...app.tool, currentStep: 'selectAxis' } });
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refresh'));
    } else if (
      app.tool.currentStep == 'selectAxis' &&
      object instanceof Segment
    ) {
      this.axes
        .filter((axis) => axis.id != object.shape.id)
        .forEach((axis) =>
          app.upperDrawingEnvironment.removeObjectById(axis.id, 'shape'),
        );

      this.startTime = Date.now();
      this.selectedAxis = object;
      this.axisAngle = this.selectedAxis.getAngleWithHorizontal();

      this.drawingShapes.forEach((shape) => {
        shape.segments.forEach((seg) => {
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
              this.axisAngle + Math.PI / 2,
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

      app.upperDrawingEnvironment.points.forEach((point) => {
        let center = this.selectedAxis.projectionOnSegment(point);

        point.startCoordinates = new Coordinates(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: point.x + 2 * (center.x - point.x),
          y: point.y + 2 * (center.y - point.y),
        });
      });

      setState({ tool: { ...app.tool, currentStep: 'reverse' } });
      window.dispatchEvent(new CustomEvent('refresh'));
      this.animate();
    }
  }

  createAllSymmetryAxes() {
    this.axes[0] = this.createSymmetryAxis('N');
    this.axes[1] = this.createSymmetryAxis('NW');
    this.axes[2] = this.createSymmetryAxis('W');
    this.axes[3] = this.createSymmetryAxis('SW');
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
    if (this.progress > 1 && app.tool.name == 'reverse') {
      this.executeAction();
      setState({ tool: { ...app.tool, currentStep: 'start' } });
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refresh'));
    } else {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
    }
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  refreshStateUpper() {
    if (app.tool.currentStep == 'reverse') {
      app.upperDrawingEnvironment.points.forEach((point) => {
        point.coordinates = point.startCoordinates.substract(
          point.startCoordinates
            .substract(point.endCoordinates)
            .multiply(this.progress),
        );
      });

      if (this.progress >= 0.5 && this.lastProgress < 0.5) {
        // milieu animation
        app.upperDrawingEnvironment.shapes.forEach((s) => {
          s.isReversed = !s.isReversed;
          s.reverse();
        });
      }
    }
  }

  executeAction() {
    this.involvedShapes.forEach((s) => {
      this.reverseShape(s);
    });
  }

  /**
   * Retourne une forme
   * @param  {Shape} shape       la forme à retourner
   */
   reverseShape(shape) {
    shape.isReversed = !shape.isReversed;
    shape.reverse();

    shape.points.forEach((pt) => {
      this.computePointPosition(pt);
    });
  }

  /**
   * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale
   * @param  {Point} point    le point
   * @param  {Object} axe      L'axe de symétrie
   * @return {Point}          Nouvelles coordonnées
   */
  computePointPosition(point) {
    let center = this.selectedAxis.projectionOnSegment(point);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    point.coordinates = point.coordinates.add(
      center.substract(point.coordinates).multiply(2),
    );
  }
}
