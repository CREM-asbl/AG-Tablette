import '@components/icon-button';
import { LitElement, html } from 'lit';
import { app, setState } from '../controllers/Core/App';
import './template-toolbar';

class ToolbarSection extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      toolsType: { type: String },
      tools: { type: Array },
      helpSelected: { type: Boolean },
      selected: { type: String }
    };
  }

  render() {
    const tools = app.tools.filter(
      (tool) => tool.type === this.toolsType && tool.isVisible && !tool.isDisable
    )
    if (!tools.length) {
      this.style.display = 'none'
      return
    };
    return html`
      <template-toolbar>
        <h2 slot="title">${this.title}</h2>
        <div slot="body">
          ${tools.map((tool) => html`
              <icon-button
                name="${tool.name}"
                type="State"
                title="${tool.title}"
                ?active="${tool.name === this.selected}"
                ?helpanimation="${this.helpSelected}"
                cantInteract="${this.helpSelected}"
                @click="${this._actionHandle}">
              </icon-button>`
    )}
        </div>
      </template-toolbar>
    `;
  }

  _actionHandle(event) {
    if (this.helpSelected) {
      window.dispatchEvent(new CustomEvent('helpToolChosen', { detail: { toolname: event.target.name } }));
      setState({ helpSelected: false });
    } else if (!app.fullHistory.isRunning) {
      setState({ tool: { name: event.target.name, currentStep: 'start' } });
    }
  }
}
customElements.define('toolbar-section', ToolbarSection);
