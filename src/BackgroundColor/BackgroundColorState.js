import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Modifier la couleur de fond d'une forme
 */
export class BackgroundColorState extends State {
  constructor() {
    super('background_color', 'Colorier les formes', 'tool');

    this.currentStep = null; // choose-color -> listen-canvas-click
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    setTimeout(() =>
      setTimeout(
        () =>
          (app.workspace.selectionConstraints =
            app.fastSelectionConstraints.click_all_shape)
      )
    );

    window.dispatchEvent(new CustomEvent('open-color-picker'));

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.addEventListener('colorChange', this.handler);
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
    setTimeout(() =>
      setTimeout(
        () =>
          (app.workspace.selectionConstraints =
            app.fastSelectionConstraints.click_all_shape)
      )
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.addEventListener('colorChange', this.handler);
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
        Après avoir choisi une couleur, touchez une forme pour en colorier
        l'intérieur.
      </p>
    `;
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('objectSelected', this.objectSelectedId);
    window.removeEventListener('colorChange', this.handler);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'colorChange') {
      this.setColor(event.detail.color);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  setColor(color) {
    app.workspace.selectedColor = color;
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep != 'listen-canvas-click') return;

    let group = GroupManager.getShapeGroup(shape),
      involvedShapes;
    if (group)
      involvedShapes = group.shapesIds.map(id => ShapeManager.getShapeById(id));
    else involvedShapes = [shape];

    this.actions = [
      {
        name: 'BackgroundColorAction',
        involvedShapesIds: involvedShapes.map(s => s.id),
        selectedColor: app.workspace.selectedColor,
        oldColors: involvedShapes.map(s => s.color),
      },
    ];

    // setOpacity quand transparent
    if (involvedShapes.some(shape => shape.opacity != 1)) {
      this.actions.push({
        name: 'OpacityAction',
        involvedShapesIds: involvedShapes.map(s => s.id),
        opacity: 0.7,
        oldOpacities: involvedShapes.map(s => s.opacity),
      });
    }
    this.executeAction();

    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
