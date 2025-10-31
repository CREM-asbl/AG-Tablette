import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shapes/Shape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { addInfoToId, findObjectById } from '../Core/Tools/general';

/**
 * Cacher des objets.
 */
export class HideTool extends Tool {
  constructor() {
    super('hide', 'Cacher', 'tool');
  }

  getHelpText() {
    const toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    // this.showHidden();
    this.removeListeners();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.shapes.canSelect = true;
    app.workspace.selectionConstraints.points.canSelect = true;
    app.workspace.selectionConstraints.points.types = [
      'divisionPoint',
    ];
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  end() {
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
  }

  objectSelected(object) {
    if (!object) return;

    if (object instanceof Shape) {
      this.mode = 'shape';
      this.involvedShapes = ShapeManager.getAllBindedShapes(object);
    } else {
      // point
      this.point = object;
      this.mode = 'divisionPoint';
    }

    this.executeAction();
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'listen' },
    });
  }

  _executeAction() {
    if (this.mode == 'shape') {
      const workingShapes = this.involvedShapes.map((s) => findObjectById(addInfoToId(s.id, 'main')));
      workingShapes.forEach((s) => {
        s.geometryObject.geometryIsHidden = true;
      });
      app.mainCanvasLayer.shapes.forEach(s => {
        if (s instanceof SinglePointShape) {
          const child = findObjectById(s.geometryObject.geometryPointOnTheFlyChildId);
          if (child)
            s.geometryObject.geometryIsHidden = child.geometryObject.geometryIsHidden;
        }
      });
      app.mainCanvasLayer.shapes.forEach(s => {
        if (s.geometryObject.geometryIsConstaintDraw) {
          const child = findObjectById(s.geometryObject.geometryChildShapeIds[0]);
          if (child)
            s.geometryObject.geometryIsHidden = child.geometryObject.geometryIsHidden;
        }
      });
    } else if (this.mode == 'divisionPoint') {
      this.point.geometryIsHidden = true;
    }
  }
}
