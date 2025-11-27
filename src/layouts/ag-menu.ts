import '@components/icon-button';
import '@components/template-toolbar';
import '@components/toolbar-kit';
import '@components/toolbar-section';
import { SignalWatcher } from '@lit-labs/signals';
import { kit } from '@store/kit';
import { tools } from '@store/tools';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { app } from '../controllers/Core/App';
import { createElem } from '../controllers/Core/Tools/general';
import { activeTool, appActions, helpSelected, historyActions, historyState, toolState } from '../store/appState';

@customElement('ag-menu')
class AGMenu extends SignalWatcher(LitElement) {
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
    const currentToolName = activeTool.get();
    // Subscribe to toolState to re-render when tool properties (like selectedFamily) change
    toolState.get();
    const currentTool = currentToolName ? { name: currentToolName, title: app.tool?.title, selectedFamily: app.tool?.selectedFamily } : null;
    // Note: app.tool might still be needed for title/family if not in store yet, 
    // but ideally we should get everything from store. 
    // For now, we rely on activeTool for the name, but title might be missing if we don't look it up.
    // Let's look up the tool info from the tools store if possible, or keep using app.tool as fallback for properties not yet in signal.
    // Actually, appState.js has activeTool name. tools.js has the list of tools.

    let toolTitle = 'Sélectionnez une fonctionnalité';
    let toolFamily = '';

    if (currentToolName) {
      const toolList = tools.get();
      const toolInfo = toolList.find(t => t.name === currentToolName);
      if (toolInfo) {
        toolTitle = 'mode: ' + toolInfo.title;
        toolFamily = app.tool?.selectedFamily || toolInfo.type;
      } else if (app.tool) {
        toolTitle = 'mode: ' + app.tool.title;
        toolFamily = app.tool.selectedFamily;
      }
    }

    const isHelpSelected = helpSelected.get();
    const history = historyState.get();

    return html`
      <h3>
        ${toolTitle}
      </h3>
      <template-toolbar>
        <div slot="body">${this._renderActionButtons(history, isHelpSelected)}</div>
      </template-toolbar>

      <toolbar-kit
        .kit=${kit.get()}
        selectedFamily="${toolFamily}"
        ?helpSelected="${isHelpSelected}"
        selected="${currentToolName}"
      >
      </toolbar-kit>
      ${this._renderToolbarSections(isHelpSelected, currentToolName)}
    `;
  }

  _renderActionButtons(history, isHelpSelected) {
    const actions = [
      { name: 'home', title: 'Accueil' },
      { name: 'open', title: 'Ouvrir' },
      { name: 'save', title: 'Enregistrer' },
      { name: 'settings', title: 'Paramètres' },
      { name: 'undo', title: 'Annuler', disabled: !history.canUndo },
      { name: 'redo', title: 'Refaire', disabled: !history.canRedo },
      { name: 'replay', title: 'Rejouer' },
      { name: 'help', title: 'Aide', active: isHelpSelected },
    ];

    return actions.map(
      (action) => html`
        <icon-button
          name="${action.name}"
          title="${action.title}"
          ?disabled="${action.disabled}"
          ?active="${action.active}"
          ?helpanimation="${isHelpSelected}"
          @click="${this._actionHandle}"
        ></icon-button>
      `,
    );
  }

  _renderToolbarSections(isHelpSelected, currentToolName) {
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
          .tools="${tools.get()}"
          toolsType="${section.toolsType}"
          ?helpSelected="${isHelpSelected}"
          selected="${currentToolName}"
        ></toolbar-section>
      `,
    );
  }

  _actionHandle(event) {
    if (app.fullHistory.isRunning) {
      console.info('cannot interact when fullHisto is running');
      return;
    }

    if (helpSelected.get()) {
      window.dispatchEvent(
        new CustomEvent('helpToolChosen', {
          detail: { toolname: event.target.name },
        }),
      );
      appActions.setHelpSelected(false);
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
      undo: () => {
        historyActions.undo();
        return false; // Undo doesn't reset tool usually, or does it? Original code dispatched event.
      },
      redo: () => {
        historyActions.redo();
        return false;
      },
      replay: () => window.dispatchEvent(new CustomEvent('start-browsing')),
      help: () => {
        appActions.setHelpSelected(true);
        return true;
      },
    };

    const action = actions[event.target.name];
    if (action) {
      const resetTool = action();
      if (resetTool) {
        appActions.setActiveTool(null);
      }
    } else {
      console.info(
        'unknow event type: ' + event.type + ', with event: ',
        event,
      );
    }
  }

  firstUpdated() {
    app.left_menu = this.shadowRoot;
    this.addEventListener('touchstart', (event) => {
      if (event.touches.length > 1) event.preventDefault();
    });
    // this.addEventListener('mousewheel', event => event.preventDefault())
  }
}
