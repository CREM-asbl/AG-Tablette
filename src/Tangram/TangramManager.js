import { app, setState } from '../Core/App';
import { OpenFileManager } from '../Core/Managers/OpenFileManager';
import { WorkspaceManager } from '../Core/Managers/WorkspaceManager';
import { createElem } from '../Core/Tools/general';

const serverURL = 'https://api.crem.be/';

window.addEventListener('new-window', () => setState({ tangram: {...app.defaultState.tangram } }));

export class TangramManager {
  static async openForbiddenCanvas() {
    await import('./forbidden-canvas.js');
    createElem('forbidden-canvas');
    return new Promise((resolve) =>
      window.addEventListener('forbidden-canvas-drawn', (e) => resolve(e.detail)),
    );
  }

  static closeForbiddenCanvas() {
    window.dispatchEvent(new Event('close-forbidden-canvas'));
  }

  static async selectLevel() {
    await import('./level-popup');
    createElem('level-popup');
    return new Promise((resolve) =>
      window.addEventListener('tangram-level-selected', (e) => resolve(e.detail)),
    );
  }

  static removeSilhouette() {
    app.tangramCanvasLayer.removeAllObjects();
    TangramManager.closeForbiddenCanvas();
    window.dispatchEvent(new CustomEvent('refresh-background'));
  }

  static async loadKit() {
    const response = await fetch('data/Tangram/tangramShapeKit.json');
    return response.text();
  }

  static async initShapes() {
    if (!TangramManager.kit)
      TangramManager.kit = await TangramManager.loadKit();
    const ws = JSON.parse(this.kit);
    OpenFileManager.transformToNewIdSystem(ws.objects, 'main');
    WorkspaceManager.setWorkspaceFromObject(ws);
  }
}
