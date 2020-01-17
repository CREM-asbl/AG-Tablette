import { LitElement, html } from 'lit-element';
import { app } from '../js/App';
import { TemplatePopup } from './template-popup';

class GridPopup extends LitElement {
  constructor() {
    super();

    window.dispatchEvent(new CustomEvent('app-settings-changed'));
    window.addEventListener('workspace-settings-changed', () => {
      if (app.workspace) {
        this.isGridShown = app.workspace.settings.get('isGridShown');
        this.gridType = app.workspace.settings.get('gridType');
        this.gridSize = app.workspace.settings.get('gridSize');
      }
    });
  }

  static get properties() {
    return {
      isGridShown: Boolean,
      gridType: String,
      gridSize: Number,
    };
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup @close-popup="${() => this.gridPopupValidate()}">
        <h2 slot="title">Opacité</h2>
        <div slot="body" id="body">
          <div class="field" style="margin-left:8px">
            <label for="grid_popup_grid_type">Type de grille </label>
            <select
              name="grid_popup_grid_type"
              id="grid_popup_grid_type"
              @change="${this._actionHandle}"
            >
              <option value="none" ?selected="${this.gridType === 'none'}">
                Aucune
              </option>
              <option value="square" ?selected=${this.gridType === 'square'}>
                Carrés
              </option>
              <option value="triangle" ?selected=${this.gridType === 'triangle'}>
                Triangles
              </option>
            </select>
          </div>

          <br />

          <div class="field" style="margin-left:8px">
            <label for="grid_popup_grid_size">Taille de la grille </label>
            <select
              name="grid_popup_grid_size"
              id="grid_popup_grid_size"
              @change="${this._actionHandle}"
              ?disabled="${this.gridType === 'none'}"
            >
              <option
                value="0.333333333333333"
                ?selected="${Math.abs(this.gridSize - 0.3333333333333) < 0.0001}"
              >
                1/3
              </option>
              <option value="0.5" ?selected="${this.gridSize === 0.5}">
                1/2
              </option>
              <option value="1" ?selected="${this.gridSize === 1}">
                1
              </option>
              <option value="2" ?selected="${this.gridSize === 2}">
                2
              </option>
              <option value="3" ?selected="${this.gridSize === 3}">
                3
              </option>
            </select>
          </div>
        </div>

        <div slot="footer">
          <button @click="${this.gridPopupValidate}">OK</button>
        </div>
      </template-popup>
    `;
  }

  gridPopupValidate() {
    this.style.display = 'none';
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'grid_popup_grid_size':
        app.workspace.settings.set('gridSize', event.target.value);
        window.dispatchEvent(new CustomEvent('workspace-settings-changed'));
        window.dispatchEvent(new CustomEvent('refreshBackground'));
        break;

      case 'grid_popup_grid_type':
        app.workspace.settings.set('gridType', event.target.value);
        this.shadowRoot.getElementById('grid_popup_grid_size').disabled =
          event.target.value === 'none';
        app.workspace.settings.set('isGridShown', event.target.value !== 'none');
        window.dispatchEvent(new CustomEvent('workspace-settings-changed'));
        window.dispatchEvent(new CustomEvent('refreshBackground'));
        break;

      default:
        console.log(
          'Grid popup: paramètre inconnu: ' +
            event.target.name +
            ' ' +
            event.target.value +
            ' ' +
            event.target.checked,
        );
    }
  }
}
customElements.define('grid-popup', GridPopup);
