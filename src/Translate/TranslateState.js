import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';

/**
 * Faire translater le plan
 */
export class TranslateState extends State {
  constructor() {
    super('translate', 'Déplacer le plan', 'tool');

    this.currentStep = null; // listen-canvas-click -> translating-plane

    this.startClickCoordinates = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Glisser le plan';
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Touchez l'écran n'importe où dans la zone de dessin, et faites glissez votre doigt sans le
        relacher, pour faire glisser le plan entier.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';

    this.mouseDownId = app.addListener('canvasmousedown', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.currentStep = 'listen-canvas-click';

    this.mouseDownId = app.addListener('canvasmousedown', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('canvasmousedown', this.mouseDownId);
    app.removeListener('canvasmousemove', this.mouseMoveId);
    app.removeListener('canvasmouseup', this.mouseUpId);
  }

  _actionHandle(event) {
    if (event.type == 'canvasmousedown') {
      this.onMouseDown(event.detail.mousePos);
    } else if (event.type == 'canvasmousemove') {
      this.onMouseMove(event.detail.mousePos);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp(event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  onMouseDown(mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.startClickCoordinates = mouseCoordinates;
    this.currentStep = 'translating-plane';

    this.mouseMoveId = app.addListener('canvasmousemove', this.handler);
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
  }

  onMouseMove(mouseCoordinates) {
    if (this.currentStep != 'translating-plane') return;
    let factor = app.workspace.zoomLevel,
      saveOffset = app.workspace.translateOffset,
      clickDiff = mouseCoordinates
        .subCoordinates(this.startClickCoordinates)
        .multiplyWithScalar(factor),
      offset = saveOffset.addCoordinates(clickDiff);

    app.workspace.setTranslateOffset(offset);
    app.workspace.setTranslateOffset(saveOffset, false);
  }

  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'translating-plane') return;

    let factor = app.workspace.zoomLevel;
    this.actions = [
      {
        name: 'TranslatePlaneAction',
        offset: mouseCoordinates
          .subCoordinates(this.startClickCoordinates)
          .multiplyWithScalar(factor),
      },
    ];
    this.executeAction();
    this.restart();
  }
}
