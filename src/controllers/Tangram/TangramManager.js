import { html, LitElement } from 'lit';
import { app, setState } from '../Core/App.js';
import { setWorkspaceFromObject } from '../Core/Managers/WorkspaceManager.js';
import kit from './tangramShapeKit.json';



export class TangramManager extends LitElement {

  static properties = {
    mode: { type: String }
  }

  tangramStart = async () => {
    let tool = app.tools.find(tool => tool.name == 'translate');
    tool.isDisable = true;
    tool = app.tools.find(tool => tool.name == 'color');
    tool.isDisable = true;
    setState({ tools: [...app.tools] })
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

  readFile(event) {
    this.data = event.detail;
    if (this.data.envName != 'Tangram') return
    this.mode = 'reproduction'
    this.requestUpdate()
  }

  reset() {
    setState({ tangram: { ...app.defaultState.tangram } });
    this.tangramStart();
    this.mode = null;
  }

  render() {
    if (this.mode === 'reproduction') {
      import('./SolutionCheckerTool.js');
      return html`<solution-checker-tool .data="${this.data}"></solution-checker-tool>`
    }
    if (this.mode === 'creation') {
      import('./SilhouetteCreatorTool.js');
      return html`<silhouette-creator-tool></silhouette-creator-tool>`
    }
    import('./start-popup.js');
    return html`<start-popup @close="${event => this.mode = event.target.mode}"></start-popup>`
  }

  connectedCallback() {
    super.connectedCallback();
    this.tangramStart()
    this.resetListener = app.addListener('new-window', this.reset.bind(this));
    this.fileListener = app.addListener('file-parsed', this.readFile.bind(this))
    console.log(app.workspace.data, app.tangram)
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    app.tangramCanvasLayer.removeAllObjects();
    app.removeListener('new-window', this.resetListener);
    app.removeListener('file-parsed', this.fileListener)
  }
}
customElements.define('tangram-manager', TangramManager);