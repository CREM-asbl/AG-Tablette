import { app, setState } from '../Core/App';
import { OpenFileManager } from '../Core/Managers/OpenFileManager';
import { WorkspaceManager } from '../Core/Managers/WorkspaceManager';
import { createElem } from '../Core/Tools/general';

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

  static async selectLevel(level) {
    await import('./level-popup');
    let elem = createElem('level-popup');
    if (level)
      elem.level = level;
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
