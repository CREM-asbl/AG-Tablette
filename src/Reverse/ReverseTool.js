import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Shape } from '../Core/Objects/Shapes/Shape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { getAllLinkedShapesInGeometry } from '../GeometryTools/general';
import { computeAllShapeTransform } from '../GeometryTools/recomputeShape';

/**
 * Retourner une figure (ou un ensemble de figures liées) sur l'espace de travail
 */
export class ReverseTool extends Tool {
  constructor() {
    super('reverse', 'Retourner', 'move');

    // start -> select-axis -> reverse
    this.currentStep = null;

    // La figure que l'on retourne
    this.selectedShape = null;

    // Timestamp au démarrage de l'animation
    this.startTime = null;

    // Objet représentant l'axe de symétrie utilisée pour le retournement
    this.axis = null;

    // Durée en secondes de l'animation
    this.duration = 2;

    // Couleur des axes de symétrie
    this.symmetricalAxeColor = '#080';

    this.axes = [];

    this.axisAngle = null;

    // Longueur en pixels des 4 arcs de symétrie
    this.axisLength = 200;

    // L'ensemble des figures liées à la figure sélectionnée, y compris la figure elle-même
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
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Pour retourner une figure, touchez-là, puis touchez un des axes de
        symétrie apparus sur la figure pour la retourner selon cet axe de
        symétrie.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    app.workspace.selectionConstraints.shapes.blacklist = app.mainDrawingEnvironment.shapes.filter(s => s instanceof SinglePointShape);
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectAxis() {
    this.removeListeners();
    app.upperDrawingEnvironment.removeAllObjects();

    let selectedShape = ShapeManager.getShapeById(app.tool.selectedShapeId);

    this.shapesToCopy = [...this.involvedShapes];
    this.shapesToCopy.forEach(s => {
      getAllLinkedShapesInGeometry(s, this.shapesToCopy)
    });

    this.center = selectedShape.centerCoordinates;
    this.initialAngle = this.center.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.lastAngle = this.initialAngle;

    this.shapesToCopy.sort(
      (s1, s2) =>
        ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
    );

    this.drawingShapes = this.shapesToCopy.map(
      (s) => {
        let newShape = new s.constructor({
          ...s,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: s.getSVGPath('no scale', false, false),
          divisionPointInfos: s.divisionPoints.map((dp) => {
            return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, id: dp.id, color: dp.color };
          }),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points.map((pt) => {
            return pt.color;
          }),
        });
        let segIds = newShape.segments.map((seg, idx) => seg.id = s.segments[idx].id);
        let ptIds = newShape.points.map((pt, idx) => pt.id = s.points[idx].id);
        newShape.segmentIds = [...segIds];
        newShape.pointIds = [...ptIds];
        newShape.points.forEach((pt, idx) => {
          pt.segmentIds = [...s.points[idx].segmentIds];
          pt.reference = s.points[idx].reference;
          pt.type = s.points[idx].type;
          pt.ratio = s.points[idx].ratio;
          pt.visible = s.points[idx].visible;
        });
        newShape.segments.forEach((seg, idx) => {
          seg.isInfinite = s.segments[idx].isInfinite;
          seg.isSemiInfinite = s.segments[idx].isSemiInfinite;
          seg.vertexIds = [...s.segments[idx].vertexIds];
          seg.divisionPointIds = [...s.segments[idx].divisionPointIds];
          seg.arcCenterId = s.segments[idx].arcCenterId;
        });
        return newShape;
      }
    );
    this.shapesToMove = this.drawingShapes.filter(s => this.involvedShapes.find(inShape => inShape.id == s.id));

    app.mainDrawingEnvironment.editingShapeIds = this.shapesToCopy.map(
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
      // { shapeId: selectedShape.id },
      app.workspace.selectionConstraints.shapes.blacklist = app.mainDrawingEnvironment.shapes.filter(s => s instanceof SinglePointShape)
    ];

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
   * Appelée par événement du SelectManager quand une figure est sélectionnée (onClick)
   * @param  {Object} object            La figure sélectionnée
   */
  objectSelected(object) {
    if (
      (app.tool.currentStep == 'listen' ||
        app.tool.currentStep == 'selectAxis') &&
      object instanceof Shape
    ) {
      let selectedShape = object;

      this.involvedShapes = ShapeManager.getAllBindedShapes(selectedShape);
      if (app.environment.name == 'Geometrie') {
        this.involvedShapes = ShapeManager.getAllBindedShapesInGeometry(selectedShape);
        for (let i = 0; i < this.involvedShapes.length; i++) {
          let currentShape = this.involvedShapes[i];
          if (currentShape.geometryObject?.geometryTransformationName != null) {
            window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les images issues de transfomation ne peuvent pas être retournées.' } }));
            return;
          }
          // if (currentShape.name.startsWith('Parallele') || currentShape.name.startsWith('Perpendicular')) {
          //   window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les lignes parallèles ne peuvent pas être retournées.' } }));
          //   return;
          // }
          // if ((currentShape.points.some(vx => (vx.reference != null && app.mainDrawingEnvironment.findObjectById(vx.reference, 'point').shape.name != 'Point')) && currentShape.name != 'PointOnLine') ||
          //   (currentShape.geometryObject.geometryChildShapeIds.length > 0)) {
          //    window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les figures liées ne peuvent pas être retournées, mais peuvent être copiées.' } }));
          //   return;
          // }
        }
      }

      setState({
        tool: {
          ...app.tool,
          currentStep: 'selectAxis',
          selectedShapeId: selectedShape.id,
        },
      });
    } else if (
      app.tool.currentStep == 'selectAxis' &&
      object instanceof Segment
    ) {
      let selectedAxis = object;
      this.axisAngle = selectedAxis.getAngleWithHorizontal();

      this.shapesToMove.forEach((shape) => {
        shape.segments.forEach((seg) => {
          if (seg.arcCenter) {
            let tangentCoord1 = seg.centerProjectionOnSegment(this.axisAngle);
            let tangentPoint1 = new Point({
              drawingEnvironment: app.upperDrawingEnvironment,
              coordinates: tangentCoord1,
              visible: false,
            });
            let center = selectedAxis.projectionOnSegment(tangentPoint1);
            tangentPoint1.startCoordinates = new Coordinates(tangentCoord1);
            tangentPoint1.endCoordinates = new Coordinates({
              x: tangentCoord1.x + 2 * (center.x - tangentCoord1.x),
              y: tangentCoord1.y + 2 * (center.y - tangentCoord1.y),
            });
            seg.tangentPoint1 = tangentPoint1;

            let tangentCoord2 = seg.centerProjectionOnSegment(
              this.axisAngle + Math.PI / 2,
            );
            let tangentPoint2 = new Point({
              drawingEnvironment: app.upperDrawingEnvironment,
              coordinates: tangentCoord2,
              visible: false,
            });
            center = selectedAxis.projectionOnSegment(tangentPoint2);
            tangentPoint2.startCoordinates = new Coordinates(tangentCoord2);
            tangentPoint2.endCoordinates = new Coordinates({
              x: tangentCoord2.x + 2 * (center.x - tangentCoord2.x),
              y: tangentCoord2.y + 2 * (center.y - tangentCoord2.y),
            });
            seg.tangentPoint2 = tangentPoint2;

            seg.axisAngle = this.axisAngle;
          }
        });
        shape.points.forEach(pt => {
          let center = selectedAxis.projectionOnSegment(pt);

          pt.startCoordinates = new Coordinates(pt.coordinates);
          pt.endCoordinates = new Coordinates({
            x: pt.x + 2 * (center.x - pt.x),
            y: pt.y + 2 * (center.y - pt.y),
          });
        })
      });

      // app.upperDrawingEnvironment.points.forEach((point) => {
      //   let center = selectedAxis.projectionOnSegment(point);

      //   point.startCoordinates = new Coordinates(point.coordinates);
      //   point.endCoordinates = new Coordinates({
      //     x: point.x + 2 * (center.x - point.x),
      //     y: point.y + 2 * (center.y - point.y),
      //   });
      // });

      this.axes.forEach((axis) =>
        app.upperDrawingEnvironment.removeObjectById(axis.id, 'shape'),
      );

      setState({
        tool: {
          ...app.tool,
          currentStep: 'reverse',
          axisAngle: this.axisAngle,
        },
      });
    }
  }

  createAllAxes() {
    this.axes[0] = this.createAxis(Math.PI / 2);
    this.axes[1] = this.createAxis((3 * Math.PI) / 4);
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
    } else if (Math.abs(orientation - (3 * Math.PI) / 4) < 0.01) {
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
    let axis = new LineShape({
      drawingEnvironment: app.upperDrawingEnvironment,
      path: path,
      strokeColor: this.symmetricalAxeColor,
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
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'listen' },
      });
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
      let progressInAnimation = Math.cos(Math.PI * (1 - this.progress)) / 2 + 0.5;
      this.shapesToMove.forEach((s) => {
        s.points.forEach(point => {
          if (point.startCoordinates)
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(progressInAnimation),
          );
        })
        s.segments.forEach(seg => {
          if (seg.arcCenter) {
            let point = seg.tangentPoint1
            if (point.startCoordinates)
              point.coordinates = point.startCoordinates.substract(
                point.startCoordinates
                  .substract(point.endCoordinates)
                  .multiply(progressInAnimation)
              );
            let point2 = seg.tangentPoint2

            if (point2.startCoordinates)
              point2.coordinates = point2.startCoordinates.substract(
                point2.startCoordinates
                  .substract(point2.endCoordinates)
                  .multiply(progressInAnimation)
              );
          }
        })
        if (this.progress >= 0.5 && this.lastProgress < 0.5) {
          s.reverse();
        }
        // computeAllShapeTransform(s);
      });

      // this.shapesToMove.forEach(s => {
      // });
      // app.upperDrawingEnvironment.points.forEach((point) => {

      // });

      // if (this.progress >= 0.5 && this.lastProgress < 0.5) {
      //   // milieu animation
      //   app.upperDrawingEnvironment.shapes.forEach((s) => {
      //     s.reverse();
      //   });
      // }
    }
  }

  _executeAction() {
    let selectedAxis = this.createAxis(app.tool.axisAngle).segments[0];
    // let selectedShape = ShapeManager.getShapeById(app.tool.selectedShapeId);
    // let involvedShapes = ShapeManager.getAllBindedShapes(selectedShape);
    app.mainDrawingEnvironment.editingShapeIds.filter(editingShapeId => this.shapesToMove.some(shapeToMove => shapeToMove.id == editingShapeId)).forEach((sId, idxS) => {
      let s = app.mainDrawingEnvironment.findObjectById(sId);
    // involvedShapes.forEach((s) => {
      this.reverseShape(s, selectedAxis);

      // computeAllShapeTransform(s, 'main');
    });
    // });
  }

  /**
   * Retourne une figure
   * @param  {Shape} shape       la figure à retourner
   */
  reverseShape(shape, selectedAxis) {
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
