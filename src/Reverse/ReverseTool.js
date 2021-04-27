import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Shape } from '../Core/Objects/Shape';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';

/**
 * Retourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class ReverseTool extends Tool {
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
    this.axisLength = 200;

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
    app.upperDrawingEnvironment.removeAllObjects();

    let selectedShape = ShapeManager.getShapeById(app.tool.selectedShapeId);
    this.center = selectedShape.centerCoordinates;
    let involvedShapes = ShapeManager.getAllBindedShapes(selectedShape, true);
    this.drawingShapes = involvedShapes.map(
      (s) =>
        new Shape({
          ...s,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: s.getSVGPath('no scale'),
          id: undefined,
        }),
    );
    app.mainDrawingEnvironment.editingShapeIds = involvedShapes.map(
      (s) => s.id,
    );
    this.createAllAxes();

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
      { shapeId: selectedShape.id },
    ];

    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  reverse() {
    this.removeListeners();

    this.createAxis(app.tool.axisAngle);
    this.startTime = Date.now();
    this.animate();
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
    if ((app.tool.currentStep == 'start' || app.tool.currentStep == 'selectAxis') && object instanceof Shape) {
      let selectedShape = object;

      // let involvedShapes = ShapeManager.getAllBindedShapes(
      //   selectedShape,
      //   true,
      // );
      // involvedShapes.sort(
      //   (s1, s2) =>
      //     ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
      // );

      setState({ tool:
        {
          ...app.tool,
          currentStep: 'selectAxis',
          selectedShapeId: selectedShape.id,
          // involvedShapeIds: involvedShapes.map(s => s.id)
        }
      });
    } else if (
      app.tool.currentStep == 'selectAxis' &&
      object instanceof Segment
    ) {
      let selectedAxis = object;
      this.axisAngle = selectedAxis.getAngleWithHorizontal();

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
        let center = selectedAxis.projectionOnSegment(point);

        point.startCoordinates = new Coordinates(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: point.x + 2 * (center.x - point.x),
          y: point.y + 2 * (center.y - point.y),
        });
      });

      this.axes
        .forEach((axis) =>
          app.upperDrawingEnvironment.removeObjectById(axis.id, 'shape'),
        );

      setState({ tool: { ...app.tool, currentStep: 'reverse', axisAngle: this.axisAngle } });
      window.dispatchEvent(new CustomEvent('refresh'));
    }
  }

  createAllAxes() {
    this.axes[0] = this.createAxis(Math.PI / 2);
    this.axes[1] = this.createAxis(3 * Math.PI / 4);
    this.axes[2] = this.createAxis(0);
    this.axes[3] = this.createAxis(Math.PI / 4);
  }

  createAxis(orientation) {
  let path = '';
    if (Math.abs(orientation - Math.PI / 2) < 0.01) {
      path = [
        'M',
        this.center.x,
        this.center.y - this.axisLength / 2,
        'L',
        this.center.x,
        this.center.y + this.axisLength / 2,
      ].join(' ');
    } else if (Math.abs(orientation - Math.PI / 4) < 0.01) {
      path = [
        'M',
        this.center.x - (0.683 * this.axisLength) / 2,
        this.center.y - (0.683 * this.axisLength) / 2,
        'L',
        this.center.x + (0.683 * this.axisLength) / 2,
        this.center.y + (0.683 * this.axisLength) / 2,
      ].join(' ');
    } else if (Math.abs(orientation) < 0.01) {
      path = [
        'M',
        this.center.x - this.axisLength / 2,
        this.center.y,
        'L',
        this.center.x + this.axisLength / 2,
        this.center.y,
      ].join(' ');
    } else if (Math.abs(orientation - 3 * Math.PI / 4) < 0.01) {
      path = [
        'M',
        this.center.x + (0.683 * this.axisLength) / 2,
        this.center.y - (0.683 * this.axisLength) / 2,
        'L',
        this.center.x - (0.683 * this.axisLength) / 2,
        this.center.y + (0.683 * this.axisLength) / 2,
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
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'start' } });
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
        if (point.startCoordinates)
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

   _executeAction() {
    let selectedAxis = this.createAxis(app.tool.axisAngle).segments[0];
    let selectedShape = ShapeManager.getShapeById(app.tool.selectedShapeId);
    let involvedShapes = ShapeManager.getAllBindedShapes(selectedShape, true);
    involvedShapes.forEach((s) => {
      this.reverseShape(s, selectedAxis);
    });
  }

  /**
   * Retourne une forme
   * @param  {Shape} shape       la forme à retourner
   */
  reverseShape(shape, selectedAxis) {
    shape.isReversed = !shape.isReversed;
    shape.reverse();

    shape.points.forEach((pt) => {
      this.computePointPosition(pt, selectedAxis);
    });
  }

  /**
   * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale
   * @param  {Point} point    le point
   * @param  {Object} axe      L'axe de symétrie
   * @return {Point}          Nouvelles coordonnées
   */
  computePointPosition(point, selectedAxis) {
    let center = selectedAxis.projectionOnSegment(point);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    point.coordinates = point.coordinates.add(
      center.substract(point.coordinates).multiply(2),
    );
  }
}
