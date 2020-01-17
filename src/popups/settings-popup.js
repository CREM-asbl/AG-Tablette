import { LitElement, html, css } from 'lit-element';
import '../version-item';
import { app } from '../js/App';
import { Settings } from '../js/Settings';
import { TemplatePopup } from './template-popup';

class SettingsPopup extends LitElement {
  static get properties() {
    return {
      settings: Settings,
    };
  }

  constructor() {
    super();
    this.settings = app.settings;
    addEventListener('app-settings-changed', () => (this.settings = { ...app.settings }));
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        version-item {
          margin-right: 8px;
        }
      `,
    ];
  }

  render() {
    return html`
     <template-popup @close-popup="${() => (this.style.display = 'none')}">
      <h2 slot="title">Paramètres</h2>
      <div slot="body">
        <fieldset>
            <legend>Général</legend>

            <div class="field">
              <input
                type="checkbox"
                name="settings_adapt_shapes_position"
                id="settings_adapt_shapes_position"
                .checked="${this.settings.data.automaticAdjustment.value}"
                @change="${this._actionHandle}"
              />
              <label for="settings_adapt_shapes_position">Ajustement automatique</label>
            </div>
          </fieldset>

          <br />

          <fieldset>
            <legend>Formes</legend>

            <div class="field">
              <label for="settings_shapes_size">Taille des formes</label>
              <select
                name="settings_shapes_size"
                id="settings_shapes_size"
                @change="${this._actionHandle}"
              >
                <option value="1" ?selected="${this.settings.data.shapesSize.value === 1}">
                  1
                </option>
                <option value="2" ?selected="${this.settings.data.shapesSize.value === 2}">
                  2
                </option>
                <option value="3" ?selected="${this.settings.data.shapesSize.value === 3}">
                  3
                </option>
              </select>
            </div>

            <div class="field">
              <input
                type="checkbox"
                name="settings_pointed_shapes"
                id="settings_pointed_shapes"
                .checked="${this.settings.data.areShapesPointed.value}"
                @change="${this._actionHandle}"
              />
              <label for="settings_pointed_shapes">Formes pointées</label>
            </div>
          </fieldset>
        </div>
          <div slot="footer">
            <version-item></version-item>
            <button @click="${() => app.resetSettings()}">Paramètres par défaut</button>
            <button @click="${() => (this.style.display = 'none')}">OK</button>
          </div>
      </div>
     </template-popup>
    `;
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'settings_adapt_shapes_position':
        app.settings.set('automaticAdjustment', event.target.checked);
        this.settings.data.automaticAdjustment.value = event.target.checked;
        break;

      case 'settings_shapes_size':
        app.settings.set('shapesSize', parseInt(event.target.value));
        this.settings.data.shapesSize.value = event.target.value;
        break;

      case 'settings_pointed_shapes':
        app.settings.set('areShapesPointed', event.target.checked);
        this.settings.data.areShapesPointed.value = event.target.checked;
        window.dispatchEvent(new CustomEvent('refresh'));
        break;

      default:
        console.log(
          'Settings: paramètre inconnu: ' +
            event.target.name +
            ' ' +
            event.target.value +
            ' ' +
            event.target.checked,
        );
    }
    this.settings = { ...this.settings };
  }
}
customElements.define('settings-popup', SettingsPopup);
