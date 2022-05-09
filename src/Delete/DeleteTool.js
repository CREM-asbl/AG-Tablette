import { html } from 'lit';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shapes/Shape';
import { Tool } from '../Core/States/Tool';

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
        if (s.name == 'PointOnLine') {
          let segment = app.mainCanvasElem.findObjectById(s.geometryObject.geometryParentObjectId1, 'segment');
          let point = s.points[0];
          this.deleteSubDivisionPoints(segment, point);
        }
        if (app.environment.name == 'Geometrie')
          this.deleteChildren(s);
        app.mainCanvasElem.removeObjectById(s.id, 'shape');
      });

      if (this.userGroup) {
        GroupManager.deleteGroup(this.userGroup);
      }
    } else if (this.mode == 'divisionPoint') {
      // point
      let segment = this.point.segments[0];
      this.deleteSubDivisionPoints(segment, this.point);
      if (app.environment.name == 'Geometrie')
        this.deleteChildrenOfDivisionPoint(this.point);
      segment.deletePoint(this.point);
    } else if (this.mode == 'vertex') {
      // point
      this.point.visible = false;
    }
  }

  deleteSubDivisionPoints(segment, point) {
    segment.divisionPoints.forEach(divPt => {
      if (divPt.endpointIds && divPt.endpointIds.some(endPtId => endPtId == point.id)) {
        this.deleteSubDivisionPoints(segment, divPt);
        if (app.environment.name == 'Geometrie')
          this.deleteChildrenOfDivisionPoint(divPt);
        segment.deletePoint(divPt);
      }
    });
  }

  deleteChildren(shape) {
    app.mainCanvasElem.shapes.forEach(s => {
      s.geometryObject.geometryChildShapeIds = s.geometryObject.geometryChildShapeIds.filter(id => id != shape.id);
    });
    app.mainCanvasElem.shapes.forEach(s => {
      s.geometryObject.geometryTransformationChildShapeIds = s.geometryObject.geometryTransformationChildShapeIds.filter(id => id != shape.id);
    });
    shape.geometryObject.geometryTransformationChildShapeIds.forEach(childId => {
      let child = app.mainCanvasElem.findObjectById(childId);
      if (child) {
        this.deleteChildren(child);
      }
    });
    shape.geometryObject.geometryChildShapeIds.forEach(childId => {
      let child = app.mainCanvasElem.findObjectById(childId);
      if (child) {
        this.deleteChildren(child);
      }
    });
    app.mainCanvasElem.removeObjectById(shape.id, 'shape');
  }

  deleteChildrenOfDivisionPoint(point) {
    let shape = point.shape;
    // let shapesLinked = [];
    shape.geometryObject.geometryChildShapeIds.forEach(childId => {
      let child = app.mainCanvasElem.findObjectById(childId, 'shape');
      if (!child)
        return;
      if (child.vertexes.some(vx => vx.reference == point.id)) {
        if (app.environment.name == 'Geometrie')
          this.deleteChildren(child);
        app.mainCanvasElem.removeObjectById(child.id, 'shape');
      }
    });
  }
}
