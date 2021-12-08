import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';

/**
 */
export class CentralSymetryTool extends Tool {
  constructor() {
    super('centralSymetry', 'Symétrie centrale', 'transformation');
  }

  /**
   * initialiser l'état
   */
  start() {
    this.removeListeners();

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  selectReference() {
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    this.reference = null;

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
      this.reference = object;
      new Point({
        coordinates: this.reference.coordinates,
        drawingEnvironment: app.upperDrawingEnvironment,
        color: app.settings.referenceDrawColor,
        size: 2,
      });
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
    } else {
      this.involvedShapes = ShapeManager.getAllBindedShapes(object, true);
      // this.animate();
      this.executeAction();
    }
  }

  _executeAction() {
    this.involvedShapes.forEach(s => {
      let newShape = new Shape({
        ...s,
        drawingEnvironment: app.mainDrawingEnvironment,
        id: undefined,
        path: s.getSVGPath('no scale'),
        geometryTransformationCharacteristicElementIds: [this.reference.id],
        geometryTransformationParentShapeId: s.id,
        geometryTransformationChildShapeIds: [],
        geometryTransformationName: 'centralSymetry',
      });
      s.geometryTransformationChildShapeIds.push(newShape.id);
      let ref = app.mainDrawingEnvironment.findObjectById(newShape.geometryTransformationCharacteristicElementIds[0], 'point');
      if (!ref.shape.geometryTransformationChildShapeIds.includes(newShape.id)) {
        ref.shape.geometryTransformationChildShapeIds.push(newShape.id);
      }
      newShape.rotate(Math.PI, this.reference.coordinates);
    });
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
