import { LitElement, html } from 'lit-element';
import './canvas-button';
import './shapes-list';
import './div-main-canvas';
import './flex-toolbar';
import './icon-button';
import './js/Manifest';
import './popups/new-popup';
import './popups/grid-popup';
import './popups/tangram-popup';
import './popups/opacity-popup';
import './popups/divide-popup';
import './popups/settings-popup';
import './popups/save-popup';
import './state-menu';
import './version-item';

import { app } from './js/App';
import { FileManager } from './js/FileManager';
import { HistoryManager } from './js/HistoryManager';
import { SelectManager } from './js/SelectManager';
import { WorkspaceManager } from './js/WorkspaceManager';
import { GroupManager } from './js/GroupManager';
import { ShapeManager } from './js/ShapeManager';
import { EnvironmentManager } from './js/EnvironmentManager';

class AGTabletteApp extends LitElement {
  static get properties() {
    return {
      state: String,
      families: Array,
      selectedFamily: String,
      canUndo: Boolean,
      canRedo: Boolean,
      background: String,
    };
  }

  constructor() {
    super();
    this.state = '';
    this.stateName = '';
    this.families = [];
    this.selectedFamily = '';
    app.appDiv = this;
    this.canUndo = false;
    this.canRedo = false;
    FileManager.init(); // to move
    HistoryManager.init(); // to move
    SelectManager.init(); // to move
    WorkspaceManager.init(); // to move
    GroupManager.init(); // to move
    ShapeManager.init(); // to move
    EnvironmentManager.init(); // to move

    window.addEventListener('app-state-changed', () => {
      this.state = app.state;
      this.stateName = app.state ? app.states[app.state].name : '';
      this.selectedFamily = '';
    });
    window.addEventListener('family-selected', () => {
      this.selectedFamily = app.selectedFamily;
    });
    window.addEventListener('show-file-selector', () => {
      this.shadowRoot.querySelector('#fileSelector').click();
    });
  }

