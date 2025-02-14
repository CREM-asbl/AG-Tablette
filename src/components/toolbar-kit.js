import '@components/icon-button';
import { html, LitElement } from 'lit';
import { app, setState } from '../controllers/Core/App';
import './template-toolbar';

class ToolbarKit extends LitElement {
  static properties = {
    kit: { type: Object },
    selectedFamily: { type: String },
    helpSelected: { type: Boolean },
  }

  render() {
    const familyNames = this.kit.families.filter(family => family.isVisible).map(family => family.name)
    if (!familyNames.length) return
    return html`
      <template-toolbar>
        <h2 slot="title">${this.kit.name}</h2>
        <div slot="body">
          ${familyNames.map((familyName) => html`
              <icon-button
                name="${this.kit.families.find(family => family.name == familyName).shapeTemplates[0].name}"
                type="Create"
                title="${familyName}"
                ?active="${familyName === this.selectedFamily}"
                ?helpanimation="${this.helpSelected}"
                @click="${this._actionHandle}"
              >
              </icon-button>
            `)}
        </div>
      </template-toolbar>
    `;
  }

  _actionHandle(event) {
    if (this.helpSelected) {
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
