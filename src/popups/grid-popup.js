import { LitElement, html } from 'lit-element';
import { app } from '../js/App';
import { TemplatePopup } from './template-popup';

class GridPopup extends LitElement {
  constructor() {
    super();
    app.popups.grid = this;
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup @close-popup="${() => this.gridPopupValidate()}">
        <h2 slot="title">Grille</h2>
        <div slot="body" id="body">
          <div class="field" style="margin-left:8px">
            <label for="grid_popup_grid_type">Type de grille </label>
            <select
              name="grid_popup_grid_type"
              id="grid_popup_grid_type"
              @change="${this._actionHandle}"
            >
              <option value="none" ?selected="${app.workspace.settings.get('gridType') === 'none'}">
                Aucune
              </option>
              <option
                value="square"
                ?selected=${app.workspace.settings.get('gridType') === 'square'}
              >
                Carrés
              </option>
              <option
                value="triangle"
                ?selected=${app.workspace.settings.get('gridType') === 'triangle'}
              >
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
              ?disabled="${app.workspace.settings.get('gridType') === 'none'}"
            >
              <option
                value="0.333333333333333"
                ?selected="${Math.abs(app.workspace.settings.get('gridSize') - 0.3333333333333) <
                  0.0001}"
              >
                1/3
              </option>
              <option value="0.5" ?selected="${app.workspace.settings.get('gridSize') === 0.5}">
                1/2
              </option>
              <option value="1" ?selected="${app.workspace.settings.get('gridSize') === 1}">
                1
              </option>
              <option value="2" ?selected="${app.workspace.settings.get('gridSize') === 2}">
                2
              </option>
              <option value="3" ?selected="${app.workspace.settings.get('gridSize') === 3}">
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

  //TODO : essayer de supprimer et remplacer par fonctionnement "automatique" de Lit-element
  updatePopup() {
    let typeElem = this.shadowRoot.getElementById('grid_popup_grid_type'),
      sizeElem = this.shadowRoot.getElementById('grid_popup_grid_size');
    typeElem.disabled = app.workspace.settings.get('isGridShown');
    sizeElem.disabled = app.workspace.settings.get('isGridShown');

    typeElem.value = app.workspace.settings.get('gridType');

    let gridSize = app.workspace.settings.get('gridSize');
    if (Math.abs(gridSize - 0.3333333333333) < 0.0001) {
      sizeElem.value = '0.333333333333333';
    } else {
      sizeElem.value = gridSize;
    }
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
        app.workspace.settings.update('gridSize', event.target.value);
        app.drawAPI.askRefresh('background');
        break;

      case 'grid_popup_grid_type':
        app.workspace.settings.update('gridType', event.target.value);
        this.shadowRoot.getElementById('grid_popup_grid_size').disabled =
          event.target.value === 'none';
        app.workspace.settings.update('isGridShown', event.target.value !== 'none');
        app.drawAPI.askRefresh('background');
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
