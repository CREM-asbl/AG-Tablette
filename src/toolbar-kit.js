import { app } from './Core/App';
import { LitElement, html, css } from 'lit-element';
import './canvas-button';
import { TemplateToolbar } from './template-toolbar';

class ToolbarKit extends LitElement {
  static get properties() {
    return {
      familyNames: { type: Array },
      selectedFamily: { type: String },
    };
  }

  static get styles() {
    return [TemplateToolbar.templateToolbarStyles()];
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
        (this.selectedFamily = event.detail.selectedFamily
          ? event.detail.selectedFamily
          : '')
    );
  }

  render() {
    if (!this.familyNames.length) return html``;
    return html`
      <template-toolbar>
        <h2 slot="title">${app.environment.kitName}</h2>
        <div slot="body">
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
        </div>
      </template-toolbar>
    `;
  }
}
customElements.define('toolbar-kit', ToolbarKit);
