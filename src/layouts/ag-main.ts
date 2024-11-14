import '@components/canvas-container';
import '@components/icon-button';
import '@components/popups/notification';
import '@components/template-toolbar';
import '@components/toolbar-kit';
import '@components/toolbar-section';
import { bugSend } from '@controllers/Bugs';
import '@layouts/ag-menu';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { app } from '../controllers/Core/App';
import '../controllers/Core/Managers/FullHistoryManager';
import '../controllers/Core/Managers/GroupManager';
import { HistoryManager } from '../controllers/Core/Managers/HistoryManager';
import { OpenFileManager } from '../controllers/Core/Managers/OpenFileManager';
import '../controllers/Core/Managers/SaveFileManager';
import '../controllers/Core/Managers/SelectManager';
import '../controllers/Core/Managers/ShapeManager';
import '../controllers/Core/Managers/WorkspaceManager';
import { createElem } from '../controllers/Core/Tools/general';

if (app.fileToOpen) OpenFileManager.newReadFile(app.fileToOpen);

@customElement('ag-main')
class AGMain extends LitElement {
  @property({ type: Boolean }) canUndo
  @property({ type: Boolean }) canRedo
  @property({ type: String }) background
  @property({ type: Object }) tool
  @property({ type: String }) colorPickerValue = '#000000'
  @property({ type: Boolean }) helpSelected
  @property({ type: String }) filename

  static styles =
    css`
        #app-view {
          background-color: var(--theme-color-soft);
          display: grid;
          grid-template-columns : ${app.settings.mainMenuWidth}px 1fr;
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


        /* Fix Safari le input ne peut pas être caché et doit se trouver dans le viewport */
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
      `

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

        <canvas-container id="canvas-container" .environment=${app.environment}></canvas-container>
      </div>

      <notif-center></notif-center>

      <input
        id="fileSelector"
        accept="${app.environment.extensions.join(',')}"
        type="file"
        style="display: none"
        @change="${(event) => {
        window.dispatchEvent(
          new CustomEvent('file-opened', {
            detail: { method: 'old', file: event.target.files[0] },
          }),
        );
        event.target.value = null;
      }}"
      />

      ${this.addModules()}

      ${this.showZoom()}
    `;
  }

  addModules() {
    if (app.environment.name === 'Tangram') {
      import('../controllers/Tangram/TangramManager');
      return html`<tangram-manager></tangram-manager>`
    }
    return
  }

  showZoom() {
    if (app.tool?.name != "zoom") return
    import('../controllers/Zoom/zoom-menu')
    return html`<zoom-menu></zoom-menu>`
  }

  updateProperties() {
    this.helpSelected = app.helpSelected;
    this.filename = app.filename || '';
    document.title = this.filename != "" ? this.filename : "AG mobile";
  }

  preventZoom(e) {
    var t2 = e.timeStamp;
    var t1 = e.currentTarget.dataset.lastTouch || t2;
    var dt = t2 - t1;
    var fingers = e.touches.length;
    e.currentTarget.dataset.lastTouch = t2;

    if (!dt || dt > 500 || fingers > 1) return; // not double-tap
    e.currentTarget.dataset.lastTouch = null;

    e.preventDefault();
  }

  // // Todo: Placer dans un objet BackgroundImage ?
  // loadBackground() {
  //   const imageSelector = document.createElement('input');
  //   imageSelector.type = 'file';
  //   imageSelector.accept = 'image/*';
  //   imageSelector.onchange = e => this.setBackground(e.target.files[0]);
  //   document.body.appendChild(imageSelector);
  //   imageSelector.click();
  // }

  // setBackground(file) {
  //   let reader = new FileReader();
  //   reader.onload = e => (this.background = e.target.result);
  //   reader.readAsDataURL(file);
  // }

  async firstUpdated() {
    window.addEventListener('show-file-selector', () => {
      this.shadowRoot.querySelector('#fileSelector').click();
    });
    window.addEventListener('history-changed', () => {
      this.canUndo = HistoryManager.canUndo();
      this.canRedo = HistoryManager.canRedo();
    });
    window.addEventListener('tool-changed', () => {
      this.tool = app.tool;
    });

    this.addEventListener('touchstart', this.preventZoom);

    window.addEventListener('helpToolChosen', e => {
      import('@components/popups/help-popup');
      let helpElem = createElem('help-popup');
      helpElem.toolname = e.detail.toolname;
    });

    window.addEventListener('state-changed', () => {
      this.updateProperties()
      this.requestUpdate()
    })

    window.onerror = (a, b, c, d, e) => {
      bugSend(a, b, c, d, e)
      if (location.hostname === 'localhost') return false
      return true
    };
  }
}
