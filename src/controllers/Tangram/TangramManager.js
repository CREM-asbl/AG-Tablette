import { app, setState } from '../Core/App';
import { WorkspaceManager } from '../Core/Managers/WorkspaceManager';
import { Silhouette } from '../Core/Objects/Silhouette.js';
import { createElem } from '../Core/Tools/general';
import { SolutionCheckerTool } from './SolutionCheckerTool.js';
import kit from './tangramShapeKit.json';

window.addEventListener('app-started', () => {
  console.log('app-started')
  if (!app.fileFromServer) {
    tangramStart();
  }
}, { once: true });

window.addEventListener('new-window', () => {
  setState({ tangram: { ...app.defaultState.tangram } });
  tangramStart();
});

window.addEventListener('file-parsed', async (e) => {
  console.log('tangram file-parsed')
  TangramManager.closeForbiddenCanvas();
  app.tangramCanvasLayer.removeAllObjects();
  const data = e.detail;
  const level = data.tangramLevelSelected ? data.tangramLevelSelected : await TangramManager.selectLevel();
  if (data.fileExtension == 'ags')
    await TangramManager.initShapes();
  if (level == 3 || level == 4) {
    await TangramManager.openForbiddenCanvas();
  }
  let backObjects = data.wsdata.backObjects,
    isSilhouetteShown = false;
  if (backObjects) {
    Silhouette.initFromObject(backObjects, level);
    app.tangramCanvasLayer.redraw();
    isSilhouetteShown = true;
  }

  let tool = app.tools.find(tool => tool.name == 'translate');
  tool.isDisable = true;
  tool = app.tools.find(tool => tool.name == 'color');
  tool.isDisable = false;

  setState({
    tangram: { ...app.defaultState.tangram, isSilhouetteShown, level },
  });

  if (app.history.startSituation == null) {
    setState({
      history: {
        ...app.defaultState.history,
        startSituation: {
          ...app.workspace.data,
          tangram: {
            isSilhouetteShown: true,
            currentStep: 'start'
          }
        },
        startSettings: { ...app.settings },
      },
    });
  }
  new SolutionCheckerTool()
});

const tangramStart = () => {
  console.log('Tangram started');
  let tool = app.tools.find(tool => tool.name == 'translate');
  tool.isDisable = true;
  tool = app.tools.find(tool => tool.name == 'color');
  tool.isDisable = true;
  setState({ tools: [...app.tools], })
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
