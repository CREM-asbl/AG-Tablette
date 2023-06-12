import { html, LitElement } from 'lit';
import { app, setState } from './Core/App';
import './icon-button';
import { TemplateToolbar } from './template-toolbar';

class ToolbarSection extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      toolsType: { type: String },
      tools: { type: Array },
      helpSelected: { type: Boolean },
    };
  }

  constructor() {
    super();

    this.updateProperties = () => {
      this.iconSize = app.menuIconSize;
      this.tools = app.tools.filter(
        (tool) => tool.type === this.toolsType,
      ).filter(
        (tool) => tool.isVisible && !tool.isDisable,
      );
      this.helpSelected = app.helpSelected;
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };

    window.addEventListener('menuIconSize-changed', this.eventHandler);
    window.addEventListener('helpSelected-changed', this.eventHandler);
    window.addEventListener('tool-changed', this.eventHandler);
    window.addEventListener('tools-changed', this.eventHandler);
  }

  static get styles() {
    return [TemplateToolbar.templateToolbarStyles()];
  }

  render() {
    if (this.tools[0]?.name == 'create') {
      setTimeout(() => this.updateProperties(), 100);
    }
    if (!app.menuIconSize)
      setState({ menuIconSize: (this.offsetWidth - 22) / 4 });
    if (!this.tools.length) return html``;
    return html`
      <template-toolbar>
        <h2 slot="title">${this.title}</h2>
        <div slot="body">
          ${this.tools.map(
            (tool) => html`
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="${tool.name}"
                type="State"
                title="${tool.title}"
                ?active="${tool.name === app.tool?.name}"
                ?helpanimation="${this.helpSelected}"
                cantInteract="${this.helpSelected}"
                @click="${this._actionHandle}"
              ></icon-button>
            `
          )}
        </div>
      </template-toolbar>
    `;
  }

  _actionHandle(event) {
    if (app.helpSelected) {
      window.dispatchEvent(new CustomEvent('helpToolChosen', { detail: { toolname: event.target.name } }));
      setState({ helpSelected: false });
    } else if (!app.fullHistory.isRunning) {
      setState({ tool: { name: event.target.name, currentStep: 'start' } });
    }
  }
}
customElements.define('toolbar-section', ToolbarSection);
