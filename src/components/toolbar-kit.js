import { html, LitElement } from 'lit';
import { app, setState } from '../controllers/Core/App';
import { TemplateToolbar } from './template-toolbar';

class ToolbarKit extends LitElement {
  static properties = {
    familyNames: { type: Array },
    selectedFamily: { type: String },
    envName: { type: String },
    helpSelected: { type: Boolean },
  }


  static styles = [TemplateToolbar.templateToolbarStyles()];

  constructor() {
    super();
    this.updateProperties = () => {
      this.familyNames = app.environment.families.filter(family => family.isVisible).map(family => family.name);
      this.helpSelected = app.helpSelected;
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };
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
    window.addEventListener('helpSelected-changed', this.eventHandler);
  }

  render() {
    console.log(app.environment)
    console.log('render toolbar-kit', this.familyNames)
    if (!this.familyNames.length) return html``;
    return html`
      <template-toolbar>
        <h2 slot="title">${app.environment.kitName}</h2>
        <div slot="body">
          ${this.familyNames.map((familyName) => {
      return html`
              <icon-button
                name="${app.environment.families.find(family => family.name == familyName).shapeTemplates[0].name}"
                type="Create"
                title="${familyName}"
                ?active="${familyName === this.selectedFamily}"
                ?helpanimation="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
              </icon-button>
            `;
    })}
        </div>
      </template-toolbar>
    `;
  }

  _actionHandle(event) {
    if (app.helpSelected) {
      window.dispatchEvent(new CustomEvent('helpToolChosen', { detail: { toolname: 'create' } }));
      setState({ helpSelected: false });
    } else if (!app.fullHistory.isRunning) {
      setState({
        tool: {
          name: 'create',
          selectedFamily: event.target.title,
          currentStep: 'start',
        },
      });
    }
  }
}
customElements.define('toolbar-kit', ToolbarKit);
