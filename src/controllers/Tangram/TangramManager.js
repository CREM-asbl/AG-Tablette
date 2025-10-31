import { html, LitElement } from 'lit';
import { tools } from '../../store/tools.js';
import { app, setState } from '../Core/App.js';
import { setWorkspaceFromObject } from '../Core/Managers/WorkspaceManager.js';
import kit from './tangramShapeKit.json';



export class TangramManager extends LitElement {

  static properties = {
    mode: { type: String }
  }

  tangramStart = async () => {
    const currentTools = tools.get()
    currentTools.find(tool => tool.name == 'translate').isDisable = true;
    currentTools.find(tool => tool.name == 'color').isDisable = true;
    tools.set([...currentTools]);
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
    await setWorkspaceFromObject(ws, false);
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
    this.data = null;
  }

  render() {
    if (window.dev_mode) console.log('render', this.mode);
    if (this.mode === 'reproduction') {
      import('./SolutionCheckerTool.js');
      return html`<solution-checker-tool .data="${this.data}"></solution-checker-tool>`
    }
    if (this.mode === 'creation') {
      import('./SilhouetteCreatorTool.js');
      return html`<silhouette-creator-tool></silhouette-creator-tool>`
    }
    if (app.dataLoading) return
    import('./start-popup.js');
    return html`<start-popup @close="${event => this.mode = event.target.mode}"></start-popup>`
  }

  connectedCallback() {
    super.connectedCallback();
    this.tangramStart()
    this.resetListener = app.addListener('new-window', this.reset.bind(this));
    this.fileListener = app.addListener('file-parsed', this.readFile.bind(this))
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    app.tangramCanvasLayer.removeAllObjects();
    app.removeListener('new-window', this.resetListener);
    app.removeListener('file-parsed', this.fileListener)
  }
}
customElements.define('tangram-manager', TangramManager);