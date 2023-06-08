import { app, setState } from '../Core/App';
import { WorkspaceManager } from '../Core/Managers/WorkspaceManager';
import { createElem } from '../Core/Tools/general';

window.addEventListener('app-started', () => {
  if (!app.fileFromServer) {
    tangramStart();
  }
}, {once: true});

window.addEventListener('new-window', () => {
  setState({ tangram: {...app.defaultState.tangram } });
  tangramStart();
});

const tangramStart = () => {
  setTimeout(() => {
    let tool = app.tools.find(tool => tool.name == 'translate');
    tool.isVisible = false;
    tool = app.tools.find(tool => tool.name == 'color');
    tool.isVisible = false;

    setState({
      tools: [...app.tools],
    })
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

  static async loadKit() {
    const response = await fetch('data/Tangram/tangramShapeKit.json');
    return response.text();
  }

  static async initShapes(isForCreation = false) {
    if (!TangramManager.kit)
      TangramManager.kit = await TangramManager.loadKit();
    const ws = JSON.parse(this.kit);
    if (isForCreation) {
      ws.objects.shapesData.forEach(s => {
        s.fillColor = '#000';
        s.strokeColor = '#fff';
        s.fillOpacity = 1;
      });
    }
    // OpenFileManager.transformToNewIdSystem(ws.objects, 'main');
    WorkspaceManager.setWorkspaceFromObject(ws);
  }
}
