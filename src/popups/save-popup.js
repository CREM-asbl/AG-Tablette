import { LitElement, html } from 'lit-element';
import '../version-item';
import { app } from '../js/App';
import { TemplatePopup } from './template-popup';
import { FileManager } from '../js/FileManager';

class SavePopup extends LitElement {
  static get properties() {
    return {
      filename: { type: String },
      save_settings: { type: Boolean },
      save_history: { type: Boolean },
      save_format: { type: String },
    };
  }

  constructor() {
    super();
    this.filename = 'untitled';
    this.save_settings = true;
    this.save_history = true;
    this.extension = 'agg';
    this.save_format = 'png';
    this.image_or_state = 'state';

    window.addEventListener('show-save-popup', () => {
      this.style.display = 'block';
    });

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Sauvegarder</h2>
        <div slot="body" id="body">
          <div style="display: ${FileManager.hasNativeFS ? 'none' : 'block'}">
            <label for="save_popup_image_or_state" style="display:inline"
              >Méthode de sauvegarde</label
            >
            <select
              name="save_popup_image_or_state"
              id="save_popup_image_or_state"
              @change="${this._actionHandle}"
            >
              <option value="state" ?selected="${this.image_or_state == 'state'}">
                état
              </option>
              <option value="image" ?selected="${this.image_or_state == 'image'}">
                image
              </option>
            </select>
            <br /><br />
          </div>

          <div class="part" id="state_form" style="display: block;">
            <div class="field">
              <input
                type="checkbox"
                name="save_popup_settings"
                id="save_popup_settings"
                ?checked="${this.save_settings}"
                @change="${this._actionHandle}"
              />
              <label for="save_popup_settings">Sauvegarder les paramètres</label>
            </div>

            <div class="field">
              <input
                type="checkbox"
                name="save_popup_history"
                id="save_popup_history"
                ?checked="${this.save_history}"
                @change="${this._actionHandle}"
              />
              <label for="save_popup_history">Sauvegarder l'historique</label>
            </div>
          </div>

          <div class="part" id="image_form" style="display: none;">
            <label for="save_popup_format" style="display:inline">Format</label>
            <select name="save_popup_format" id="save_popup_format" @change="${this._actionHandle}">
              <option value="png" ?selected="${this.save_format == 'png'}">
                png
              </option>
              <option value="svg" ?selected="${this.save_format == 'svg'}">
                svg
              </option>
            </select>
          </div>

          <div class="field" style="display: ${FileManager.hasNativeFS ? 'none' : 'block'}">
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
          <button name="save_popup_submit" id="save_popup_submit" @click="${this._actionHandle}">
            OK
          </button>
        </div>
      </template-popup>
    `;
  }

  close() {
    this.style.display = 'none';
  }

  getFileNameFromEnv() {
    switch (app.environment.name) {
      case 'Grandeurs':
        return 'agg';
      default:
        console.error('Unknown environment for file saving : ', app.environment.name);
        return 'agg';
    }
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'save_popup_settings':
        this.save_settings = !this.save_settings;
        break;

      case 'save_popup_history':
        this.save_history = !this.save_history;
        break;

      case 'save_popup_filename':
        this.filename = event.target.value;
        if (!this.filename) this.filename = 'untitled';
        break;

      case 'save_popup_submit':
        this.close();
        this.extension =
          this.image_or_state == 'state' ? this.getFileNameFromEnv() : this.save_format;
        window.dispatchEvent(
          new CustomEvent('file-selected', {
            detail: {
              name: this.filename + '.' + this.extension,
              save_settings: this.save_settings,
              save_history: this.save_history,
            },
          }),
        );
        break;

      case 'save_popup_format':
        this.save_format = event.target.value;
        break;

      case 'save_popup_image_or_state':
        this.image_or_state = event.target.value;
        this.shadowRoot.querySelectorAll('.part').forEach(elem => (elem.style.display = 'none'));
        this.shadowRoot.querySelector('#' + event.target.value + '_form').style.display = 'block';
        break;

      default:
        console.log(
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
