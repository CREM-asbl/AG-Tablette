import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';

/**
 */
export class OrthogonalSymetryTool extends Tool {
  constructor() {
    super('orthogonalSymetry', 'Symétrie orthogonale', 'transformation');
  }

  /**
   * initialiser l'état
   */
  start() {
    this.removeListeners();

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectFirstReference' } }), 50);
  }

  selectFirstReference() {
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    this.firstReference = null;
    this.secondReference = null;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  selectReference() {
    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectObject() {
    this.setSelectionConstraints();
  }

  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();
  }

  objectSelected(object) {
    if (app.tool.currentStep == 'selectReference') {
      if (this.firstReference == null) {
        this.firstReference = object;
        if (object instanceof Point) {
          new Point({
            coordinates: this.firstReference.coordinates,
            drawingEnvironment: app.upperDrawingEnvironment,
            color: app.settings.referenceDrawColor,
            size: 2,
          });
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } });
        } else {
          this.referenceShape = new Shape({
            drawingEnvironment: app.upperDrawingEnvironment,
            path: this.firstReference.getSVGPath('scale', true),
            borderColor: app.settings.referenceDrawColor,
            borderSize: 2,
          });
          this.referenceShape.segments[0].isInfinite = true;
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
        }
      } else {
        this.secondReference = object;
        if (this.secondReference.id == this.firstReference.id) {
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectFirstReference' } });
          return;
        }
        new Point({
          coordinates: this.secondReference.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: app.settings.referenceDrawColor,
          size: 2,
        });
        this.referenceShape = new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: `M ${this.firstReference.coordinates.x} ${this.firstReference.coordinates.y} L ${this.secondReference.coordinates.x} ${this.secondReference.coordinates.y}`,
          borderColor: app.settings.referenceDrawColor,
          borderSize: 2,
        });
        this.referenceShape.segments[0].isInfinite = true;
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
      }
    } else {
      this.object = object;
      // this.animate();
      this.executeAction();
    }
  }

  _executeAction() {
    let selectedAxis = this.referenceShape.segments[0];
    // let selectedShape = ShapeManager.getShapeById(app.tool.selectedShapeId);
    // let involvedShapes = ShapeManager.getAllBindedShapes(selectedShape, true);
    // involvedShapes.forEach((s) => {
      this.reverseShape(this.object, selectedAxis);
    // });
  }

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

  setSelectionConstraints() {
    if (app.tool.currentStep == 'selectReference') {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      if (this.firstReference == null) {
        app.workspace.selectionConstraints.segments.canSelect = true;
        app.workspace.selectionConstraints.points.canSelect = true;
      } else {
        app.workspace.selectionConstraints.points.canSelect = true;
      }
    } else {
      app.workspace.selectionConstraints =
        app.fastSelectionConstraints.mousedown_all_shape;
    }
  }
}
