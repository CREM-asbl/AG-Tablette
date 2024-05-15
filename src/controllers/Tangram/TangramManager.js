import { app, setState } from '../Core/App';
import { WorkspaceManager } from '../Core/Managers/WorkspaceManager.js';
import { createElem } from '../Core/Tools/general';
import kit from './tangramShapeKit.json';

window.addEventListener('new-window', () => {
  setState({ tangram: { ...app.defaultState.tangram } });
  tangramStart();
});

const tangramStart = () => {
  let tool = app.tools.find(tool => tool.name == 'translate');
  tool.isDisable = true;
  tool = app.tools.find(tool => tool.name == 'color');
  tool.isDisable = true;
  setState({ tools: [...app.tools] })
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
    console.log('initShapes')
    const ws = kit;
    if (!app.tangram.defaultColor) app.tangram.defaultColor = '#006CAA';
    ws.objects.shapesData.forEach(s => {
      s.fillColor = isForCreation ? '#000' : app.tangram.defaultColor;
      s.strokeColor = isForCreation ? '#fff' : '#000';
      s.fillOpacity = isForCreation ? 1 : 0.5;
    });
    WorkspaceManager.setWorkspaceFromObject(ws);
  }
}

window.addEventListener('app-started', tangramStart, { once: true });
