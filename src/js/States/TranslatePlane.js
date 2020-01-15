import { app } from '../App';
import { State } from './State';

/**
 * Faire translater le plan
 */
export class TranslatePlaneState extends State {
  constructor() {
    super('translate_plane');

    this.currentStep = null; // listen-canvas-click -> translating-plane

    this.startClickCoordinates = null;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';

    window.addEventListener('canvasmousedown', this.handler);
  }

  restart() {
    this.end();
    this.currentStep = 'listen-canvas-click';

    window.addEventListener('canvasmousedown', this.handler);
  }

  end() {
    window.removeEventListener('canvasmousedown', this.handler);
    window.removeEventListener('canvasmousemove', this.handler);
    window.removeEventListener('canvasmouseup', this.handler);
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

    window.addEventListener('canvasmousemove', this.handler);
    window.addEventListener('canvasmouseup', this.handler);
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
