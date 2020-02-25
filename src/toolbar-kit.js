import { app } from './Core/App';
import { LitElement, html, css } from 'lit-element';
import './flex-toolbar';
import './canvas-button';

class ToolbarKit extends LitElement {
  static get properties() {
    return {
      familyNames: { type: Array },
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

  constructor() {
    super();

    this.familyNames = app.environment.familyNames || [];

    window.addEventListener('families-loaded', () => {
      this.familyNames = [...app.environment.familyNames];
    });
    window.addEventListener(
      'family-selected',
      event =>
        (this.selectedFamily = event.detail.selectedFamily ? event.detail.selectedFamily : ''),
    );
  }

  render() {
    if (!this.familyNames.length) return html``;
    return html`
      <div class="toolbar-separator">${app.environment.kitName}</div>
      <flex-toolbar>
        ${this.familyNames.map(family => {
          return html`
            <canvas-button
              name="create_shape"
              familyName="${family}"
              ?active="${family === this.selectedFamily}"
              @click="${event => app.setState(event.target.name, event.target.familyName)}"
            >
            </canvas-button>
          `;
        })}
      </flex-toolbar>
    `;
  }
}
customElements.define('toolbar-kit', ToolbarKit);
