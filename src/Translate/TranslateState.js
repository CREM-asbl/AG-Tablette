import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { Coordinates } from '../Core/Objects/Coordinates';

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
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Touchez l'écran n'importe où dans la zone de dessin, et faites glissez
        votre doigt sans le relacher, pour faire glisser le plan entier.
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

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'canvasmousedown') {
      this.onMouseDown();
    } else if (event.type == 'canvasmousemove') {
      this.onMouseMove();
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  onMouseDown() {
    if (this.currentStep != 'listen-canvas-click') return;

    this.startClickCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates
    );
    this.startOffset = new Coordinates(app.workspace.translateOffset);
    this.currentStep = 'translating-plane';

    this.mouseMoveId = app.addListener('canvasmousemove', this.handler);
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
  }

  onMouseMove() {
    if (this.currentStep != 'translating-plane') return;

    let newOffset = app.workspace.translateOffset.add(
      app.workspace.lastKnownMouseCoordinates
        .substract(this.startClickCoordinates)
        .multiply(app.workspace.zoomLevel)
    );

    console.log(newOffset);

    app.workspace.setTranslateOffset(newOffset);
    app.workspace.setTranslateOffset(this.startOffset, false);
  }

  onMouseUp() {
    if (this.currentStep != 'translating-plane') return;

    this.actions = [
      {
        name: 'TranslateAction',
        offset: app.workspace.lastKnownMouseCoordinates
          .substract(this.startClickCoordinates)
          .multiply(app.workspace.zoomLevel),
      },
    ];
    this.executeAction();
    this.restart();
  }
}
