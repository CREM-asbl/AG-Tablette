import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './canvas-container';
import './color-button';
import { app, setState } from './Core/App';
import './Core/Managers/FullHistoryManager';
import './Core/Managers/GroupManager';
import { HistoryManager } from './Core/Managers/HistoryManager';
import { OpenFileManager } from './Core/Managers/OpenFileManager';
import './Core/Managers/SaveFileManager';
import './Core/Managers/SelectManager';
import './Core/Managers/ShapeManager';
import './Core/Managers/WorkspaceManager';
import { createElem, rgb2hex, RGBFromColor } from './Core/Tools/general';
import './icon-button';
import './popups/notification';
import { TemplateToolbar } from './template-toolbar';
import './toolbar-kit';
import './toolbar-section';
import './version-item';


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
      // toolbarSections: Array,
      helpSelected: Boolean,
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
    window.addEventListener('tool-changed', () => {
      this.tool = app.tool;
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
      this.helpSelected = app.helpSelected;
      // this.toolbarSections = [];
      // this.renderRoot?.querySelectorAll('toolbar-section')?.forEach(elem => elem.remove());
      // this.toolbarSections = this.allSections.filter(section =>
      //   app.tools.findIndex(tool => tool.isVisible && tool.type == section.name) != -1
      // );
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };

    window.addEventListener('menuIconSize-changed', this.eventHandler);
    window.addEventListener('helpSelected-changed', this.eventHandler);
    // window.addEventListener('tools-changed', this.eventHandler);

    window.addEventListener('helpToolChosen', e => {
      import('./popups/help-popup');
      let helpElem = createElem('help-popup');
      helpElem.toolname = e.detail.toolname;
    });
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
          border-top-left-radius: 10px;
          border-bottom-left-radius: 10px;
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

        canvas-container {
          width: 100%;
          height: 100%;
        }

        version-item {
          position: absolute;
          bottom: 20px;
        }

        /* Fix Safari le input ne peut pas être caché et doit se trouver dans le viewport */
        input[type='color'] {
          /* opacity: 0; */
          position: absolute;
          top: 0;
          left: 21vw;
          /* width: 0;
          height: 0; */
          border: none;
          /* background: transparent; */
        }

        h3 {
          padding: 0;
          margin: 0 0 10px;
          text-align: center;
          font-size: 1em;
          font-weight: normal;
        }
      `,
    ];
  }

  async firstUpdated() {
    // let sectionImport = await import(`./toolbarSectionsDef.js`);
    // this.toolbarSections = sectionImport.default.sections;
    let backgroundColor = rgb2hex(window.getComputedStyle(this.shadowRoot.querySelector('#left-menu'), null).backgroundColor);
    if (!backgroundColor)
      backgroundColor = '#ffffff';
    let rgb = RGBFromColor(backgroundColor);
    if (rgb.red * 0.299 + rgb.green * 0.587 + rgb.blue * 0.114 > 140) {
      this.textColor = "#000000";
    } else {
      this.textColor = "#ffffff";
    }
    setState({ appLoading: false });

    this.renderRoot.querySelector('#left-menu').addEventListener('touchstart', (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    });
  }

  render() {
    return html`
      <div id="app-view">
        <div id="left-menu">
          <h3 style="color: ${this.textColor}">
            ${this.tool?.title != undefined
              ? "mode: " + this.tool.title
              : "Sélectionnez une fonctionnalité"}
          </h3>
          <template-toolbar>
            <!-- <h2 slot="title">
              ${'Outils généraux'}
            </h2> -->

            <div slot="body">
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="home"
                title="Accueil"
                ?helpanimation="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="open"
                title="Ouvrir"
                ?helpanimation="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="save"
                title="Enregistrer"
                ?helpanimation="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="settings"
                title="Paramètres"
                ?helpanimation="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="undo"
                title="Annuler"
                ?disabled="${!this.canUndo}"
                ?helpanimation="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="redo"
                title="Refaire"
                ?disabled="${!this.canRedo}"
                ?helpanimation="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="replay"
                title="Rejouer"
                ?helpanimation="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
              </icon-button>
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="help"
                ?active="${this.helpSelected}"
                title="Aide"
                @click="${this._actionHandle}"
              >
              </icon-button>
            </div>
          </template-toolbar>

          <toolbar-kit></toolbar-kit>

          <toolbar-section
            title="Figures libres"
            toolsType="geometryCreator"
          >
          </toolbar-section>
          <toolbar-section
            title="Mouvements"
            toolsType="move"
          >
          </toolbar-section>
          <toolbar-section
            title="Transformations"
            toolsType="transformation"
          >
          </toolbar-section>
          <toolbar-section
            title="Opérations"
            toolsType="operation"
          >
          </toolbar-section>
          <toolbar-section
            title="Outils"
            toolsType="tool"
          >
          </toolbar-section>

          <!-- <icon-button src="/images/wallpaper.svg"
                              title="Fond d'écran"
                              name="wallpaper"
                              @click="\${this.loadBackground}">
                      </icon-button> -->
        </div>

        <canvas-container id="canvas-container"></canvas-container>
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
    `;
  }

  _actionHandle(event) {
    if (app.fullHistory.isRunning) {
      console.info('cannot interact when fullHisto is running');
      return;
    }
    let resetTool = false;
    if (this.helpSelected) {
      window.dispatchEvent(new CustomEvent('helpToolChosen', { detail: { toolname: event.target.name } }));
      setState({ helpSelected: false });
      return ;
    }
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
      case 'home':
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
        setState({ helpSelected: true });
        resetTool = true;
        break;
      default:
        console.info(
          'unknow event type: ' + event.type + ', with event: ',
          event,
        );
    }
    if (resetTool) {
      setState({ tool: null });
    }
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
