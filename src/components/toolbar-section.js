import { html, LitElement } from 'lit';
import { app, setState } from '../controllers/Core/App';
import '../controllers/icon-button';
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

    window.addEventListener('helpSelected-changed', this.eventHandler);
    window.addEventListener('tool-changed', this.eventHandler);
    window.addEventListener('tools-changed', this.eventHandler);
  }

  static styles = [TemplateToolbar.templateToolbarStyles()];

  render() {
    console.log('render', this.tools)
    if (this.tools[0]?.name == 'create') {
      console.log('create')
      setTimeout(() => this.updateProperties(), 100);
    }
    if (!this.tools.length) return html``;
    return html`
      <template-toolbar>
        <h2 slot="title">${this.title}</h2>
        <div slot="body">
          ${this.tools.map((tool) => html`
              <icon-button
                name="${tool.name}"
                type="State"
                title="${tool.title}"
                ?active="${tool.name === app.tool?.name}"
                ?helpanimation="${this.helpSelected}"
                cantInteract="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
            </icon-button>
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
