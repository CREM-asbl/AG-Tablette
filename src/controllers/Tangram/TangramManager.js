import { app, setState } from '../Core/App';
import { setWorkspaceFromObject } from '../Core/Managers/WorkspaceManager.js';
import { createElem } from '../Core/Tools/general';
import kit from './tangramShapeKit.json';

const tangramStart = () => {
  let tool = app.tools.find(tool => tool.name == 'translate');
  tool.isDisable = true;
  tool = app.tools.find(tool => tool.name == 'color');
  tool.isDisable = true;
  setState({ tools: [...app.tools] })
  import('./start-popup.js');
  createElem('start-popup');
}

window.addEventListener('app-started', tangramStart, { once: true });
window.addEventListener('new-window', () => {
  console.log('new-window tangramManager')
  setState({ tangram: { ...app.defaultState.tangram } });
  tangramStart();
});

export class TangramManager {

  static async selectLevel() {
    await import('./level-popup');
    const popup = createElem('level-popup');
    return new Promise((resolve) => popup.onselect = e => resolve(e.detail))
  }

  static async initShapes(isForCreation = false) {
    const ws = kit;
    const zoom = app.workspace.zoomLevel
    if (!app.tangram.defaultColor) app.tangram.defaultColor = '#006CAA';
    ws.objects.shapesData.forEach(s => {
      s.fillColor = isForCreation ? '#000' : app.tangram.defaultColor;
      s.strokeColor = isForCreation ? '#fff' : '#000';
      s.fillOpacity = isForCreation ? 1 : 0.5;
    });
    setWorkspaceFromObject(ws, false);
    if (zoom < app.workspace.zoomLevel) app.workspace.zoomLevel = zoom;
    window.dispatchEvent(new CustomEvent('refresh'));
  }
}