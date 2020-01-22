import { LitElement, html, css } from 'lit-element';
import './flex-toolbar';
import { app } from './js/App';

class ToolbarKit extends LitElement {
  static get properties() {
    return {
      kit: { type: Array },
      selectedFamily: { type: String },
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
    if (!this.kit.length) return html``;
    return html`
      <div class="toolbar-separator">Formes standard</div>
      <flex-toolbar>
        ${this.kit.map(family => {
          return html`
            <canvas-button
              name="create_shape"
              .family="${family}"
              ?active="${family === this.selectedFamily}"
              @click="${event => app.setState(event.target.name, event.target.family)}"
            >
            </canvas-button>
          `;
        })}
      </flex-toolbar>
    `;
  }
}
customElements.define('toolbar-kit', ToolbarKit);
