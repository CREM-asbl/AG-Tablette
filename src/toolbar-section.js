import { app, setState } from './Core/App';
import { LitElement, html, css } from 'lit';
import './icon-button';
import { TemplateToolbar } from './template-toolbar';

class ToolbarSection extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      buttons_states: { type: Array },
    };
  }

  static get styles() {
    return [TemplateToolbar.templateToolbarStyles()];
  }

  render() {
    if (!this.buttons_states.length) return html``;
    return html`
      <template-toolbar>
        <h2 slot="title">${this.title}</h2>
        <div slot="body">
          ${this.buttons_states.map(
            (state) => html`
              <icon-button
                name="${state.name}"
                type="State"
                title="${state.title}"
                ?active="${state.name === app.state ||
                state.name === app.tool?.name}"
                @click="${this._actionHandle}"
              ></icon-button>
            `,
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
