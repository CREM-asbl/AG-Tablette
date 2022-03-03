import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';
import { Settings } from '../Core/Settings';
import '../version-item';
import { TemplatePopup } from './template-popup';

class SettingsPopup extends LitElement {
  static get properties() {
    return {
      settings: Settings,
    };
  }

  constructor() {
    super();
    this.settings = { ...app.settings };

    addEventListener(
      'settings-changed',
      () => (this.settings = { ...app.settings }),
    );
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

  updated() {
    window.setTimeout(
      () => this.shadowRoot.querySelector('#focus').focus(),
      200,
    );
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Paramètres</h2>
        <div slot="body">
          <fieldset>
            <legend>Environnement général</legend>

            <div class="field">
              <input
                type="checkbox"
                name="settings_automatic_adjustment"
                id="settings_automatic_adjustment"
                .checked="${this.settings.automaticAdjustment}"
                @change="${this._actionHandle}"
              />
              <label for="settings_automatic_adjustment">Ajustement automatique</label>
            </div>

            <div class="field" style=${
              app.environment.name != 'Geometrie'
                ? 'display:none'
                : ''
            }>
              <input
                type="checkbox"
                name="settings_animation_in_geometry_tranformations"
                id="settings_animation_in_geometry_tranformations"
                .checked="${this.settings.geometryTransformationAnimation}"
                @change="${this._actionHandle}"
              />
              <label for="settings_animation_in_geometry_tranformations">Animation des tranformations</label>
            </div>
          </fieldset>

          <br />

          <fieldset style=${
            app.environment.name == 'Tangram'
              ? 'display:none'
              : ''
          }>
            <legend>Figures</legend>

            <div class="field" style=${
              app.environment.name == 'Cubes' ? 'display:none;' : ''
            }>
              <label for="settings_shapes_size">Taille des figures</label>
              <select
                name="settings_shapes_size"
                id="settings_shapes_size"
                @change="${this._actionHandle}"
              >
                <option value="1" ?selected="${this.settings.shapesSize === 1}">
                  1
                </option>
                <option value="2" ?selected="${this.settings.shapesSize === 2}">
                  2
                </option>
                <option value="3" ?selected="${this.settings.shapesSize === 3}">
                  3
                </option>
              </select>
            </div>

            <div class="field" style=${
              app.environment.name == 'Tangram' ? 'display:none;' : ''
            }>
              <input
                type="checkbox"
                name="settings_shapes_pointed"
                id="settings_shapes_pointed"
                .checked="${this.settings.areShapesPointed}"
                @change="${this._actionHandle}"
              />
              <label for="settings_shapes_pointed">Figures pointées</label>
            </div>
          </fieldset>
          </div>
          <div slot="footer">
            <version-item></version-item>
            <color-button @click="${() => app.resetSettings()}" innerText="Paramètres par défaut"></color-button>
            <color-button id="focus" @click="${this.close}" innerText="OK"></color-button>
          </div>
        </div>
      </template-popup>
    `;
  }

  close() {
    this.remove();
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'settings_automatic_adjustment':
        setState({
          settings: {
            ...app.settings,
            automaticAdjustment: event.target.checked,
          },
        });
        break;

      case 'settings_animation_in_geometry_tranformations':
        setState({
          settings: {
            ...app.settings,
            geometryTransformationAnimation: event.target.checked,
          },
        });
        break;

      case 'settings_shapes_size':
        setState({
          settings: {
            ...app.settings,
            shapesSize: parseInt(event.target.value),
          },
        });
        break;

      case 'settings_shapes_pointed':
        setState({
          settings: {
            ...app.settings,
            areShapesPointed: event.target.checked,
          },
        });
        window.dispatchEvent(new CustomEvent('refresh'));
        break;

      default:
        console.error(
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
