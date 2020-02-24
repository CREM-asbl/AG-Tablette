import { LitElement, html, css } from 'lit-element';
import './div-main-canvas';
import './flex-toolbar';
import './toolbar-kit';
import './toolbar-section';
import './icon-button';
import './popups/new-popup';
import './popups/settings-popup';
import './popups/help-popup';
import './popups/save-popup';
import './popups/notification';
import './version-item';
import './completehistory-tools';

import { app } from './Core/App';
import './Core/Manifest';

import './Managers/FileManager';
import './Managers/SelectManager';
import './Managers/WorkspaceManager';
import './Managers/GroupManager';
import './Managers/ShapeManager';
import './Managers/DrawManager';
import './Managers/CompleteHistoryManager';
import { HistoryManager } from './Managers/HistoryManager';
import { createElem } from './Core/Tools/general';

class AGTabletteApp extends LitElement {
  static get properties() {
    return {
      canUndo: Boolean,
      canRedo: Boolean,
      background: String,
      states: Array,
      stateName: String,
      state: Object,
    };
  }

  constructor() {
    super();
    app.appDiv = this;
    this.canUndo = false;
    this.canRedo = false;
    this.setState();

    window.addEventListener('show-file-selector', () => {
      this.shadowRoot.querySelector('#fileSelector').click();
    });
    window.addEventListener('app-state-changed', () => {
      this.setState();
    });
    window.addEventListener('env-created', () => {
      this.setState();
    });
    window.addEventListener('history-changed', () => {
      this.canUndo = HistoryManager.canUndo();
      this.canRedo = HistoryManager.canRedo();
    });
    window.addEventListener('open-opacity-popup', () => {
      this.shadowRoot.querySelector('opacity-popup').style.display = 'block';
    });
    window.addEventListener('open-color-picker', () => {
      this.shadowRoot.querySelector('#color-picker-label').click();
    });
  }

  static get styles() {
    return css`
      :host {
        --primary-color: #abcedf;
        --button-border-color: black;
        --button-background-color: #0ff;
      }

      #app-canvas-view {
        display: flex;
        width: 100%;
        margin: 0;
        padding: 0;
        height: 100%;
      }

      #app-canvas-view > .toolbar {
        display: flex;
        flex-flow: column;
        padding: 4px;
        height: 100%;
        box-sizing: border-box;
        border-right: 1px solid gray;
        background-color: var(--primary-color);
        overflow: hidden;
        flex: 0 0 ${app.settings.get('mainMenuWidth')}px;
      }

      #app-canvas-view-toolbar {
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -o-user-select: none;
        user-select: none;
      }

      #app-canvas-view-toolbar-p1 {
        padding-bottom: 8px;
        border-bottom: 1px solid lightslategray;
      }

      #app-canvas-view-toolbar-p2 {
        flex: 1;
        overflow-y: auto;
      }

      .toolbar-separator {
        font-weight: bold;
        margin: 12px 0;
      }

      div-main-canvas {
        width: 100%;
        height: 100%;
      }

      #app-canvas-mode-text {
        padding: 4px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      #app-canvas-mode-text span {
        color: #444;
      }

      /* Fix Safari le input ne peut pas être caché et doit se trouver dans le viewport */
      input[type='color'] {
        opacity: 0;
        position: absolute;
        top: 0;
        left: 21vw;
        width: 0;
        height: 0;
        border: none;
        background: transparent;
      }
    `;
  }

