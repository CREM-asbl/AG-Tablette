import { app } from '../Core/App';
import { LitElement, html } from 'lit';
import { TemplatePopup } from './template-popup';
import { SaveFileManager } from '../Core/Managers/SaveFileManager';
import '../version-item';

class SavePopup extends LitElement {
  static get properties() {
    return {
      filename: { type: String },
      saveSettings: { type: Boolean },
      saveHistory: { type: Boolean },
      imageFormat: { type: String },
    };
  }

  constructor() {
    super();
    this.filename = 'untitled';
    this.saveSettings = SaveFileManager.saveSettings;
    this.saveHistory = SaveFileManager.saveHistory;
    this.imageFormat =
      SaveFileManager.extension == 'png' || SaveFileManager.extension == 'svg'
        ? SaveFileManager.extension
        : 'png';
    this.stateOrImage =
      SaveFileManager.extension == 'png' || SaveFileManager.extension == 'svg'
        ? 'image'
        : 'state';

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  updated() {
    window.setTimeout(
      () => this.shadowRoot.querySelector('#focus').focus(),
      200,
    );
    if (app.environment.name == 'Tangram')
      this.shadowRoot
        .querySelectorAll('.hideIfTangram')
        .forEach((el) => (el.style.display = 'none'));
    if (SaveFileManager.hasNativeFS)
      this.shadowRoot
        .querySelectorAll('.hideIfHasNativeFS')
        .forEach((el) => (el.style.display = 'none'));
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Sauvegarder</h2>
        <div slot="body" id="body">
          <div class="hideIfHasNativeFS">
            <label for="save_popup_stateOrImage" style="display:inline"
              >Méthode de sauvegarde</label
            >
            <select
              name="save_popup_stateOrImage"
              id="save_popup_stateOrImage"
              @change="${this._actionHandle}"
            >
              <option value="state" ?selected="${this.stateOrImage == 'state'}">
                état
              </option>
              <option value="image" ?selected="${this.stateOrImage == 'image'}">
                image
              </option>
            </select>
            <br /><br />
          </div>

          <div
            class="part"
            id="state_form"
            style="display: ${this.stateOrImage == 'state' ? 'block' : 'none'};"
          >
            <div class="field">
              <input
                type="checkbox"
                name="save_popup_settings"
                id="save_popup_settings"
                ?checked="${this.saveSettings}"
                @change="${this._actionHandle}"
              />
              <label for="save_popup_settings"
                >Sauvegarder les paramètres</label
              >
            </div>

            <div class="field hideIfTangram">
              <input
                type="checkbox"
                name="save_popup_history"
                id="save_popup_history"
                ?checked="${this.saveHistory}"
                @change="${this._actionHandle}"
              />
              <label for="save_popup_history">Sauvegarder l'historique</label>
            </div>
          </div>

          <div
            class="part"
            id="image_form"
            style="display: ${this.stateOrImage == 'image' ? 'block' : 'none'};"
          >
            <label for="save_popup_format" style="display:inline">Format</label>
            <select
              name="save_popup_format"
              id="save_popup_format"
              @change="${this._actionHandle}"
            >
              <option value="png" ?selected="${this.imageFormat == 'png'}">
                png
              </option>
              <option value="svg" ?selected="${this.imageFormat == 'svg'}">
                svg
              </option>
            </select>
          </div>

          <div class="field hideIfHasNativeFS">
            <br />
            <label for="save_popup_filename" style="display:inline"
              >Nom du fichier</label
            >
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
          <button
            name="save_popup_submit"
            id="focus"
            @click="${this._actionHandle}"
          >
            OK
          </button>
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

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'save_popup_settings':
        this.saveSettings = !this.saveSettings;
        break;

      case 'save_popup_history':
        this.saveHistory = !this.saveHistory;
        break;

      case 'save_popup_filename':
        this.filename = event.target.value;
        if (!this.filename) this.filename = 'untitled';
        break;

      case 'save_popup_submit':
        let extension =
          this.stateOrImage == 'state'
            ? app.environment.extension
            : this.imageFormat;
        window.dispatchEvent(
          new CustomEvent('file-selected', {
            detail: {
              name: this.filename + '.' + extension,
              saveSettings: this.saveSettings,
              saveHistory: this.saveHistory,
            },
          }),
        );
        this.close();
        break;

      case 'save_popup_format':
        this.imageFormat = event.target.value;
        break;

      case 'save_popup_stateOrImage':
        this.stateOrImage = event.target.value;
        this.shadowRoot
          .querySelectorAll('.part')
          .forEach((elem) => (elem.style.display = 'none'));
        this.shadowRoot.querySelector(
          '#' + event.target.value + '_form',
        ).style.display = 'block';
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
