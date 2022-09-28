import { html, LitElement } from 'lit';
import { app, setState } from './Core/App';
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
      this.familyNames = app.environment.families.filter(family => family.isVisible).map(family => family.name);
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };

    window.addEventListener('menuIconSize-changed', this.eventHandler);
    window.addEventListener('tools-changed', this.eventHandler);

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
          ${this.familyNames.map((familyName) => {
            return html`
              <icon-button
                style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
                name="${app.environment.families.find(family => family.name == familyName).shapeTemplates[0].name}"
                type="Create"
                title="${familyName}"
                ?active="${familyName === this.selectedFamily}"
                @click="${() => {
                  if (app.fullHistory.isRunning) {
                    console.info('cannot interact when fullHisto is running');
                    return;
                  }
                  setState({
                    tool: {
                      name: 'create',
                      selectedFamily: familyName,
                      currentStep: 'start',
                    },
                  });
                }}"
              >
              </icon-button>
            `;
          })}
        </div>
      </template-toolbar>
    `;
  }
}
customElements.define('toolbar-kit', ToolbarKit);
