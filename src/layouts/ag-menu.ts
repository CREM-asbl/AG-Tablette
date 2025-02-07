import '@components/icon-button';
import '@components/template-toolbar';
import '@components/toolbar-kit';
import '@components/toolbar-section';
import { SignalWatcher } from '@lit-labs/signals';
import { tools } from '@store/tools';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { app, setState } from '../controllers/Core/App';
import { createElem } from '../controllers/Core/Tools/general';

@customElement('ag-menu')
class AGMenu extends SignalWatcher(LitElement) {
  @property({ type: Boolean }) helpSelected = false;
  @property({ type: Object }) tool;
  @property({ type: Boolean }) canUndo = false;
  @property({ type: Boolean }) canRedo = false;

  static styles = css`
    :host {
      display: flex;
      gap: 8px;
      flex-direction: column;
      padding: 8px;
      background-color: var(--theme-color);
      scrollbar-width: thin;
      overflow: auto;
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
    console.log("rendering menu", tools.get())
    return html`
        <h3>
          ${this.tool?.title != undefined
        ? 'mode: ' + this.tool.title
        : 'Sélectionnez une fonctionnalité'}
        </h3>
        <template-toolbar>
          <div slot="body">
            ${this._renderActionButtons()}
          </div>
        </template-toolbar>

        <toolbar-kit
          .environment=${app.environment}
          selectedFamily="${this.tool?.selectedFamily}"
          ?helpSelected="${this.helpSelected}"
          selected="${this.tool?.name}"
        ></toolbar-kit>
        ${this._renderToolbarSections()}
    `;
  }

  _renderActionButtons() {
    const actions = [
      { name: 'home', title: 'Accueil' },
      { name: 'open', title: 'Ouvrir' },
      { name: 'save', title: 'Enregistrer' },
      { name: 'settings', title: 'Paramètres' },
      { name: 'undo', title: 'Annuler', disabled: !this.canUndo },
      { name: 'redo', title: 'Refaire', disabled: !this.canRedo },
      { name: 'replay', title: 'Rejouer' },
      { name: 'help', title: 'Aide', active: this.helpSelected },
    ];

    return actions.map(
      (action) => html`
        <icon-button
          name="${action.name}"
          title="${action.title}"
          ?disabled="${action.disabled}"
          ?active="${action.active}"
          ?helpanimation="${this.helpSelected}"
          @click="${this._actionHandle}"
        ></icon-button>
      `
    );
  }

  _renderToolbarSections() {
    const sections = [
      { title: 'Figures libres', toolsType: 'geometryCreator' },
      { title: 'Mouvements', toolsType: 'move' },
      { title: 'Transformations', toolsType: 'transformation' },
      { title: 'Opérations', toolsType: 'operation' },
      { title: 'Outils', toolsType: 'tool' },
    ];

    return sections.map(
      (section) => html`
        <toolbar-section
          title="${section.title}"
          .tools="${app.tools}"
          toolsType="${section.toolsType}"
          ?helpSelected="${this.helpSelected}"
          selected="${this.tool?.name}"
        ></toolbar-section>
      `
    );
  }

  _actionHandle(event) {
    if (app.fullHistory.isRunning) {
      console.info('cannot interact when fullHisto is running');
      return;
    }

    if (this.helpSelected) {
      window.dispatchEvent(
        new CustomEvent('helpToolChosen', {
          detail: { toolname: event.target.name },
        })
      );
      setState({ helpSelected: false });
      return;
    }

    const actions = {
      settings: () => {
        import('@components/popups/settings-popup');
        createElem('settings-popup');
        return true;
      },
      save: () => {
        window.dispatchEvent(new CustomEvent('save-file'));
        return true;
      },
      open: () => {
        window.dispatchEvent(new CustomEvent('open-file'));
        return true;
      },
      home: () => {
        import('@components/popups/home-popup');
        createElem('home-popup');
        return true;
      },
      undo: () => window.dispatchEvent(new CustomEvent('undo')),
      redo: () => window.dispatchEvent(new CustomEvent('redo')),
      replay: () => window.dispatchEvent(new CustomEvent('start-browsing')),
      help: () => {
        setState({ helpSelected: true });
        return true;
      },
    };

    const action = actions[event.target.name];
    if (action) {
      const resetTool = action();
      if (resetTool) {
        setState({ tool: null });
      }
    } else {
      console.info(
        'unknow event type: ' + event.type + ', with event: ',
        event
      );
    }
  }

  firstUpdated() {
    app.left_menu = this.shadowRoot
    this.addEventListener('touchstart', (event) => {
      if (event.touches.length > 1) event.preventDefault();
    });
    // this.addEventListener('mousewheel', event => event.preventDefault())
  }
}
