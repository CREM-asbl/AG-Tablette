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

  constructor() {
    super();
    this._filteredFamilies = [];
    this._lastKit = null;
    this._pendingUpdate = false;
  }

  shouldUpdate(changedProperties) {
    // Optimiser les rendus en ne mettant à jour que si les propriétés pertinentes changent
    if (changedProperties.has('kit') || changedProperties.has('selectedFamily') ||
      changedProperties.has('helpSelected')) {
      return true;
    }
    return super.shouldUpdate(changedProperties);
  }

  // Memoize les familles filtrées pour éviter les calculs inutiles
  _getFilteredFamilies() {
    if (this._lastKit !== this.kit || !this._filteredFamilies.length) {
      this._filteredFamilies = this.kit?.families?.filter(family => family.isVisible) || [];
      this._lastKit = this.kit;
    }
    return this._filteredFamilies;
  }

  render() {
    if (!this.kit) return null;

    const families = this._getFilteredFamilies();
    if (!families.length) return null;

    const familyNames = families.map(family => family.name);

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
    if (this._pendingUpdate) return;

    // Limiter la fréquence des mises à jour
    this._pendingUpdate = true;
    requestAnimationFrame(() => {
      this._pendingUpdate = false;
    });

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