  render() {
    return html`
      <div id="app-canvas-view">
        <div id="app-canvas-view-toolbar" class="toolbar">
          <div id="app-canvas-view-toolbar-p1">
            <div id="app-canvas-mode-text">
              <span>Mode: </span>
              ${this.state ? this.state.title : ''}
            </div>
            <flex-toolbar>
              <icon-button
                src="/images/delete-all.svg"
                title="Supprimer tout"
                name="new"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/load.svg"
                title="Ouvrir"
                name="load"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/save.svg"
                title="Sauvegarder"
                name="save"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/settings.svg"
                title="Paramètres"
                name="settings"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/undo.svg"
                title="Annuler"
                name="undo"
                ?disabled="${!this.canUndo}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/redo.svg"
                title="Refaire"
                name="redo"
                ?disabled="${!this.canRedo}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/replay.svg"
                title="replay"
                name="replay"
                @click="${this._actionHandle}"
              >
              </icon-button>

              <icon-button
                src="/images/help.svg"
                title="Aide"
                name="help"
                @click="${this._actionHandle}">
              </icon-button>
            </flex-toolbar>

            <toolbar-kit></toolbar-kit>

          </div>

          <div id="app-canvas-view-toolbar-p2">
            <toolbar-section title="Mouvements"
                             .buttons_states="${this.states.filter(
                               state => state.type === 'move',
                             )}">
            </toolbar-section>

            <toolbar-section title="Opérations"
                             .buttons_states="${this.states.filter(
                               state => state.type === 'operation',
                             )}">
            </toolbar-section>

            <toolbar-section title="Outils"
                             .buttons_states="${this.states.filter(
                               state => state.type === 'tool',
                             )}">
            </toolbar-section>

              <!-- <icon-button src="/images/wallpaper.svg"
                                title="Fond d'écran"
                                name="wallpaper"
                                @click="\${this.loadBackground}">
                        </icon-button> -->
            </flex-toolbar>
          </div>
          <version-item></version-item>
        </div>

        <!-- background="\${this.background}" -->
        <div-main-canvas id="div-main-canvas" ></div-main-canvas>
      </div>

      <settings-popup></settings-popup>

      <save-popup></save-popup>

      <opacity-popup></opacity-popup>

      <new-popup></new-popup>

      <notif-center></notif-center>

      <completehistory-tools></completehistory-tools>

      <input
        id="fileSelector"
        accept=".${app.environment.extension}"
        type="file"
        style="display: none"
        @change="${event => {
          window.dispatchEvent(
            new CustomEvent('file-opened', {
              detail: { method: 'old', file: event.target.files[0] },
            }),
          );
          event.target.value = null;
        }}"
      />

      <label id="color-picker-label" for="color-picker" hidden></label>
      <input
        id="color-picker"
        type="color"
        @change="${e =>
          window.dispatchEvent(
            new CustomEvent('colorChange', { detail: { color: e.target.value } }),
          )}"
      />
    `;
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    let reset_state = 0;
    switch (event.target.name) {
      case 'settings':
        this.shadowRoot.querySelector('settings-popup').style.display = 'block';
        reset_state = 1;
        break;
      case 'save':
        window.dispatchEvent(new CustomEvent('save-to-file'));
        reset_state = 1;
        break;
      case 'load':
        window.dispatchEvent(new CustomEvent('open-file'));
        reset_state = 1;
        break;
      case 'new':
        window.dispatchEvent(new CustomEvent('open-new-popup'));
        reset_state = 1;
        break;
      case 'undo':
        if (this.canUndo) window.dispatchEvent(new CustomEvent('undo-action'));
        break;
      case 'redo':
        if (this.canRedo) window.dispatchEvent(new CustomEvent('redo-action'));
        break;
      case 'replay':
        window.dispatchEvent(new CustomEvent('start-browsing'));
        break;
      case 'help':
        import('./popups/help-popup');
        createElem('help-popup');
        window.dispatchEvent(new CustomEvent('get-help-text'));
        break;
      default:
        console.log('unknow event type: ' + event.type + ', with event: ', event);
    }
    if (reset_state) {
      app.setState();
    }
  }

  setState() {
    this.states = [...app.states];
    this.stateName = app.state;
    this.state = this.states.find(st => st.name == this.stateName);
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
}
customElements.define('ag-tablette-app', AGTabletteApp);
