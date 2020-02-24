import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { Shape } from '../Objects/Shape';
import { GroupManager } from '../Managers/GroupManager';
import { ShapeManager } from '../Managers/ShapeManager';
import { html } from 'lit-element';

/**
 * Supprimer une forme (et supprime le groupe dont la forme faisait partie s'il
 * ne restait que 2 formes dans le groupe)
 */
export class DeleteState extends State {
  constructor() {
    super('delete', 'Supprimer une forme', 'tool');
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Supprimer une forme';
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
    setTimeout(() => {
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.shapes.canSelect = true;
      app.workspace.selectionConstraints.points.canSelect = true;
      app.workspace.selectionConstraints.points.types = ['segmentPoint'];
    });

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
    setTimeout(() => {
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.shapes.canSelect = true;
      app.workspace.selectionConstraints.points.canSelect = true;
      app.workspace.selectionConstraints.points.types = ['segmentPoint'];
    });

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme ou un point a été sélectionné (click)
   * @param  {Object} object            La forme ou le point sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(object, mouseCoordinates) {
    if (object instanceof Shape) {
      let userGroup = GroupManager.getShapeGroup(object),
        involvedShapes;
      if (userGroup) involvedShapes = userGroup.shapesIds.map(id => ShapeManager.getShapeById(id));
      else involvedShapes = [object];

      this.actions = [
        {
          name: 'DeleteAction',
          mode: 'shape',
          involvedShapes: involvedShapes,
          involvedShapesIndexes: involvedShapes.map(s => ShapeManager.getShapeIndex(s)),
        },
      ];
      if (userGroup) {
        this.actions[0].userGroup = userGroup;
        this.actions[0].userGroupIndex = GroupManager.getGroupIndex(userGroup);
      }
    } else {
      // point

      this.actions = [
        {
          name: 'DeleteAction',
          mode: 'point',
          point: object,
        },
      ];
    }
    this.executeAction();

    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