  render() {
    return html`
      <style>
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

        shapes-list {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
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

        @media (min-width: 600px) {
          shapes-list {
            left: ${app.settings.get('mainMenuWidth')}px;
          }
        }
      </style>

      <div id="app-canvas-view">
        <div id="app-canvas-view-toolbar" class="toolbar">
          <div id="app-canvas-view-toolbar-p1">
            <div id="app-canvas-mode-text">
              <span>Mode: </span>
              ${this.stateName}
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
              <!-- <icon-button src="/images/help.svg"
                                    title="Aide"
                                    name="help"
                                    disabled>
                            </icon-button>
                            -->
            </flex-toolbar>
            <div class="toolbar-separator">Formes standard</div>

            <flex-toolbar>
              ${this.families.map(family => {
                return html`
                  <canvas-button
                    name="create_shape"
                    .family="${family}"
                    ?active="${family === this.selectedFamily}"
                    @click="${this._actionHandle}"
                  >
                  </canvas-button>
                `;
              })}
            </flex-toolbar>
          </div>

          <div id="app-canvas-view-toolbar-p2">
            <div class="toolbar-separator">Mouvements</div>
            <flex-toolbar>
              <icon-button
                src="/images/move.svg"
                title="Glisser"
                name="move_shape"
                ?active="${this.state === 'move_shape'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/rotate.svg"
                title="Tourner"
                name="rotate_shape"
                ?active="${this.state === 'rotate_shape'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/reverse.svg"
                title="Retourner"
                name="reverse_shape"
                ?active="${this.state === 'reverse_shape'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
            </flex-toolbar>

            <div class="toolbar-separator">Opérations</div>

            <flex-toolbar>
              <icon-button
                src="/images/center.svg"
                title="Construire le centre"
                name="build_shape_center"
                ?active="${this.state === 'build_shape_center'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/divide.svg"
                title="Diviser"
                name="divide_segment"
                ?active="${this.state === 'divide_segment'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/cut.svg"
                title="Découper"
                name="cut_shape"
                ?active="${this.state === 'cut_shape'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/copy.svg"
                title="Copier"
                name="copy_shape"
                ?active="${this.state === 'copy_shape'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/merge.svg"
                title="Fusionner"
                name="merge_shapes"
                ?active="${this.state === 'merge_shapes'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
            </flex-toolbar>

            <div class="toolbar-separator">Outils</div>

            <flex-toolbar>
              <icon-button
                src="/images/delete.svg"
                title="Supprimer une forme"
                name="delete_shape"
                ?active="${this.state === 'delete_shape'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/group.svg"
                title="Grouper"
                name="group_shapes"
                ?active="${this.state === 'group_shapes'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/ungroup.svg"
                title="Dégrouper"
                name="ungroup_shapes"
                ?active="${this.state === 'ungroup_shapes'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/backplane.svg"
                title="Arrière-plan"
                name="to_background"
                ?active="${this.state === 'to_background'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/background-color.svg"
                title="Colorier les formes"
                name="background_color"
                ?active="${this.state === 'background_color'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/border-color.svg"
                title="Colorier les bords"
                name="border_color"
                ?active="${this.state === 'border_color'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/opacity.svg"
                title="Opacité"
                name="opacity"
                ?active="${this.state === 'opacity'}"
                @click="${this._actionHandle}"
              >
              </icon-button>

              <!-- <icon-button src="/images/wallpaper.svg"
                                title="Fond d'écran"
                                name="border_color"
                                @click="\${this.loadBackground}">
                        </icon-button> -->

              <icon-button
                src="/images/biface.svg"
                title="Biface"
                name="biface"
                ?active="${this.state === 'biface'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/moveplane.svg"
                title="Glisser le plan"
                name="translate_plane"
                ?active="${this.state === 'translate_plane'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/zoom.svg"
                title="Zoomer"
                name="zoom_plane"
                ?active="${this.state === 'zoom_plane'}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                src="/images/grille.svg"
                title="Grille"
                name="grid_menu"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <!--
                        <icon-button src="/images/tangram-edit.svg"
                                title="Créer Tangram"
                                name="tangram_creator"
                                @click="\${this._actionHandle}">
                        </icon-button>
                        <icon-button src="/images/tangram.svg"
                                title="Faire un Tangram"
                                name="tangram_menu"
                                @click="\${this._actionHandle}">
                        </icon-button>
                        -->
            </flex-toolbar>
          </div>
          <version-item></version-item>
        </div>

        <div-main-canvas id="div-main-canvas" background="${this.background}"></div-main-canvas>
      </div>

      <state-menu></state-menu>

      <shapes-list></shapes-list>

      <settings-popup></settings-popup>

      <save-popup></save-popup>

      <grid-popup></grid-popup>

      <tangram-popup></tangram-popup>

      <opacity-popup></opacity-popup>

      <new-popup></new-popup>

      <divide-popup></divide-popup>

      <input
        id="fileSelector"
        accept=".agg, .json"
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
        this.shadowRoot.querySelector('new-popup').style.display = 'block';
        reset_state = 1;
        break;
      case 'grid_menu':
        this.shadowRoot.querySelector('grid-popup').style.display = 'block';
        reset_state = 1;
        break;
      case 'tangram_menu':
        this.shadowRoot.querySelector('tangram-popup').style.display = 'block';
        reset_state = 1;
        break;
      case 'undo':
        if (this.canUndo) window.dispatchEvent(new CustomEvent('undo-action'));
        break;
      case 'redo':
        if (this.canRedo) window.dispatchEvent(new CustomEvent('redo-action'));
        break;
      case 'create_shape':
        app.setState(event.target.name, event.target.family);
        break;
      default:
        app.setState(event.target.name);
      // } else {
      //   console.error('AGTabletteApp._actionHandle: received unknown event:');
      //   console.error(event);
      //   reset_state = 1;
      // }
    }
    if (reset_state) {
      app.setState(undefined);
    }
  }

  // Todo: Placer dans un objet BackgroundImage ?
  loadBackground() {
    const imageSelector = document.createElement('input');
    imageSelector.type = 'file';
    imageSelector.accept = 'image/*';
    imageSelector.onchange = e => this.setBackground(e.target.files[0]);
    document.body.appendChild(imageSelector);
    imageSelector.click();
  }

  setBackground(file) {
    let reader = new FileReader();
    reader.onload = e => (this.background = e.target.result);
    reader.readAsDataURL(file);
  }
}
customElements.define('ag-tablette-app', AGTabletteApp);
