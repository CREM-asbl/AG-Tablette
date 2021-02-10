import { app } from './Core/App';
import { LitElement, html, css } from 'lit-element';
import './flex-toolbar';
import './canvas-button';

class ToolbarKit extends LitElement {
  static get properties() {
    return {
      familyNames: { type: Array },
      selectedFamily: { type: String },
      envName: { type: String },
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
    this.envName = app.environment.kitName;

    window.addEventListener('state-changed', () => {
      this.familyNames = app.environment.familyNames;
      this.envName = app.environment.kitName;
    });
    window.addEventListener(
      'family-selected',
      event =>
        (this.selectedFamily = event.detail.selectedFamily
          ? event.detail.selectedFamily
          : '')
    );
  }

  render() {
    if (!this.familyNames.length) return html``;
    return html`
      <div class="toolbar-separator">${this.envName}</div>
      <flex-toolbar>
        ${this.familyNames.map(family => {
          return html`
            <canvas-button
              familyName="${family}"
              title="${family}"
              ?active="${family === this.selectedFamily}"
              @click="${event => {
                app.setState('createShape', event.target.familyName);
                this.selectedFamily = event.target.familyName;
              }}"
            >
            </canvas-button>
          `;
        })}
      </flex-toolbar>
    `;
  }
}
customElements.define('toolbar-kit', ToolbarKit);
