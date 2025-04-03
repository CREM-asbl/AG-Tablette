import '@components/icon-button';
import { LitElement, html } from 'lit';
import { app, setState } from '../controllers/Core/App';
import './template-toolbar';

class ToolbarSection extends LitElement {
  static properties = {
    title: { type: String },
    toolsType: { type: String },
    tools: { type: Array },
    helpSelected: { type: Boolean },
    selected: { type: String }
  }

  constructor() {
    super();
    // Pour éviter les rendus inutiles
    this._filteredTools = [];
    this._lastToolsType = '';
    this._lastTools = null;
    this._pendingUpdate = false;
  }

  shouldUpdate(changedProperties) {
    // Ne mettre à jour que si les props pertinentes ont changé
    if (changedProperties.has('toolsType') || changedProperties.has('tools') ||
      changedProperties.has('helpSelected') || changedProperties.has('selected')) {
      return true;
    }
    return super.shouldUpdate(changedProperties);
  }

  // Calcule les outils filtrés une seule fois entre les rendus
  _getFilteredTools() {
    // Vérifier si nous avons besoin de recalculer
    if (this._lastToolsType !== this.toolsType || this._lastTools !== this.tools || !this._filteredTools.length) {
      this._filteredTools = (this.tools || []).filter(
        (tool) => tool.type === this.toolsType && tool.isVisible && !tool.isDisable
      );
      this._lastToolsType = this.toolsType;
      this._lastTools = this.tools;
    }
    return this._filteredTools;
  }

  render() {
    const tools = this._getFilteredTools();
    if (!tools.length) return null;

    return html`
      <template-toolbar>
        <h2 slot="title">${this.title}</h2>
        <div slot="body">
          ${tools.map((tool) => html`
              <icon-button
                name="${tool.name}"
                type="State"
                title="${tool.title}"
                ?active="${tool.name === this.selected}"
                ?helpanimation="${this.helpSelected}"
                cantInteract="${this.helpSelected}"
                @click="${this._actionHandle}">
              </icon-button>`)}
        </div>
      </template-toolbar>
    `;
  }

  _actionHandle(event) {
    if (this._pendingUpdate) return;

    // Éviter les clics multiples rapides
    this._pendingUpdate = true;
    setTimeout(() => this._pendingUpdate = false, 100);

    if (this.helpSelected) {
      window.dispatchEvent(new CustomEvent('helpToolChosen', { detail: { toolname: event.target.name } }));
      setState({ helpSelected: false });
    } else if (!app.fullHistory.isRunning) {
      setState({ tool: { name: event.target.name, currentStep: 'start' } });
    }
  }
}
customElements.define('toolbar-section', ToolbarSection);
