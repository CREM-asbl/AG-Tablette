import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 */
export class TranslationTool extends Tool {
  constructor() {
    super('Translation', 'Translation', 'transformation');
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
        new Point({
          coordinates: this.firstReference.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: app.settings.referenceDrawColor,
          size: 2,
        });
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } });
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
        let angle = this.secondReference.coordinates.angleWith(this.firstReference.coordinates);
        let firstTriangleCoord = this.secondReference.coordinates.add(new Coordinates({
          x: 20 * Math.cos(angle + 0.35),
          y: 20 * Math.sin(angle + 0.35),
        }));
        let secondTriangleCoord = this.secondReference.coordinates.add(new Coordinates({
          x: 20 * Math.cos(angle - 0.35),
          y: 20 * Math.sin(angle - 0.35),
        }));
        this.referenceShape = new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: `M ${this.firstReference.coordinates.x} ${this.firstReference.coordinates.y} L ${this.secondReference.coordinates.x} ${this.secondReference.coordinates.y} L ${firstTriangleCoord.x} ${firstTriangleCoord.y} L ${secondTriangleCoord.x} ${secondTriangleCoord.y} L ${this.secondReference.coordinates.x} ${this.secondReference.coordinates.y}`,
          borderColor: app.settings.referenceDrawColor,
          color: app.settings.referenceDrawColor,
          borderSize: 2,
          isPointed: false,
        });
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
      }
    } else {
      this.object = object;
      // this.animate();
      this.executeAction();
    }
  }

  _executeAction() {
    // let selectedShape = ShapeManager.getShapeById(app.tool.selectedShapeId);
    // let involvedShapes = ShapeManager.getAllBindedShapes(selectedShape, true);
    // involvedShapes.forEach((s) => {
    this.object.translate(this.secondReference.coordinates.substract(this.firstReference.coordinates));
    // });
  }

  setSelectionConstraints() {
    if (app.tool.currentStep == 'selectReference') {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.points.canSelect = true;
    } else {
      app.workspace.selectionConstraints =
        app.fastSelectionConstraints.mousedown_all_shape;
    }
  }
}
