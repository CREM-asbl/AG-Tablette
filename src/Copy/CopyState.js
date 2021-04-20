import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { uniqId } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Shape } from '../Core/Objects/Shape';

/**
 * Dupliquer une forme
 */
export class CopyState extends State {
  constructor() {
    super('copy', 'Copier', 'operation');

    this.currentStep = null; // listen-canvas-click -> moving-shape

    //coordonnées de la souris lorsque la duplication a commencé
    this.startClickCoordinates = null;

    /*
        L'ensemble des formes liées à la forme sélectionnée, y compris la forme
        elle-même
         */
    this.involvedShapes = [];

    this.translateOffset = new Coordinates({ x: -20, y: -20 });
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
        Pour copier une forme, appuyez sur la forme et faites glissez votre
        doigt dans une direction sans le relacher. Relachez ensuite votre doigt
        une fois que la nouvelle forme est à la bonne place.<br /><br />
        <b>Attention:</b> si vous appuyez sur une forme puis relachez
        directement, une copie de la forme aura bien été créée, mais à la même
        position que la forme d'origine. Il y a donc deux formes l'une sur
        l'autre.<br /><br />
        <b>Note:</b> la nouvelle forme créée n'est pas liée d'une manière ou
        d'une autre avec la forme d'origine: il s'agit bien d'une copie
        complètement indépendante.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';

    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.mousedown_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.mousedown_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.stopAnimation();
    this.currentStep = 'listen-canvas-click';
    app.removeListener('objectSelected', this.objectSelectedId);
    app.removeListener('canvasmouseup', this.mouseUpId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.lastKnownMouseCoordinates = this.startClickCoordinates;

    this.involvedShapes.sort((s1, s2) => ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2));
    this.drawingShapes = this.involvedShapes.map(s => {
      let newShape = new Shape({
        ...s,
        drawingEnvironment: app.upperDrawingEnvironment,
        path: s.getSVGPath('no scale'),
        id: undefined,
      });
      newShape.translate(this.translateOffset);
      return newShape;
    });

    this.currentStep = 'moving-shape';
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
    window.dispatchEvent(new CustomEvent('refresh'));
    this.animate();
  }

  onMouseUp() {
    if (this.currentStep != 'moving-shape') return;

    let translation = app.workspace.lastKnownMouseCoordinates
      .substract(this.startClickCoordinates)
      .add(this.translateOffset);

    this.involvedShapesIds = this.involvedShapes.map(s => s.id);
    this.actions = [
      {
        name: 'CopyAction',
        involvedShapesIds: this.involvedShapesIds,
        newShapesIds: this.involvedShapesIds.map(() => uniqId()),
        transformation: translation,
        createdUsergroupId: uniqId(),
      },
    ];

    this.executeAction();
    this.restart();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() {
    if (this.currentStep != 'moving-shape') {
      app.upperDrawingEnvironment.removeAllObjects();
    } else {
      let transformation = app.workspace.lastKnownMouseCoordinates.substract(
        this.lastKnownMouseCoordinates
      );

      this.drawingShapes.forEach(s => s.translate(transformation));

      this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    }
  }
}
