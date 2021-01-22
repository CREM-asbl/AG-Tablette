import { LitElement, html, css } from 'lit-element';
import './div-main-canvas';
import './toolbar-kit';
import './toolbar-section';
import './icon-button';
import './popups/notification';
import './version-item';

import { app } from './Core/App';
import './Core/Manifest';
import './Core/Managers/OpenFileManager';
import './Core/Managers/SaveFileManager';
import './Core/Managers/SelectManager';
import './Core/Managers/WorkspaceManager';
import './Core/Managers/GroupManager';
import './Core/Managers/ShapeManager';
import './Core/Managers/DrawManager';
import './Core/Managers/CompleteHistoryManager';
import { HistoryManager } from './Core/Managers/HistoryManager';
import { createElem } from './Core/Tools/general';
import { TemplateToolbar } from './template-toolbar';

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
    return [
      TemplateToolbar.templateToolbarStyles(),
      css`
        #app-view {
          display: flex;
          width: 100%;
          margin: 0;
          padding: 0;
          height: 100%;
        }

        #app-menu {
          display: flex;
          flex-direction: column;
          padding: 10px;
          box-sizing: border-box;
          background-color: var(--menu-background-color);
          overflow: hidden;
          flex: 0 0 ${app.settings.get('mainMenuWidth')}px;
          box-shadow: 0px 0px 5px var(--menu-shadow-color);
          margin: 5px;

          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -o-user-select: none;
          user-select: none;
          border-radius: 10px;
        }

        div-main-canvas {
          width: 100%;
          height: 100%;
        }

        version-item {
          position: absolute;
          bottom: 20px;
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
      `,
    ];
  }

  render() {
    return html`
      <div id="app-view">
        <div id="app-menu">
          <template-toolbar title="hell">
            <h2 slot="title">
              ${this.state != undefined ? this.state.title : 'AG Mobile'}
            </h2>
            <div slot="body">
              <icon-button
                name="new"
                title="Nouvelle fenêtre"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                name="load"
                title="Ouvrir"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                name="save"
                title="Sauvegarder"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                name="settings"
                title="Paramètres"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                name="undo"
                title="Annuler"
                ?disabled="${!this.canUndo}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                name="redo"
                title="Refaire"
                ?disabled="${!this.canRedo}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                name="replay"
                title="replay"
                @click="${this._actionHandle}"
              >
              </icon-button>

              <icon-button
                name="help"
                title="Aide"
                @click="${this._actionHandle}"
              >
              </icon-button>
            </div>
          </template-toolbar>

          <toolbar-kit></toolbar-kit>

          <toolbar-section
            title="Créer une silhouette"
            .buttons_states="${this.states.filter(
              state => state.type === 'tangram'
            )}"
          >
          </toolbar-section>

          <toolbar-section
            title="Formes libres"
            .buttons_states="${this.states.filter(
              state => state.type === 'geometryCreator'
            )}"
          >
          </toolbar-section>

          <toolbar-section
            title="Mouvements"
            .buttons_states="${this.states.filter(
              state => state.type === 'move'
            )}"
          >
          </toolbar-section>

          <toolbar-section
            title="Opérations"
            .buttons_states="${this.states.filter(
              state => state.type === 'operation'
            )}"
          >
          </toolbar-section>

          <toolbar-section
            title="Outils"
            .buttons_states="${this.states.filter(
              state => state.type === 'tool'
            )}"
          >
          </toolbar-section>

          <!-- <icon-button src="/images/wallpaper.svg"
                              title="Fond d'écran"
                              name="wallpaper"
                              @click="\${this.loadBackground}">
                      </icon-button> -->
          <version-item></version-item>
        </div>

        <div-main-canvas id="div-main-canvas"></div-main-canvas>
      </div>

      <notif-center></notif-center>

      <input
        id="fileSelector"
        accept=".${app.environment.extension}"
        type="file"
        style="display: none"
        @change="${event => {
          window.dispatchEvent(
            new CustomEvent('file-opened', {
              detail: { method: 'old', file: event.target.files[0] },
            })
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
            new CustomEvent('colorChange', {
              detail: { color: e.target.value },
            })
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
        import('./popups/settings-popup');
        createElem('settings-popup');
        reset_state = 1;
        break;
      case 'save':
        window.dispatchEvent(new CustomEvent('save-file'));
        reset_state = 1;
        break;
      case 'load':
        window.dispatchEvent(new CustomEvent('open-file'));
        reset_state = 1;
        break;
      case 'new':
        import('./popups/new-popup');
        createElem('new-popup');
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
