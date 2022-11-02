import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Shape } from '../Core/Objects/Shapes/Shape';
import { Tool } from '../Core/States/Tool';

/**
 * Modifier la couleur
 */
export class ColorTool extends Tool {
  constructor() {
    super('color', 'Colorier', 'tool');
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
        <!-- Après avoir choisi une couleur, touchez une figure pour en colorier les
        bords. -->
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    this.mustPreventNextClick = false;
    this.removeListeners();

    // this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
    this.longPressId = app.addListener('canvasLongPress', this.handler);
    this.mouseClickId = app.addListener('canvasClick', this.handler);
  }

  end() {
    this.removeListeners();
  }

  canvasLongPress() {
    let mouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.clickType = 'long';
    this.getConstraints();

    let object = SelectManager.selectObject(mouseCoordinates);
    if (object) {
      this.object = object;
      this.executeAction();
    }
    this.mustPreventNextClick = true;
  }

  canvasClick() {
    if (this.mustPreventNextClick) {
      this.mustPreventNextClick = false;
      return;
    }
    let mouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.clickType = 'normal';
    this.getConstraints();

    let object = SelectManager.selectObject(mouseCoordinates);
    if (object) {
      if (object instanceof Segment && object.shape instanceof LineShape)
        object = object.shape;
      this.object = object;
      this.executeAction();
    }
  }

  getConstraints() {
    let constraints = SelectManager.getEmptySelectionConstraints();
    constraints.shapes.canSelect = true;
    if (this.clickType == 'normal') {
      constraints.segments.canSelect = true;
      constraints.segments.blockHidden = true; // sûr ?
      constraints.points.canSelect = true;
      constraints.points.blockHidden = true; // sûr ?
      constraints.points.numberOfObjects = 'allSuperimposed';
    }
    app.workspace.selectionConstraints = constraints;
  }

  objectSelected(shape) {
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);

    this.executeAction();
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'listen' },
    });
  }

  _executeAction() {
    if (this.clickType == 'normal') {
      if (this.object instanceof Shape) {
        let involvedShapes = ShapeManager.getAllBindedShapes(this.object);
        let mustChangeOpacity = false;
        if (
          involvedShapes.some((s) => {
            return s.fillOpacity != 1;
          })
        ) {
          mustChangeOpacity = true;
        }
        involvedShapes.forEach(s => {
          if (s instanceof LineShape && !s.segments[0].isArc()) {
            s.strokeColor = app.settings.drawColor;
          } else {
            if (mustChangeOpacity)
            s.fillOpacity = 0.7;
            s.fillColor = app.settings.drawColor;
          }
        });
      } else if (this.object instanceof Segment) {
        this.object.color = app.settings.drawColor;
      } else {
        this.object.forEach(obj => obj.color = app.settings.drawColor);
      }
    } else if (this.clickType == 'long') {
      let involvedShapes = ShapeManager.getAllBindedShapes(this.object);
      involvedShapes.forEach(s => {
        s.strokeColor = app.settings.drawColor;
        // s.segments.forEach(seg => seg.color = app.settings.drawColor);
      });
    }
  }
}
