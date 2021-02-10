import { LitElement, html, css } from 'lit-element';
import './div-main-canvas';
import './flex-toolbar';
import './toolbar-kit';
import './toolbar-section';
import './icon-button';
import './popups/notification';
import './version-item';

import { app } from './Core/App';
import './Core/Manifest';
import { OpenFileManager } from './Core/Managers/OpenFileManager';
import './Core/Managers/SaveFileManager';
import './Core/Managers/SelectManager';
import './Core/Managers/WorkspaceManager';
import './Core/Managers/GroupManager';
import './Core/Managers/ShapeManager';
import './Core/Managers/DrawManager';
import './Core/Managers/CompleteHistoryManager';
import { HistoryManager } from './Core/Managers/HistoryManager';
import { createElem } from './Core/Tools/general';

if (app.fileToOpen) OpenFileManager.newReadFile(app.fileToOpen)

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
    window.addEventListener('state-changed', () => {
      this.setState();
    });
    window.addEventListener('history-changed', () => {
      this.canUndo = HistoryManager.canUndo();
      this.canRedo = HistoryManager.canRedo();
    });
    window.addEventListener('workspace-changed', () => {
      window.dispatchEvent(new CustomEvent('history-changed'));
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
              ${this.state?.title}
            </div>
            <flex-toolbar>
              <icon-button name="new" title="Nouvelle fenêtre" @click="${this._actionHandle}">
              </icon-button>
              <icon-button name="load" title="Ouvrir" @click="${this._actionHandle}">
              </icon-button>
              <icon-button name="save" title="Sauvegarder" @click="${this._actionHandle}">
              </icon-button>
              <icon-button name="settings" title="Paramètres" @click="${this._actionHandle}">
              </icon-button>
              <icon-button name="undo" title="Annuler" ?disabled="${!this.canUndo}" @click="${this._actionHandle}">
              </icon-button>
              <icon-button name="redo" title="Refaire" ?disabled="${!this.canRedo}" @click="${this._actionHandle}">
              </icon-button>
              <!-- <icon-button
                name="replay"
                title="replay"
                @click="\${this._actionHandle}"
              >
              </icon-button> -->

              <icon-button name="help" title="Aide" @click="${this._actionHandle}">
              </icon-button>
            </flex-toolbar>

            <toolbar-kit></toolbar-kit>

          </div>

          <div id="app-canvas-view-toolbar-p2">

            <toolbar-section title="Créer une silhouette"
              .buttons_states="${this.states.filter(state => state.type === 'tangram')}">
            </toolbar-section>

            <toolbar-section title="Formes libres"
              .buttons_states="${this.states.filter(state => state.type === 'geometry_creator')}">
            </toolbar-section>

            <toolbar-section title="Mouvements" .buttons_states="${this.states.filter(state => state.type === 'move')}">
            </toolbar-section>

            <toolbar-section title="Opérations" .buttons_states="${this.states.filter(state => state.type === 'operation')}">
            </toolbar-section>

            <toolbar-section title="Outils" .buttons_states="${this.states.filter(state => state.type === 'tool')}">
            </toolbar-section>

          </div>
          <version-item></version-item>
        </div>

        <div-main-canvas id="div-main-canvas"></div-main-canvas>
      </div>

      <opacity-popup></opacity-popup>

      <notif-center></notif-center>

      <input id="fileSelector" accept=".${app.environment.extension}" type="file" style="display: none" @change="${event => {
              window.dispatchEvent(
                new CustomEvent('file-opened', {
                  detail: { method: 'old', file: event.target.files[0] },
                })
              );
              event.target.value = null;
            }}" />

      <label id="color-picker-label" for="color-picker" hidden></label>
      <input id="color-picker" type="color" @change="${e =>
              window.dispatchEvent(
                new CustomEvent('colorChange', {
                  detail: { color: e.target.value },
                })
              )}" />
    `;
  }

  // firstUpdated() {
  //   console.log(app)
  // }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    let reset_state = 0;
    let leaveConfirmationPopup;
    switch (event.target.name) {
      case 'settings':
        import('./popups/settings-popup');
        createElem('settings-popup');
        reset_state = 1;
        break;
      case 'save':
        window.dispatchEvent(new CustomEvent('save-file'));
        reset_state = 1;
        break;
      case 'load':
        if (app.workspace.history.index === -1) {
          window.dispatchEvent(new CustomEvent('open-file'))
          return
        }
        import('./popups/leave-confirmation-popup');
        leaveConfirmationPopup = createElem('leave-confirmation-popup');
        leaveConfirmationPopup.actionAfter = 'open';
        reset_state = 1;
        break;
      case 'new':
        import('./popups/leave-confirmation-popup');
        leaveConfirmationPopup = createElem('leave-confirmation-popup');
        leaveConfirmationPopup.actionAfter = 'new';
        reset_state = 1;
        break;
      case 'undo':
        window.dispatchEvent(new CustomEvent('undo-action'));
        break;
      case 'redo':
        window.dispatchEvent(new CustomEvent('redo-action'));
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
        console.warn(
          'unknow event type: ' + event.type + ', with event: ',
          event
        );
    }
    if (reset_state) {
      app.setState();
    }
  }

  setState() {
    this.states = [...app.states];
    this.stateName = app.state;
    this.state = this.states.find(st => st.name == this.stateName);
    if (location.hostname === 'localhost') console.log(app)
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
customElements.define('ag-main', AGTabletteApp);
