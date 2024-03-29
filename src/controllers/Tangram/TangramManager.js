import { app, setState } from '../Core/App';
import { WorkspaceManager } from '../Core/Managers/WorkspaceManager';
import { createElem } from '../Core/Tools/general';
import kit from './tangramShapeKit.json';

window.addEventListener('app-started', () => {
  if (!app.fileFromServer) {
    tangramStart();
  }
}, { once: true });

window.addEventListener('new-window', () => {
  setState({ tangram: { ...app.defaultState.tangram } });
  tangramStart();
});

const tangramStart = () => {
  setTimeout(() => {
    let tool = app.tools.find(tool => tool.name == 'translate');
    tool.isDisable = true;
    tool = app.tools.find(tool => tool.name == 'color');
    tool.isDisable = true;
    setState({ tools: [...app.tools], })
  }, 30);

  import('./start-popup.js');
  createElem('start-popup');
}

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

  static async initShapes(isForCreation = false) {
    const ws = kit;
    if (isForCreation) {
      ws.objects.shapesData.forEach(s => {
        s.fillColor = '#000';
        s.strokeColor = '#fff';
        s.fillOpacity = 1;
      });
    }
    WorkspaceManager.setWorkspaceFromObject(ws);
  }
}
