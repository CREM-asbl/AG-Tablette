import '@components/canvas-container';
import '@components/popups/notification';
import { bugSend } from '@controllers/Bugs';
import '@layouts/ag-menu';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/sync-status-indicator.ts';
import { app } from '../controllers/Core/App';
import { HistoryManager } from '../controllers/Core/Managers/HistoryManager';
import { OpenFileManager } from '../controllers/Core/Managers/OpenFileManager';
import { createElem } from '../controllers/Core/Tools/general';
import { initializeCachesFromIndexedDB } from '../store/notions';
import '../utils/offline-init.js';

if (app.fileToOpen) OpenFileManager.newReadFile(app.fileToOpen);
initializeCachesFromIndexedDB().catch(error => {
  console.warn('Erreur lors de l\'initialisation des caches:', error);
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        
      })
      .catch(error => {
        console.log('Échec de l\'enregistrement du Service Worker:', error);
      });
  });
}

@customElement('ag-main')
class AGMain extends LitElement {
  @property({ type: Boolean }) canUndo = false;
  @property({ type: Boolean }) canRedo = false;
  @property({ type: String }) background = '';
  @property({ type: Object }) tool = null;
  @property({ type: String }) colorPickerValue = '#000000';
  @property({ type: Boolean }) helpSelected = false;
  @property({ type: String }) filename = '';

  static styles = css`
    #app-view {
      background-color: var(--theme-color-soft);
      display: grid;
      grid-template-columns: 240px 1fr;
      width: 100%;
      margin: 0;
      padding: 0;
      height: 100%;
    }
    #left-menu {
      display: flex;
      gap: 8px;
      flex-direction: column;
      padding: 8px;
      background-color: var(--theme-color);
      scrollbar-width: thin;
      overflow: auto;
    }
    canvas-container {
      width: 100%;
      height: 100%;
    }
    input[type='color'] {
      position: absolute;
      top: 0;
      left: 21dvw;
      border: none;
    }
    h3 {
      padding: 0;
      margin: 0;
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      padding: 8px 0;
      border-radius: 4px;
      background-color: var(--theme-color-soft);
    }
  `;

  render() {
    return html`
      <div id="app-view">
        <ag-menu
          id="left-menu"
          .helpSelected="${this.helpSelected}"
          .tool="${this.tool}"
          .canUndo="${this.canUndo}"
          .canRedo="${this.canRedo}">
        </ag-menu>
        <canvas-container id="canvas-container" .environment="${app.environment}"></canvas-container>
      </div>
  <sync-status-indicator></sync-status-indicator>
      <notif-center></notif-center>
      <input
        id="fileSelector"
        accept="${app.environment.extensions.join(',')}"
        type="file"
        style="display: none"
        @change="${(event) => this.handleFileChange(event)}"
      />
      ${this.addModules()}
      ${this.showZoom()}
    `;
  }

  handleFileChange(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
      window.dispatchEvent(
        new CustomEvent('file-opened', {
          detail: { method: 'old', file: input.files[0] },
        })
      );
      input.value = '';
    }
  }

  addModules() {
    if (app.environment.name === 'Tangram') {
      import('../controllers/Tangram/TangramManager');
      return html`<tangram-manager></tangram-manager>`;
    }
    return html``;
  }

  showZoom() {
    if (app.tool?.name !== 'zoom') return html``;
    import('../controllers/Zoom/zoom-menu');
    return html`<zoom-menu></zoom-menu>`;
  }

  updateProperties() {
    this.helpSelected = app.helpSelected;
    this.filename = app.filename || '';
    document.title = this.filename !== '' ? this.filename : 'AG mobile';
  }

  preventZoom(e) {
    const t2 = e.timeStamp;
    const t1 = Number((e.currentTarget).dataset.lastTouch) || t2;
    const dt = t2 - t1;
    const fingers = (e.touches || []).length;
    (e.currentTarget).dataset.lastTouch = String(t2);
    if (!dt || dt > 500 || fingers > 1) return;
    (e.currentTarget).dataset.lastTouch = null;
    e.preventDefault();
  }

  async firstUpdated() {
    window.addEventListener('show-file-selector', () => {
      const input = this.shadowRoot?.querySelector('#fileSelector') as HTMLInputElement;
      input?.click();
    });
    window.addEventListener('history-changed', () => {
      this.canUndo = HistoryManager.canUndo();
      this.canRedo = HistoryManager.canRedo();
    });
    window.addEventListener('tool-changed', () => {
      this.tool = app.tool;
    });
    this.addEventListener('touchstart', this.preventZoom);
    window.addEventListener('helpToolChosen', (e) => {
      import('@components/popups/help-popup');
      const helpElem = createElem('help-popup');
      // @ts-ignore
      helpElem.toolname = e.detail.toolname;
    });
    window.addEventListener('state-changed', () => {
      this.updateProperties();
      this.requestUpdate();
    });
    window.onerror = (a, b, c, d, e) => {
      bugSend(a, b, c, d, e);
      if (location.hostname === 'localhost') return false;
      return true;
    };
  }
}