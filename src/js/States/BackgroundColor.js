import { app } from '../App';
import { BackgroundColorAction } from './Actions/BackgroundColor';
import { OpacityAction } from './Actions/Opacity';
import { State } from './State';

/**
 * Modifier la couleur de fond d'une forme
 */
export class BackgroundColorState extends State {
  constructor() {
    super('background_color');

    this.currentStep = null; // choose-color -> listen-canvas-click
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Colorier les formes";
      return `
            <h2>${toolName}</h2>
            <p>
                Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
                Après avoir choisi une couleur, touchez une forme pour en
                colorier le fond.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start(callColorPicker = true) {
    this.actions = [new BackgroundColorAction(this.name), new OpacityAction(this.name)];
    this.currentStep = 'choose-color';

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    if (callColorPicker) app.appDiv.shadowRoot.querySelector('#color-picker-label').click();

    app.appDiv.cursor = 'default';
  }

  setOpacity(opacity) {
    this.actions[1].opacity = opacity;
    this.currentStep = 'listen-canvas-click';
  }

  setColor(color) {
    this.actions[0].selectedColor = color;
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.actions[0].shapeId = shape.id;
    let group = app.workspace.getShapeGroup(shape),
      involvedShapesIds = group ? group.shapesIds : [shape.id];

    this.actions[0].involvedShapesIds = involvedShapesIds;

    this.executeAction();
    let color = this.actions[0].selectedColor;
    this.start(false);
    this.setColor(color);

    // setOpacity quand transparent

    this.actions[1].shapeId = shape.id;

    this.actions[1].involvedShapesIds = involvedShapesIds;

    if (shape.opacity == 0) {
      this.setOpacity(0.7);
      this.executeAction();
    }

    app.drawAPI.askRefresh();
  }
}
