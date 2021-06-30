import { app, setState } from './Core/App';
import { LitElement, html, css } from 'lit';
import './canvas-button';
import { TemplateToolbar } from './template-toolbar';

class ToolbarKit extends LitElement {
  static get properties() {
    return {
      familyNames: { type: Array },
      selectedFamily: { type: String },
      envName: { type: String },
      iconSize: { type: Number },
    };
  }

  static get styles() {
    return [TemplateToolbar.templateToolbarStyles()];
  }

  constructor() {
    super();

    this.updateProperties = () => {
      this.iconSize = app.menuIconSize;
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };

    window.addEventListener('menuIconSize-changed', this.eventHandler);

    this.familyNames = app.environment.familyNames || [];
    this.envName = app.environment.kitName;

    window.addEventListener('environment-changed', () => {
      this.familyNames = app.environment.familyNames;
      this.envName = app.environment.kitName;
    });
    window.addEventListener(
      'tool-changed',
      () => (this.selectedFamily = app.tool?.selectedFamily),
    );
  }

  render() {
    if (!this.familyNames.length) return html``;
    return html`
      <template-toolbar>
        <h2 slot="title">${app.environment.kitName}</h2>
        <div slot="body">
          ${this.familyNames.map((family) => {
            return html`
              <canvas-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                familyName="${family}"
                title="${family}"
                ?active="${family === this.selectedFamily}"
                @click="${() => {
                  if (app.fullHistory.isRunning) {
                    console.warn('cannot interact when fullHisto is running');
                    return;
                  }
                  setState({
                    tool: {
                      name: 'create',
                      selectedFamily: family,
                      currentStep: 'start',
                    },
                  });
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
