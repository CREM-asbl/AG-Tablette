import { LitElement, html } from 'lit-element';
import '../version-item';
import { app } from '../js/App';
import { Settings } from '../js/Settings';

class AppSettings extends LitElement {
  static get properties() {
    return {
      settings: Settings,
    };
  }

  constructor() {
    super();
    this.settings = app.settings;
    addEventListener('app-settings-changed', () => (this.settings = { ...app.settings }));
    addEventListener('keyup', e => {
      e.key === 'Escape' && (this.style.display = 'none');
    });
  }

  render() {
    return html`
      <style>
        :host {
          display: none;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          position: absolute;
          top: 0px;
          left: 0px;
          z-index: 100;
        }

        #app-settings-view {
          position: absolute;
          left: 2%;
          top: 2%;
          right: 2%;
          bottom: 2%;
          border-radius: 10px;
          border: 2px solid gray;
          background-color: #ddd;
          overflow-y: hidden;
        }

        #popup-close {
          position: relative;
          font-size: 60px;
          float: right;
          cursor: pointer;
          color: #555;
          box-sizing: content-box;
          width: 30px;
          height: 30px;
          margin: 8px;
          overflow: hidden;
          line-height: 40%;
        }

        h2 {
          padding: 16px;
          margin: 0;
        }

        .app-settings-form {
          height: calc(100% - 160px);
          overflow: auto;
          padding: 16px;
        }

        .field {
          display: flex;
          align-items: center;
          padding: 8px 0;
        }

        select {
          height: 32px;
          width: 150px;
        }

        input[type='checkbox'] {
          height: 24px;
          width: 24px;
        }

        label {
          display: block;
          margin: 0 16px;
          font-weight: bold;
          font-size: 1rem;
        }

        footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
        }

        button {
          padding: 8px 16px;
          margin: 0 4px;
        }

        version-item {
          flex: 1;
        }
      </style>

      <div id="app-settings-view">
        <div id="popup-close" @click="${() => (this.style.display = 'none')}">
          &times;
        </div>

        <h2>Paramètres</h2>
        <div class="app-settings-form">
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
        <footer>
          <version-item></version-item>
          <button @click="${() => app.resetSettings()}">Paramètres par défaut</button>
          <button @click="${() => (this.style.display = 'none')}">OK</button>
        </footer>
      </div>
    `;
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'settings_adapt_shapes_position':
        app.settings.update('automaticAdjustment', event.target.checked);
        this.settings.data.automaticAdjustment.value = event.target.checked;
        break;

      case 'settings_shapes_size':
        app.settings.update('shapesSize', parseInt(event.target.value));
        this.settings.data.shapesSize.value = event.target.value;
        break;

      case 'settings_pointed_shapes':
        app.settings.update('areShapesPointed', event.target.checked);
        this.settings.data.areShapesPointed.value = event.target.checked;
        app.drawAPI.askRefresh('main');
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
customElements.define('app-settings', AppSettings);
