import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { NewShape } from '../Core/Objects/Shapes/NewShape';

/**
 * Supprimer une figure (et supprime le groupe dont la figure faisait partie s'il
 * ne restait que 2 figures dans le groupe)
 */
export class DeleteTool extends Tool {
  constructor() {
    super('delete', 'Supprimer', 'tool');
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
        Touchez une figure pour la supprimer de l'espace de travail.
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
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
  }

  setSelectionConstraints() {
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.shapes.canSelect = true;
    app.workspace.selectionConstraints.points.canSelect = true;
    app.workspace.selectionConstraints.points.types = [
      'divisionPoint',
    ];
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une figure ou un point a été sélectionné (click)
   * @param  {Object} object            La figure ou le point sélectionné
   */
  objectSelected(object) {
    if (object instanceof NewShape) {
      this.mode = 'shape';
      this.involvedShapes = ShapeManager.getAllBindedShapes(object, true);
      this.userGroup = GroupManager.getShapeGroup(object);
    } else {
      // point
      if (object.type == 'divisionPoint') {
        this.point = object;
        this.mode = 'divisionPoint';
      } else {
        if (object.shape.isCircle()) {
          this.point = object;
          this.mode = 'vertex';
        }
      }
    }
    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  _executeAction() {
    if (this.mode == 'shape') {
      this.involvedShapes.forEach((s) => {
        // if (userGroup) userGroup.deleteShape(s.id);
        app.mainDrawingEnvironment.shapes.forEach(s2 => {
          s2.geometryObject.geometryChildShapeIds = s2.geometryObject.geometryChildShapeIds.filter(id => id != s.id);
        });
        this.deleteChildren(s);
        app.mainDrawingEnvironment.removeObjectById(s.id, 'shape');
      });

      if (this.userGroup) {
        GroupManager.deleteGroup(this.userGroup);
      }
    } else if (this.mode == 'divisionPoint') {
      // point
      let segment = this.point.segments[0];
      segment.deletePoint(this.point);
    } else if (this.mode == 'vertex') {
      // point
      this.point.visible = false;
    }
  }

  deleteChildren(shape) {
    shape.geometryTransformationChildShapeIds.forEach(childId => {
      let child = app.mainDrawingEnvironment.findObjectById(childId);
      if (child) {
        this.deleteChildren(child);
      }
    });
    app.mainDrawingEnvironment.removeObjectById(shape.id, 'shape');
  }
}
