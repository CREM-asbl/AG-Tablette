import { LitElement, html } from 'lit-element';
import '../version-item';
import { app } from '../js/App';
import { TemplatePopup } from './template-popup';

class SavePopup extends LitElement {
  static get properties() {
    return {
      filename: { type: String },
      save_parameters: { type: Boolean },
      save_history: { type: Boolean },
    };
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup @close-popup="${() => (this.style.display = 'none')}">
        <h2 slot="title">Sauvegarder l'état</h2>
        <div slot="body">
          <div class="field">
            <input
              type="checkbox"
              name="save_popup_settings"
              id="save_popup_settings"
              ?checked="${this.save_parameters}"
              @change="${this._actionHandle}"
            />
            <label for="save_popup_settings">Sauvegarder les paramètres</label>
          </div>

          <br />

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

          <br />

          <div class="field">
            <label for="save_popup_filename">Nom du fichier</label>
            <input
              type="text"
              name="save_popup_filename"
              id="save_popup_filename"
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

  constructor() {
    super();
    this.filename = '';
    this.save_parameters = true;
    this.save_history = true;
  }

  saveToFile(fileName) {
    console.log('here');
    if (!fileName) fileName = 'untitled';

    let { history, settings, ...saveObject } = {
      ...app.workspace.data,
      appSettings: app.settings.data,
    };

    if (this.save_history) saveObject.history = history;
    else saveObject.history = { history: [], historyIndex: -1 };

    if (this.save_parameters) saveObject.settings = settings;

    let json = JSON.stringify(saveObject);

    const file = new Blob([json], { type: 'application/json' });

    const downloader = document.createElement('a');
    downloader.href = window.URL.createObjectURL(file);
    downloader.download = fileName + '.fag';
    downloader.target = '_blank';
    document.body.appendChild(downloader);
    downloader.click();
    document.body.removeChild(downloader);
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'save_popup_settings':
        this.save_parameters = !this.save_parameters;
        break;

      case 'save_popup_history':
        this.save_history = !this.save_history;
        break;

      case 'save_popup_filename':
        this.filename = event.path[0].value;
        break;

      case 'save_popup_submit':
        this.style.display = 'none';
        this.saveToFile(this.filename);
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
  }
}
customElements.define('save-popup', SavePopup);
