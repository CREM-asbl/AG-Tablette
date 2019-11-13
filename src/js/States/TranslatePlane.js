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
    this.actions = [new TranslatePlaneAction(this.name)];

    this.currentStep = 'listen-canvas-click';

    this.startClickCoordinates = null;
    app.appDiv.cursor = 'grab';
  }

  abort() {
    this.start();
  }

  onMouseDown(clickCoordinates, event) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.startClickCoordinates = clickCoordinates;
    this.currentStep = 'translating-plane';
    app.appDiv.cursor = 'grabbing';
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
}
