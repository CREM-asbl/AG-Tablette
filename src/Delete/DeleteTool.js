import { html } from 'lit';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shapes/Shape';
import { Tool } from '../Core/States/Tool';
import { findObjectById, removeObjectById } from '../Core/Tools/general';
import { deleteChildren, deleteChildrenOfDivisionPoint, deleteSubDivisionPoints } from '../GeometryTools/deleteShape';

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
    if (object instanceof Shape) {
      this.mode = 'shape';
      this.involvedShapes = ShapeManager.getAllBindedShapes(object);
      this.userGroup = GroupManager.getShapeGroup(object);
    } else {
      // point
      this.point = object;
      this.mode = 'divisionPoint';
    }
    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  _executeAction() {
    if (this.mode == 'shape') {
      this.involvedShapes.forEach((s) => {
        if (app.environment.name == 'Geometrie')
          deleteChildren(s);
        removeObjectById(s.id);
      });

      if (this.userGroup) {
        GroupManager.deleteGroup(this.userGroup);
      }
    } else if (this.mode == 'divisionPoint') {
      let segment = this.point.segments[0];
      deleteSubDivisionPoints(segment, this.point);
      if (app.environment.name == 'Geometrie')
        deleteChildrenOfDivisionPoint(this.point);
      segment.deletePoint(this.point);
    }
    if (app.environment.name == 'Geometrie') {
      for (let i = 0; i < app.mainCanvasLayer.shapes.length; i++) {
        let s = app.mainCanvasLayer.shapes[i];
        s.points.filter(pt => pt.type != 'divisionPoint').forEach(pt => {
          if (pt.reference && !findObjectById(pt.reference))
            pt.reference = null;
        });
        if (s.geometryObject.geometryPointOnTheFlyChildId && !findObjectById(s.geometryObject.geometryPointOnTheFlyChildId)) {
          deleteChildren(s);
          i--;
        }
      }
    }
  }
}
