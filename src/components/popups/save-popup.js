import '@components/color-button';
import { app } from '@controllers/Core/App';
import { SaveFileManager } from '@controllers/Core/Managers/SaveFileManager';
import '@controllers/version-item';
import { css, html, LitElement } from 'lit';
import { TemplatePopup } from './template-popup';

class SavePopup extends LitElement {
  static properties = {
    filename: { type: String },
    saveSettings: { type: Boolean },
    saveHistory: { type: Boolean },
    imageFormat: { type: String },
    saveMethod: { type: String },
  }

  constructor() {
    super();
    this.filename = 'sans titre';
    this.imageFormat =
      SaveFileManager.extension == 'png' || SaveFileManager.extension == 'svg'
        ? SaveFileManager.extension
        : 'png';

    this.saveMethodOptions = [
      ['image', 'image'],
    ];
    if (app.environment.name == 'Tangram') {
      this.saveMethodOptions = [['silhouette', 'silhouette'], ...this.saveMethodOptions];
    }
    if (app.environment.name != 'Tangram') {
      this.saveMethodOptions = [['state', 'état'], ...this.saveMethodOptions];
    }

    this.saveMethod = this.saveMethodOptions[0][0];

    this.saveSettings = true;
    this.saveHistory = this.saveMethod != 'silhouette';
    this.permanentHide = false;

    window.addEventListener('close-popup', () => this.close());
  }

  static styles = [
    TemplatePopup.template_popup_styles(),
    css`
        .invisible {
          display: none;
        }
      `
  ]

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Enregistrer</h2>
        <div slot="body" id="body">
          <div class="${SaveFileManager.hasNativeFS ? 'invisible' : ''}"
          >
            <label for="save_popup_saveMethod" style="display:inline">
              Méthode d'enregistrement
            </label>
            <select
              name="save_popup_saveMethod"
              id="save_popup_saveMethod"
              @change="${this._actionHandle}"
            >
              ${this.saveMethodOptions.map(option => html`
                <option value="${option[0]}" ?selected="${this.saveMethod == '${option[0]}'}">
                  ${option[1]}
                </option>
              `)}
            </select>
            <br /><br />
          </div>

          <div class="${this.saveMethod != 'state' ? 'invisible' : ''}">
            <div class="field">
              <input
                type="checkbox"
                name="save_popup_settings"
                id="save_popup_settings"
                ?checked="${this.saveSettings}"
                @change="${this._actionHandle}"
              />
              <label for="save_popup_settings"
                >Enregistrer les paramètres</label
              >
            </div>

            <div class="field">
              <input
                type="checkbox"
                name="save_popup_history"
                id="save_popup_history"
                ?checked="${this.saveHistory}"
                @change="${this._actionHandle}"
              />
              <label for="save_popup_history">Enregistrer l'historique</label>
            </div>
            ${app.environment.name === 'Geometrie' ? html`
            <div class="field">
              <input
                type="checkbox"
                name="save_popup_permanent_hide"
                id="save_popup_permanent_hide"
                ?checked="${this.permanentHide}"
                @change="${this._actionHandle}"
              />
              <label for="save_popup_permanent_hide">Cacher de façon permanente</label>
            </div>` : ''}
          </div>

          <div class="${this.saveMethod != 'silhouette' ? 'invisible' : ''}">
            <div class="field">
              <input
                type="checkbox"
                name="save_popup_settings"
                id="save_popup_settings"
                ?checked="${this.saveSettings}"
                @change="${this._actionHandle}"
              />
              <label for="save_popup_settings"
                >Enregistrer les paramètres</label
              >
            </div>
          </div>

          <div class="${this.saveMethod != 'image' ? 'invisible' : ''}">
            <label for="save_popup_image_format" style="display:inline">Format</label>
            <select name="save_popup_image_format"
                    id="save_popup_image_format"
                    @change="${this._actionHandle}">
              <option value="png" ?selected="${this.imageFormat == 'png'}">
                png
              </option>
              <option value="svg" ?selected="${this.imageFormat == 'svg'}">
                svg
              </option>
            </select>
          </div>

          <div class="${SaveFileManager.hasNativeFS ? 'invisible' : ''}">
            <br />
            <label for="save_popup_filename" style="display:inline">Nom du fichier</label>
            <input
              type="text"
              name="save_popup_filename"
              id="save_popup_filename"
              onFocus="this.select()"
              value="${this.filename}"
              @change="${this._actionHandle}"
            />
          </div>
        </div>

        <div slot="footer">
          <color-button name="save_popup_submit" @click="${this._actionHandle}">
            OK
          </color-button>
        </div>
      </template-popup>
    `;
  }

  close() {
    window.dispatchEvent(
      new CustomEvent('file-selected', {
        detail: {},
      }),
    );
    this.remove();
  }

  _actionHandle(event) {
    switch (event.target.name) {
      case 'save_popup_settings':
        this.saveSettings = !this.saveSettings;
        break;

      case 'save_popup_history':
        this.saveHistory = !this.saveHistory;
        break;

      case 'save_popup_permanent_hide':
        this.permanentHide = !this.permanentHide;
        break;

      case 'save_popup_filename':
        this.filename = event.target.value;
        if (!this.filename) this.filename = 'sans titre';
        break;

      case 'save_popup_submit':
        let extension = '';
        switch (this.saveMethod) {
          case 'state':
            extension = app.environment.extensions[0];
            break;
          case 'silhouette':
            extension = app.environment.extensions[1];
            break;
          default:
            extension = '.' + this.imageFormat;
            break;
        }
        let name = this.filename + extension,
          saveSettings = this.saveSettings,
          saveHistory = this.saveHistory,
          saveMethod = this.saveMethod,
          permanentHide = this.permanentHide;
        if (saveMethod == 'silhouette')
          saveHistory = false;
        this.remove();
        setTimeout(() =>
          window.dispatchEvent(
            new CustomEvent('file-selected', {
              detail: {
                name,
                saveSettings,
                saveHistory,
                saveMethod,
                permanentHide,
              },
            })
          ),
          300
        );
        break;

      case 'save_popup_image_format':
        this.imageFormat = event.target.value;
        break;

      case 'save_popup_saveMethod':
        this.saveMethod = event.target.value;
        break;

      default:
        console.error(
          'SavePopup: paramètre inconnu: ' +
          event.target.name +
          ' ' +
          event.target.value +
          ' ' +
          event.target.checked,
        );
    }
  }
}
customElements.define('save-popup', SavePopup);
