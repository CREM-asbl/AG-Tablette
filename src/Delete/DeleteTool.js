import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit-element';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';

/**
 * Supprimer une forme (et supprime le groupe dont la forme faisait partie s'il
 * ne restait que 2 formes dans le groupe)
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
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Touchez une forme pour la supprimer de l'espace de travail.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
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
      'vertex',
    ];
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme ou un point a été sélectionné (click)
   * @param  {Object} object            La forme ou le point sélectionné
   */
  objectSelected(object) {
    if (object instanceof Shape) {
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
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'start' } });
  }

  _executeAction() {
    if (this.mode == 'shape') {
      this.involvedShapes.forEach((s) => {
        // if (userGroup) userGroup.deleteShape(s.id);
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
}