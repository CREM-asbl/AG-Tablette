import { app } from '../App';
import { State } from './State';
import { GroupManager } from '../GroupManager';
import { ShapeManager } from '../ShapeManager';

/**
 * Modifier l'opacité d'une forme
 */
export class OpacityState extends State {
  constructor() {
    super('opacity', 'Opacité', 'tool');

    this.currentStep = null; // choose-opacity -> listen-canvas-click
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Opacité';
    return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil
                permet de définir pour chaque forme si elle est transparente,
                semi-transparente ou complètement opaque.<br />
            	Après avoir choisit l'une de ces 3 options dans le menu, touchez
                une forme pour lui appliquer la modification.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.currentStep = 'choose-opacity';

    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
    );

    window.dispatchEvent(new CustomEvent('open-opacity-popup'));
    // app.appDiv.shadowRoot.querySelector('opacity-popup').style.display = 'block';

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.addEventListener('setOpacity', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart(manualRestart = false) {
    this.end();
    if (manualRestart) {
      this.start();
      return;
    }
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.addEventListener('setOpacity', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('objectSelected', this.objectSelectedId);
    window.removeEventListener('setOpacity', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else if (event.type == 'setOpacity') {
      this.setOpacity(event.detail.opacity);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  setOpacity(opacity) {
    this.opacity = opacity;
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(shape, mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    let group = GroupManager.getShapeGroup(shape),
      involvedShapes;
    if (group) involvedShapes = group.shapesIds.map(id => ShapeManager.getShapeById(id));
    else involvedShapes = [shape];

    this.actions = [
      {
        name: 'OpacityAction',
        involvedShapesIds: involvedShapes.map(s => s.id),
        opacity: this.opacity,
        oldOpacities: involvedShapes.map(s => s.opacity),
      },
    ];
    this.executeAction();

    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
