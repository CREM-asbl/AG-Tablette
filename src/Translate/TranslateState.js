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

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.currentStep = 'listen-canvas-click';

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('canvasMouseDown', this.mouseDownId);
    app.removeListener('canvasmousemove', this.mouseMoveId);
    app.removeListener('canvasMouseUp', this.mouseUpId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'canvasMouseDown') {
      this.canvasMouseDown();
    } else if (event.type == 'canvasmousemove') {
      this.onMouseMove();
    } else if (event.type == 'canvasMouseUp') {
      this.canvasMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  canvasMouseDown() {
    if (this.currentStep != 'listen-canvas-click') return;

    this.startClickCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.startOffset = new Coordinates(app.workspace.translateOffset);
    this.currentStep = 'translating-plane';

    this.mouseMoveId = app.addListener('canvasmousemove', this.handler);
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  onMouseMove() {
    if (this.currentStep != 'translating-plane') return;

    let newOffset = app.workspace.translateOffset.add(
      app.workspace.lastKnownMouseCoordinates
        .substract(this.startClickCoordinates)
        .multiply(app.workspace.zoomLevel),
    );

    app.workspace.setTranslateOffset(newOffset);
    app.workspace.setTranslateOffset(this.startOffset, false);
  }

  canvasMouseUp() {
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
