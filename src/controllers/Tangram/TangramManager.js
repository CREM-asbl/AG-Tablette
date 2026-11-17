import { html, LitElement } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { tools } from '../../store/tools.js';
import { app } from '../Core/App.js';
import {
  tangramState,
  appActions,
} from '../../store/appState.js';
import { setWorkspaceFromObject } from '../Core/Managers/WorkspaceManager.js';
import kit from './tangramShapeKit.json';

export class TangramManager extends SignalWatcher(LitElement) {
  tangramStart = async () => {
    const currentTools = tools.get();
    currentTools.find((tool) => tool.name === 'translate').isDisable = true;
    currentTools.find((tool) => tool.name === 'color').isDisable = true;
    tools.set([...currentTools]);
  };

  static async initShapes(isForCreation = false) {
    const ws = kit;
    const zoom = app.workspace.zoomLevel;
    if (!app.tangram.defaultColor) app.tangram.defaultColor = '#006CAA';
    ws.objects.shapesData.forEach((s) => {
      s.fillColor = isForCreation ? '#000' : app.tangram.defaultColor;
      s.strokeColor = isForCreation ? '#fff' : '#000';
      s.fillOpacity = isForCreation ? 1 : 0.5;
    });
    await setWorkspaceFromObject(ws, false);
    if (zoom < app.workspace.zoomLevel) app.workspace.zoomLevel = zoom;
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  readFile(event) {
    const data = event.detail;
    if (data.envName !== 'Tangram') return;
    appActions.setTangramState({
      mode: 'reproduction',
      currentFile: data,
    });
  }

  reset() {
    this.tangramStart();
  }

  render() {
    const state = tangramState.get();
    const mode = state.mode;
    const data = state.currentFile;

    if (mode === 'reproduction') {
      import('./SolutionCheckerTool.js');
      return html`<solution-checker-tool
        .data="${data}"
      ></solution-checker-tool>`;
    }
    if (mode === 'creation') {
      import('./SilhouetteCreatorTool.js');
      return html`<silhouette-creator-tool></silhouette-creator-tool>`;
    }
    if (app.dataLoading) return;
    import('./start-popup.js');
    return html`<start-popup
      @close="${(event) =>
        appActions.setTangramState({ mode: event.target.mode })}"
    ></start-popup>`;
  }

  connectedCallback() {
    super.connectedCallback();
    this.tangramStart();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    app.tangramCanvasLayer.removeAllObjects();
  }
}
customElements.define('tangram-manager', TangramManager);
