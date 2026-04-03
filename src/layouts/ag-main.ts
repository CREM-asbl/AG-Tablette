import '@components/canvas-container';
import '@components/popups/contextual-popover';
import '@components/popups/notification';
import { bugSend } from '@controllers/Bugs';
import '@layouts/ag-menu';
import { SignalWatcher } from '@lit-labs/signals';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/sync-status-indicator.ts';
import '../components/tool-ui-container.ts';
import { app } from '../controllers/Core/App';
import { OpenFileManager } from '../controllers/Core/Managers/OpenFileManager';
import { activeTool, filename, historyState } from '../store/appState';

@customElement('ag-main')
class AGMain extends SignalWatcher(LitElement) {
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
      grid-template-columns: 250px 1fr;
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
    const currentToolName = activeTool.get();
    const currentTool = currentToolName ? { name: currentToolName } : null;
    const history = historyState.get();
    const currentFilename = filename.get();

    // Update title
    const title = currentFilename || 'AG mobile';
    if (document.title !== title) document.title = title;

    return html`
      <div id="app-view">
        <ag-menu
          id="left-menu"
        >
        </ag-menu>
        <canvas-container
          id="canvas-container"
        ></canvas-container>
        <tool-ui-container></tool-ui-container>
      </div>
      <sync-status-indicator></sync-status-indicator>
      <contextual-popover></contextual-popover>
      <notif-center></notif-center>
      <input
        id="fileSelector"
        accept="${app?.environment?.extensions?.join(',') || ''}"
        type="file"
        style="display: none"
        @change="${(event) => this.handleFileChange(event)}"
      />
      ${this.addModules()} ${this.showZoom()}
    `;
  }

  handleFileChange(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
      window.dispatchEvent(
        new CustomEvent('file-opened', {
          detail: { method: 'old', file: input.files[0] },
        }),
      );
      input.value = '';
    }
  }

  addModules() {
    if (app?.environment?.name === 'Tangram') {
      import('../controllers/Tangram/TangramManager');
      return html`<tangram-manager></tangram-manager>`;
    }
    return html``;
  }

  showZoom() {
    if (activeTool.get() !== 'zoom') return html``;
    import('../controllers/Zoom/zoom-menu');
    return html`<zoom-menu></zoom-menu>`;
  }

  preventZoom(e) {
    const t2 = e.timeStamp;
    const t1 = Number(e.currentTarget.dataset.lastTouch) || t2;
    const dt = t2 - t1;
    const fingers = (e.touches || []).length;
    e.currentTarget.dataset.lastTouch = String(t2);
    if (!dt || dt > 500 || fingers > 1) return;
    e.currentTarget.dataset.lastTouch = null;
    e.preventDefault();
  }

  async firstUpdated() {
    const globalWindow = window as Window & {
      __agNotionsCacheInitialized?: boolean;
      __agOfflineSupportInitialized?: boolean;
    };

    if (!globalWindow.__agNotionsCacheInitialized) {
      globalWindow.__agNotionsCacheInitialized = true;
      const { initializeNotionsCacheBootstrap } = await import('../services/notions-cache-bootstrap');
      initializeNotionsCacheBootstrap().catch((error) => {
        console.warn("Erreur lors de l'initialisation des caches:", error);
      });
    }

    if (!globalWindow.__agOfflineSupportInitialized) {
      globalWindow.__agOfflineSupportInitialized = true;
      const { initializeOfflineSupportBootstrap } = await import('../services/offline-support-bootstrap');
      void initializeOfflineSupportBootstrap();
    }

    if (app.fileToOpen) {
      OpenFileManager.newReadFile(app.fileToOpen);
    }

    window.addEventListener('show-file-selector', () => {
      const input = this.shadowRoot?.querySelector(
        '#fileSelector',
      ) as HTMLInputElement;
      input?.click();
    });

    this.addEventListener('touchstart', this.preventZoom);

    // Clic bouton aide → afficher popup de choix mode d'aide
    window.addEventListener('help-button-clicked', (e) => {
      import('@components/popups/help-mode-chooser');
      const chooserElem = document.createElement('help-mode-chooser');
      // @ts-ignore
      chooserElem.toolname = e.detail.toolname;
      chooserElem.style.display = 'block';
      document.body.appendChild(chooserElem);
    });

    // Gestion du choix utilisateur : guide normal ou mode débutant contextuel
    window.addEventListener('help-mode-choice', async (e) => {
      const { choice, toolname } = e.detail;

      if (choice === 'guide') {
        // Mode normal : ouvrir le guide utilisateur en PDF
        const { openPDFGuide } = await import('@services/PDFGuideService');
        const environment = app.environment?.name || '';
        const tool = toolname || app.tool?.name || '';
        openPDFGuide(environment, tool);
      }
    });

    window.onerror = (a, b, c, d, e) => {
      bugSend(a, b, c, d, e);
      if (location.hostname === 'localhost') return false;
      return true;
    };
  }
}
