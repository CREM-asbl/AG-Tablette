import '@components/color-button';
import { app, setState } from '@controllers/Core/App';
import { createElem } from '@controllers/Core/Tools/general';
import '@controllers/version-item';
import { LitElement, css, html } from 'lit';

class SettingsPopup extends LitElement {
  static properties = {
    settings: { type: Array },
  };

  constructor() {
    super();
    this.settings = { ...app.settings };
    window.addEventListener(
      'settings-changed',
      () => (this.settings = { ...app.settings }),
    );
    window.addEventListener('close-popup', () => this.close());
  }

  static styles = css`
    .field {
      display: flex;
      align-items: center;
      padding: 8px 0;
      width: 100%;
    }

    select {
      height: 32px;
      width: auto;
      border-radius: 4px;
    }

    input {
      height: 24px;
      width: auto;
      border-radius: 4px;
    }

    input[type='checkbox'] {
      height: 24px;
      width: 24px;
    }

    label {
      font-weight: normal;
      margin: 0 8px;
      font-size: 1rem;
    }

    version-item {
      margin-right: 8px;
    }

    fieldset {
      width: 100%;
      box-sizing: border-box;
      border-radius: 4px;
    }

    [slot='body'] {
      gap: 8px;
    }
  `;


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

            ${app.environment.name === 'Geometrie'
        ? html` <div class="field">
                    <input
                      type="checkbox"
                      name="settings_animation_in_geometry_tranformations"
                      id="settings_animation_in_geometry_tranformations"
                      .checked="${this.settings
            .geometryTransformationAnimation}"
                      @change="${this._actionHandle}"
                    />
                    <label for="settings_animation_in_geometry_tranformations"
                      >Animation des tranformations</label
                    >
                  </div>`
        : ''
      }

            <div class="field">
              <color-button @click="${this.openToolChoicePopup}">
                Choix des outils disponibles
              </color-button>
            </div>
          </fieldset>

          ${app.environment.name !== 'Tangram'
        ? html` <fieldset>
                  <legend>Figures</legend>
                  ${app.environment.name === 'Grandeurs'
            ? html` <div class="field">
                        <label for="settings_shapes_size"
                          >Taille des figures</label
                        >
                        <select
                          name="settings_shapes_size"
                          id="settings_shapes_size"
                          @change="${this._actionHandle}"
                        >
                          <option
                            value="1"
                            ?selected="${this.settings.shapesSize === 1}"
                          >
                            1
                          </option>
                          <option
                            value="2"
                            ?selected="${this.settings.shapesSize === 2}"
                          >
                            2
                          </option>
                          <option
                            value="3"
                            ?selected="${this.settings.shapesSize === 3}"
                          >
                            3
                          </option>
                        </select>
                      </div>`
            : ''}

                  <div class="field">
                    <input
                      type="checkbox"
                      name="settings_shapes_pointed"
                      id="settings_shapes_pointed"
                      .checked="${this.settings.areShapesPointed}"
                      @change="${this._actionHandle}"
                    />
                    <label for="settings_shapes_pointed"
                      >Figures pointées</label
                    >
                  </div>
                </fieldset>`
        : ''
      }
          </div>

          <footer slot="footer">
            <version-item></version-item>
            <color-button @click="${() => app.resetSettings()}">Paramètres par défaut</color-button>
            <color-button @click="${this.close}">OK</color-button>
          </footer>
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

  openToolChoicePopup() {
    import('./tool-choice-popup');
    createElem('tool-choice-popup');
    this.close();
  }
}
customElements.define('settings-popup', SettingsPopup);
