import { app } from '../App';
import { OpacityAction } from './Actions/Opacity';
import { State } from './State';

/**
 * Modifier l'opacité d'une forme
 */
export class OpacityState extends State {
  constructor() {
    super('opacity');

    this.currentStep = null; // choose-opacity -> listen-canvas-click
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Opacité";
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
    this.actions = [new OpacityAction(this.name)];

    this.currentStep = 'choose-opacity';

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    app.appDiv.shadowRoot.querySelector('opacity-popup').style.display = 'block';
    app.appDiv.cursor = 'default';
  }

  setOpacity(opacity) {
    this.actions[0].opacity = opacity;
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.actions[0].shapeId = shape.id;
    let group = app.workspace.getShapeGroup(shape),
      involvedShapes = [shape];
    if (group) involvedShapes = [...group.shapes];
    this.actions[0].involvedShapesIds = involvedShapes.map(s => s.id);

    this.executeAction();
    let opacity = this.actions[0].opacity;
    this.setOpacity(opacity);

    app.drawAPI.askRefresh();
  }
}
