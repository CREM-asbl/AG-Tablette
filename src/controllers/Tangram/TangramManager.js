import { app, setState } from '../Core/App';
import { setWorkspaceFromObject } from '../Core/Managers/WorkspaceManager.js';
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

  static async selectLevel() {
    await import('./level-popup');
    createElem('level-popup');
    return new Promise((resolve) =>
      window.addEventListener('tangram-level-selected', (e) => resolve(e.detail)),
    );
  }

  static async initShapes(isForCreation = false) {
    const ws = kit;
    if (!app.tangram.defaultColor) app.tangram.defaultColor = '#006CAA';
    ws.objects.shapesData.forEach(s => {
      s.fillColor = isForCreation ? '#000' : app.tangram.defaultColor;
      s.strokeColor = isForCreation ? '#fff' : '#000';
      s.fillOpacity = isForCreation ? 1 : 0.5;
    });
    setWorkspaceFromObject(ws, false);
    // app.mainCanvasLayer.shapes.forEach(shape => shape.scale(.5))
    window.dispatchEvent(new CustomEvent('refresh'));

  }
}

window.addEventListener('app-started', tangramStart, { once: true });