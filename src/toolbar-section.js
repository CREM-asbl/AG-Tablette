import { html, LitElement } from 'lit';
import { app, setState } from './Core/App';
import './icon-button';
import { TemplateToolbar } from './template-toolbar';

class ToolbarSection extends LitElement {
  constructor() {
    super();

    this.updateProperties = () => {
      this.iconSize = app.menuIconSize;
      this.tools = app.tools.filter(
        (tool) => tool.type === this.toolsType,
      );
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };

    window.addEventListener('menuIconSize-changed', this.eventHandler);
    window.addEventListener('tool-changed', this.eventHandler);
  }

  static get properties() {
    return {
      title: { type: String },
      toolsType: { type: String },
      tools: { type: Array },
    };
  }

  static get styles() {
    return [TemplateToolbar.templateToolbarStyles()];
  }

  render() {
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
                @click="${this._actionHandle}"
              ></icon-button>
            `
          )}
        </div>
      </template-toolbar>
    `;
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (!app.fullHistory.isRunning) {
      setState({ tool: { name: event.target.name, currentStep: 'start' } });
    }
  }
}
customElements.define('toolbar-section', ToolbarSection);
