import { LitElement, html, css } from 'lit-element';
import './flex-toolbar';
import './icon-button';
import { app } from './js/App';

class ToolbarSection extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      buttons_states: { type: Array },
    };
  }

  static get styles() {
    return [
      css`
        .toolbar-separator {
          font-weight: bold;
          margin: 12px 0;
        }
      `,
    ];
  }

  render() {
    if (!this.buttons_states.length) return '';
    return html`
      <div class="toolbar-separator">${this.title}</div>
      <flex-toolbar>
        ${this.buttons_states.map(
          state => html`
            <icon-button
              name="${state[0]}"
              src="/images/${state[0]}.svg"
              title="${state[1].name}"
              ?active="${state[0] === app.state}"
              @click="${this._actionHandle}"
            ></icon-button>
          `,
        )}
      </flex-toolbar>
    `;
  }

  _actionHandle(event) {
    app.setState(event.target.name);
  }
}
customElements.define('toolbar-section', ToolbarSection);