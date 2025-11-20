import { html, LitElement } from 'lit';
import { tools } from '../../store/tools.js';
import { app } from '../Core/App.js';
import {
  tangramState,
  createWatcher,
  appActions,
} from '../../store/appState.js';
import { setWorkspaceFromObject } from '../Core/Managers/WorkspaceManager.js';
import kit from './tangramShapeKit.json';

export class TangramManager extends LitElement {
  static properties = {
    mode: { type: String },
  };

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
    // Reset via signal is handled by appState.resetAppState() usually,
    // but here we just want to reset local tangram state if needed
    // or if this is called by legacy code.
    // For now, we rely on the watcher to update the UI.
    this.tangramStart();
    this.mode = null;
    this.data = null;
  }

  render() {
    if (this.mode === 'reproduction') {
      import('./SolutionCheckerTool.js');
      return html`<solution-checker-tool
        .data="${this.data}"
      ></solution-checker-tool>`;
    }
    if (this.mode === 'creation') {
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

    // Initialiser avec l'état actuel
    const currentState = tangramState.get();
    if (currentState.mode) {
      this.mode = currentState.mode;
      this.data = currentState.currentFile;
      this.requestUpdate();
    }

    // Surveiller les changements d'état
    this.stopWatcher = createWatcher(tangramState, (newState) => {
      this.mode = newState.mode;
      this.data = newState.currentFile;
      if (newState.mode === null) {
        this.reset();
      }
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    app.tangramCanvasLayer.removeAllObjects();
    if (this.stopWatcher) this.stopWatcher();
  }
}
customElements.define('tangram-manager', TangramManager);
