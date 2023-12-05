import '@components/color-button';
import { html, LitElement } from 'lit';
import { app, setState } from '../Core/App';
import { TemplatePopup } from './template-popup';

class GridPopup extends LitElement {
  constructor() {
    super();

    window.addEventListener(
      'close-popup',
      () => {
        this.submitAndClose();
      },
      {
        once: true,
      },
    );

    this.updateProperties = () => {
      this.gridType = app.settings.gridType;
      this.gridSize = app.settings.gridSize;
      this.gridShown = app.settings.gridType !== 'none';
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };
    window.addEventListener('settings-changed', this.eventHandler);
  }

  static get properties() {
    return {
      gridShown: Boolean,
      gridType: String,
      gridSize: Number,
    };
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Grille</h2>
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
              <option
                value="square"
                ?selected=${this.gridType === 'square'}
              >
                Carrés
              </option>
              <option
                value="horizontal-triangle"
                ?selected=${this.gridType === 'horizontal-triangle'}
              >
                ${app.environment.name == 'Geometrie'
        ? 'Triangles'
        : 'Triangles 1'}
              </option>
              <option
                style=${app.environment.name == 'Geometrie'
        ? 'display:none'
        : ''}
                value="vertical-triangle"
                ?selected=${this.gridType === 'vertical-triangle'}
              >
                Triangles 2
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
                ?selected="${this.gridSize == 0.333333333333333}"
              >
                1/3
              </option>
              <option value="0.5" ?selected="${this.gridSize == 0.5}">
                1/2
              </option>
              <option value="1" ?selected="${this.gridSize == 1}">1</option>
              <option value="2" ?selected="${this.gridSize == 2}">2</option>
              <option value="3" ?selected="${this.gridSize == 3}">3</option>
            </select>
          </div>
        </div>

        <div slot="footer">
          <color-button @click="${() => window.dispatchEvent(new CustomEvent('close-popup'))}" innerText="Ok"></color-button>
        </div>
      </template-popup>
    `;
  }

  submit() {
    setState({ tool: null });
  }

  close() {
    this.remove();
    window.removeEventListener('settings-changed', this.eventHandler);
  }

  submitAndClose() {
    this.submit();
    this.close();
    if (!app.fullHistory.isRunning) {
      window.dispatchEvent(
        new CustomEvent('actions-executed', {
          detail: { name: 'Grille' },
        }),
      );
    }
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'grid_popup_grid_type':
        setState({
          settings: {
            ...app.settings,
            gridType: event.target.value,
            gridShown: event.target.value !== 'none',
          },
        });
        break;

      case 'grid_popup_grid_size':
        setState({
          settings: {
            ...app.settings,
            gridSize: event.target.value,
          },
        });
        break;

      default:
        console.error(
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
