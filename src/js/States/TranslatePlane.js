import { app } from '../App';
import { TranslatePlaneAction } from './Actions/TranslatePlane';
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
   * (ré-)initialiser l'état
   */
  start() {
    this.end();
    this.actions = [new TranslatePlaneAction(this.name)];

    this.currentStep = 'listen-canvas-click';

    this.startClickCoordinates = null;
    app.appDiv.cursor = 'grab';
    window.addEventListener('canvasmousedown', this.handler);
  }

  abort() {
    this.start();
  }

  end() {
    app.editingShapes = [];
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

  onMouseDown(clickCoordinates, event) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.startClickCoordinates = clickCoordinates;
    this.currentStep = 'translating-plane';
    app.appDiv.cursor = 'grabbing';
    window.addEventListener('canvasmousemove', this.handler);
    window.addEventListener('canvasmouseup', this.handler);
  }

  onMouseMove(clickCoordinates, event) {
    if (this.currentStep != 'translating-plane') return;
    let factor = app.workspace.zoomLevel,
      saveOffset = app.workspace.translateOffset,
      clickDiff = {
        x: (clickCoordinates.x - this.startClickCoordinates.x) * factor,
        y: (clickCoordinates.y - this.startClickCoordinates.y) * factor,
      },
      offset = {
        x: saveOffset.x + clickDiff.x,
        y: saveOffset.y + clickDiff.y,
      };

    app.workspace.setTranslateOffset(offset);
    app.workspace.setTranslateOffset(saveOffset, false);
  }

  onMouseUp(clickCoordinates, event) {
    if (this.currentStep != 'translating-plane') return;

    let factor = app.workspace.zoomLevel;
    this.actions[0].offset = {
      x: (clickCoordinates.x - this.startClickCoordinates.x) * factor,
      y: (clickCoordinates.y - this.startClickCoordinates.y) * factor,
    };

    this.executeAction();
    this.start();
  }
}
