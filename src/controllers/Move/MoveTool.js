import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { addInfoToId, findObjectById } from '../Core/Tools/general';
import { compareIdBetweenLayers, duplicateShape } from '../Core/Tools/shapesTools';
import { getAllLinkedShapesInGeometry } from '../GeometryTools/general';
import { computeAllShapeTransform, computeConstructionSpec } from '../GeometryTools/recomputeShape';

/**
 * Déplacer une figure (ou un ensemble de figures liées) sur l'espace de travail
 */
export class MoveTool extends Tool {
  constructor() {
    super('move', 'Glisser', 'move');

    // listen-canvas-click -> move
    this.currentStep = null;

    // La figure que l'on déplace
    this.selectedShape = null;

    // Coordonnées de la souris lorsque le déplacement a commencé
    this.startClickCoordinates = null;

    // L'ensemble des figures liées à la figure sélectionnée, y compris la figure elle-même
    this.involvedShapes = [];
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
        Pour déplacer une figure, touchez la figure et glissez votre doigt sans le
        relacher. Relachez ensuite votre doigt une fois que la figure est
        correctement positionnée.
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    this.pointOnLineRatio = null;
    this.lastAdjusment = null;
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    app.workspace.selectionConstraints.shapes.blacklist = app.mainCanvasLayer.shapes.filter(s => s instanceof SinglePointShape);
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  move() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  end() {
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une figure a été sélectionnée (canvasMouseDown)
   */
  objectSelected(shape) {
    if (app.tool.currentStep != 'listen') return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);
    if (app.environment.name == 'Geometrie') {
      this.involvedShapes = ShapeManager.getAllBindedShapesInGeometry(shape);
      for (let i = 0; i < this.involvedShapes.length; i++) {
        let currentShape = this.involvedShapes[i];
        if (currentShape.geometryObject.geometryTransformationName != null) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les images issues de transfomation ne peuvent pas être déplacées.' } }));
          return;
        }
      }
    }
    this.shapesToCopy = [...this.involvedShapes];
    this.shapesToCopy.forEach(s => {
      getAllLinkedShapesInGeometry(s, this.shapesToCopy, false)
    });

    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.lastKnownMouseCoordinates = this.startClickCoordinates;

    this.shapesToCopy.sort(
      (s1, s2) =>
        ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
    );

    this.drawingShapes = this.shapesToCopy.map(
      (s) => duplicateShape(s)
    );
    this.shapesToMove = this.drawingShapes.filter(s => this.involvedShapes.find(inShape => compareIdBetweenLayers(inShape.id, s.id)));

    app.mainCanvasLayer.editingShapeIds = this.shapesToCopy.map(
      (s) => s.id,
    );

    app.upperCanvasLayer.shapes.forEach(s => {
      s.geometryObject?.geometryDuplicateChildShapeIds.forEach(duplicateChildId => {
        let duplicateChild = findObjectById(duplicateChildId);
        computeConstructionSpec(duplicateChild);
      });
    });

    setState({ tool: { ...app.tool, currentStep: 'move' } });
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep != 'move') return;

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() {
    if (app.tool.currentStep == 'move') {
      if (this.shapesToMove.length == 1 && this.shapesToMove[0].name == 'PointOnLine') {
        let s = this.shapesToMove[0];

        let point = s.points[0];
        let reference = findObjectById(s.geometryObject.geometryParentObjectId1);
        point.coordinates = reference.projectionOnSegment(app.workspace.lastKnownMouseCoordinates);
        let ratioX = (point.coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
        let ratioY = (point.coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
        let ratio = ratioX;
        if (isNaN(ratio))
          ratio = ratioY;

        if (ratio < 0 && !(reference.shape.name.endsWith('StraightLine') && !reference.shape.name.endsWith('SeminStraightLine')))
          ratio = 0;
        if (ratio > 1 && !reference.shape.name.endsWith('StraightLine'))
          ratio = 1;
        point.ratio = ratio;
        this.pointOnLineRatio = ratio;

        let firstPoint = reference.vertexes[0];
        let secondPoint = reference.vertexes[1];

        const segLength = secondPoint.coordinates.substract(
          firstPoint.coordinates,
        );
        const part = segLength.multiply(point.ratio);

        let coord = firstPoint.coordinates.add(part);
        point.coordinates = coord;
      } else {
        let mainShape = findObjectById(addInfoToId(this.selectedShape.id, 'upper'));
        let translation = app.workspace.lastKnownMouseCoordinates.substract(
          this.lastKnownMouseCoordinates,
        );

        this.shapesToMove.forEach((s) => {
          if (this.lastAdjusment) {
            s.translate(Coordinates.nullCoordinates.substract(this.lastAdjusment.translation));
            s.rotate(this.lastAdjusment.rotationAngle * -1, this.lastAdjusment.centerCoord);
          }
          s.translate(translation);
        });

        let adjustment = getShapeAdjustment(
          this.shapesToMove,
          mainShape,
          app.mainCanvasLayer.editingShapeIds,
        );
        this.lastAdjusment = {
          ...adjustment,
          centerCoord: new Coordinates(mainShape.centerCoordinates),
        };
        this.shapesToMove.forEach((s) => {
          s.rotate(
            adjustment.rotationAngle,
            this.lastAdjusment.centerCoord,
          );
          s.translate(adjustment.translation);
        });
        this.shapesToMove.forEach(s => {
          computeAllShapeTransform(s, 'upper', false);
        });
      }

      this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    }
  }

  _executeAction() {
    app.mainCanvasLayer.editingShapeIds.forEach((sId, idxS) => {
      let s = findObjectById(sId);
      s.points.forEach((pt, idxPt) => {
        pt.coordinates = new Coordinates(this.drawingShapes[idxS].points[idxPt].coordinates);
        if (this.pointOnLineRatio)
          pt.ratio = this.pointOnLineRatio;
      });
    });

    if (app.environment.name == 'Geometrie') {
      app.mainCanvasLayer.shapes.forEach(s => {
        s.geometryObject?.geometryDuplicateChildShapeIds.forEach(duplicateChildId => {
          let duplicateChild = findObjectById(duplicateChildId);
          computeConstructionSpec(duplicateChild);
        });
      });
      app.mainCanvasLayer.editingShapeIds.forEach((sId, idxS) => {
        let s = findObjectById(sId);
        computeAllShapeTransform(s, 'main', false);
      });
    }
  }
}
