import { app } from '../Core/App';
import { LitElement, html, css } from 'lit-element';
import { TemplatePopup } from './template-popup';
import { Settings } from '../Core/Settings';
import '../version-item';

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

    window.addEventListener('close-popup', () => this.close());
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
     <template-popup>
      <h2 slot="title">Paramètres</h2>
      <div slot="body">
        <fieldset>
            <legend>Général</legend>

            <div class="field">
              <input
                type="checkbox"
                name="settings_adapt_shapes_position"
                id="settings_adapt_shapes_position"
                .checked="${this.settings.data.automaticAdjustment}"
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
                <option value="1" ?selected="${this.settings.data.shapesSize === 1}">
                  1
                </option>
                <option value="2" ?selected="${this.settings.data.shapesSize === 2}">
                  2
                </option>
                <option value="3" ?selected="${this.settings.data.shapesSize === 3}">
                  3
                </option>
              </select>
            </div>

            <div class="field">
              <input
                type="checkbox"
                name="settings_pointed_shapes"
                id="settings_pointed_shapes"
                .checked="${this.settings.data.areShapesPointed}"
                @change="${this._actionHandle}"
              />
              <label for="settings_pointed_shapes">Formes pointées</label>
            </div>
          </fieldset>
        </div>
          <div slot="footer">
            <version-item></version-item>
            <button @click="${() => app.resetSettings()}">Paramètres par défaut</button>
            <button @click="${this.close}">OK</button>
          </div>
      </div>
     </template-popup>
    `;
  }

  close() {
    this.style.display = 'none';
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'settings_adapt_shapes_position':
        app.settings.set('automaticAdjustment', event.target.checked);
        window.dispatchEvent(new CustomEvent('app-settings-changed'));
        break;

      case 'settings_shapes_size':
        app.settings.set('shapesSize', parseInt(event.target.value));
        window.dispatchEvent(new CustomEvent('app-settings-changed'));
        break;

      case 'settings_pointed_shapes':
        app.settings.set('areShapesPointed', event.target.checked);
        window.dispatchEvent(new CustomEvent('app-settings-changed'));
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
