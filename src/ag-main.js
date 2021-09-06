import { LitElement, html, css } from 'lit';
import './div-main-canvas';
import { TemplateToolbar } from './template-toolbar';
import './toolbar-kit';
import './toolbar-section';
import './icon-button';
import './popups/notification';
import './version-item';
import './color-button';

import { app, setState } from './Core/App';
import { OpenFileManager } from './Core/Managers/OpenFileManager';
import './Core/Managers/SaveFileManager';
import './Core/Managers/SelectManager';
import './Core/Managers/WorkspaceManager';
import './Core/Managers/GroupManager';
import './Core/Managers/ShapeManager';
import './Core/Managers/DrawManager';
import './Core/Managers/FullHistoryManager';
import { HistoryManager } from './Core/Managers/HistoryManager';
import { createElem } from './Core/Tools/general';
import { customElement } from 'lit/decorators.js';

if (app.fileToOpen) OpenFileManager.newReadFile(app.fileToOpen);

@customElement('ag-main')
class AGMain extends LitElement {
  static get properties() {
    return {
      canUndo: Boolean,
      canRedo: Boolean,
      background: String,
      tool: Object,
      colorPickerValue: String,
      iconSize: Number,
      toolbarSections: Array,
    };
  }

  constructor() {
    super();
    this.canUndo = false;
    this.canRedo = false;
    this.tool = app.tool;
    this.colorPickerValue = '#000000';

    window.addEventListener('show-file-selector', () => {
      this.shadowRoot.querySelector('#fileSelector').click();
    });
    window.addEventListener('history-changed', () => {
      this.canUndo = HistoryManager.canUndo();
      this.canRedo = HistoryManager.canRedo();
    });
    window.addEventListener('workspace-changed', () => {
      this.colorPickerValue = '#000000';
      this.shadowRoot.querySelector('#color-picker').value = '#000000';
    });
    window.addEventListener('tool-changed', () => {
      this.tool = app.tool;
      if (app.fullHistory.isRunning)
        return;
      if (app.tool?.currentStep == 'start') {
        if (app.tool.name == 'backgroundColor') {
          this.shadowRoot.querySelector('#color-picker').value =
            app.settings.shapeFillColor;
          this.colorPickerValue = app.settings.shapeFillColor;
        } else if (app.tool.name == 'borderColor') {
          this.shadowRoot.querySelector('#color-picker').value =
            app.settings.shapeBorderColor;
          this.colorPickerValue = app.settings.shapeBorderColor;
        } else {
          return;
        }
        this.shadowRoot.querySelector('#color-picker').click();
      }
    });

    // vh error in tablette => custom vh
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    window.addEventListener('resize', () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });

    this.updateProperties = () => {
      this.iconSize = app.menuIconSize;
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };

    window.addEventListener('menuIconSize-changed', this.eventHandler);
  }

  static get styles() {
    return [
      TemplateToolbar.templateToolbarStyles(),
      css`
        #app-view {
          background-color: var(--theme-color-soft);
          display: flex;
          width: 100%;
          margin: 0;
          padding: 0;
          height: 100%;
        }

        #left-menu {
          display: flex;
          flex-direction: column;
          padding: 10px;
          /* padding-right: 50px; */
          border-radius: 10px;
          box-sizing: border-box;
          background-color: var(--theme-color);
          flex: 0 0 ${app.settings.mainMenuWidth}px;

          scrollbar-width: thin;

          /* scrollbar hidden */
          /* -ms-overflow-style: none; IE and Edge */
          /* scrollbar-width: none; Firefox */
          overflow-y: scroll;
          overflow-x: hidden;
        }

        /* scrollbar hidden */
        /* #left-menu::-webkit-scrollbar {
          display: none;
        } */

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

  updated() {
    if (app.environment?.name != 'Grandeurs' && app.environment?.name != 'Cubes') {
      this.shadowRoot
        .querySelectorAll('.onlyGrandeurs')
        .forEach((el) => (el.style.display = 'none'));
    }
  }

  async firstUpdated() {
    let sectionImport = await import(`./toolbarSectionsDef.js`);
    this.toolbarSections = sectionImport.default.sections;
  }

  render() {
    return html`
      <div id="app-view">
        <div id="left-menu">
          <template-toolbar>
            <h2 slot="title">
              ${this.tool?.title != undefined
                ? this.tool.title
                : app.environment.name}
            </h2>
            <div slot="body">
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="new"
                title="Nouvelle fenêtre"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="open"
                title="Ouvrir"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="save"
                title="Sauvegarder"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="settings"
                title="Paramètres"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="undo"
                title="Annuler"
                ?disabled="${!this.canUndo}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="redo"
                title="Refaire"
                ?disabled="${!this.canRedo}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                class="onlyGrandeurs"
                name="replay"
                title="replay"
                @click="${this._actionHandle}"
              >
              </icon-button>

              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="help"
                title="Aide"
                @click="${this._actionHandle}"
              >
              </icon-button>
            </div>
          </template-toolbar>

          <toolbar-kit></toolbar-kit>

          ${this.toolbarSections?.map(section => html`
            <toolbar-section
              title="${section.title}"
              toolsType="${section.name}"
            >
            </toolbar-section>
          `)}

          <!-- <icon-button src="/images/wallpaper.svg"
                              title="Fond d'écran"
                              name="wallpaper"
                              @click="\${this.loadBackground}">
                      </icon-button> -->
        </div>

        <div-main-canvas id="div-main-canvas"></div-main-canvas>
      </div>

      <notif-center></notif-center>

      <input
        id="fileSelector"
        accept=".${app.environment.extension}"
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

      <input
        id="color-picker"
        type="color"
        value="${this.colorPickerValue}"
        @input="${e => {
          if (app.tool.name == 'backgroundColor') {
            setState({
              settings: {
                ...app.settings,
                shapeFillColor: e.target.value,
              },
              tool: { ...app.tool, currentStep: 'listen' },
            });
          } else if (app.tool.name == 'borderColor') {
            setState({
              settings: {
                ...app.settings,
                shapeBorderColor: e.target.value,
              },
              tool: { ...app.tool, currentStep: 'listen' },
            });
          }
        }}"
      />
    `;
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (app.fullHistory.isRunning) {
      console.warn('cannot interact when fullHisto is running');
      return;
    }
    let resetTool = false;
    let HomePopup;
    switch (event.target.name) {
      case 'settings':
        import('./popups/settings-popup');
        createElem('settings-popup');
        resetTool = true;
        break;
      case 'save':
        window.dispatchEvent(new CustomEvent('save-file'));
        resetTool = true;
        break;
      case 'open':
        window.dispatchEvent(new CustomEvent('open-file'));
        resetTool = true;
        break;
      case 'new':
        import('./popups/home-popup');
        createElem('home-popup');
        resetTool = true;
        break;
      case 'undo':
        window.dispatchEvent(new CustomEvent('undo'));
        break;
      case 'redo':
        window.dispatchEvent(new CustomEvent('redo'));
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
          event,
        );
    }
    if (resetTool) {
      setState({ tool: null });
    }
  }

  // setState() {
  //   console.trace('ag-main setState called');
  //   this.states = [...app.states];
  //   this.stateName = app.state;
  //   this.state = this.states.find((st) => st.name == this.stateName);
  // }

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
