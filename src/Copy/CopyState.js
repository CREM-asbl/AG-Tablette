import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { uniqId } from '../Core/Tools/general';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Dupliquer une forme
 */
export class CopyState extends State {
  constructor() {
    super('copy', 'Copier', 'operation');

    this.currentStep = null; // listen-canvas-click -> moving-shape

    //La forme que l'on duplique
    this.selectedShape = null;

    //coordonnées de la souris lorsque la duplication a commencé
    this.startClickCoordinates = null;

    /*
        L'ensemble des formes liées à la forme sélectionnée, y compris la forme
        elle-même
         */
    this.involvedShapes = [];
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Copier';
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Pour copier une forme, appuyez sur la forme et faites glissez votre doigt dans une direction
        sans le relacher. Relachez ensuite votre doigt une fois que la nouvelle forme est à la bonne
        place.<br /><br />
        <b>Attention:</b> si vous appuyez sur une forme puis relachez directement, une copie de la
        forme aura bien été créée, mais à la même position que la forme d'origine. Il y a donc deux
        formes l'une sur l'autre.<br /><br />
        <b>Note:</b> la nouvelle forme créée n'est pas liée d'une manière ou d'une autre avec la
        forme d'origine: il s'agit bien d'une copie complètement indépendante.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';

    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    window.cancelAnimationFrame(this.requestAnimFrameId);
    this.currentStep = 'listen-canvas-click';
    app.removeListener('objectSelected', this.objectSelectedId);
    app.removeListener('canvasmouseup', this.mouseUpId);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;

    let group = GroupManager.getShapeGroup(shape);
    if (group) {
      this.involvedShapesIds = [...group.shapesIds];
      this.involvedShapes = group.shapesIds.map(id => ShapeManager.getShapeById(id));
    } else {
      this.involvedShapesIds = [shape.id];
      this.involvedShapes = [shape];
    }

    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;

    app.removeListener('objectSelected', this.objectSelectedId);
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
    this.currentStep = 'moving-shape';
    this.animate();
  }

  onMouseUp() {
    if (this.currentStep != 'moving-shape') return;

    let translation = app.workspace.lastKnownMouseCoordinates.subCoordinates(
        this.startClickCoordinates,
      ),
      involvedShapesCopies = this.involvedShapes.map(shape => shape.copy()),
      selectedShapeCopy = this.selectedShape.copy();

    involvedShapesCopies.forEach(shape => shape.translate(translation));
    selectedShapeCopy.translate(translation);
    let transformation = getShapeAdjustment(involvedShapesCopies, selectedShapeCopy);
    this.actions = [
      {
        name: 'CopyAction',
        involvedShapesIds: this.involvedShapesIds,
        newShapesIds: this.involvedShapesIds.map(() => uniqId()),
        transformation: translation.addCoordinates(transformation.move),
        createdUsergroupId: uniqId(),
      },
    ];
    if (transformation.rotation != 0) {
      let rotateAction = {
        name: 'RotateAction',
        shapeId: this.actions[0].newShapesIds[
          this.involvedShapesIds.findIndex(idx => idx == this.selectedShape.id)
        ],
        involvedShapesIds: this.actions[0].newShapesIds,
        rotationAngle: transformation.rotation,
      };
      this.actions.push(rotateAction);
    }

    this.executeAction();
    this.restart();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  draw() {
    if (this.currentStep != 'moving-shape') return;

    let transformation = app.workspace.lastKnownMouseCoordinates.subCoordinates(
      this.startClickCoordinates,
    );

    window.dispatchEvent(
      new CustomEvent('draw-group', {
        detail: {
          involvedShapes: this.involvedShapes,
          fct1: s => {
            s.saveCoords = s.coordinates;
            s.coordinates = s.coordinates.addCoordinates(transformation);
          },
          fct2: s => {
            s.coordinates = s.saveCoords;
          },
        },
      }),
    );
  }
}