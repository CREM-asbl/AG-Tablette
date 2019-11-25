import { LitElement, html } from 'lit-element';
import '../version-item';
import { app } from '../js/App';
import { TemplatePopup } from './template-popup';

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
    this.filename = '';
    this.save_settings = true;
    this.save_history = true;
    this.save_format = 'agg';
    this.save_image_format = 'png';
    this.image_or_state = 'state';
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup
        @close-popup="${() => this.style.display == 'block' && (this.style.display = 'none')}"
      >
        <h2 slot="title">Sauvegarder</h2>
        <div slot="body" id="body">
          <label style="display:inline" for="save_popup_image_or_state"
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
            <label style="display:inline" for="save_popup_format">Format</label>
            <select name="save_popup_format" id="save_popup_format" @change="${this._actionHandle}">
              <option value="png" ?selected="${this.save_image_format == 'png'}">
                png
              </option>
              <option value="svg" ?selected="${this.save_image_format == 'svg'}">
                svg
              </option>
            </select>
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

  /**
   * download a file to the user
   * @param {*} fileName
   * @param {*} url
   */
  downloadFile(fileName, url) {
    const downloader = document.createElement('a');
    downloader.href = url;
    downloader.download = fileName;
    downloader.target = '_blank';
    document.body.appendChild(downloader);
    downloader.click();
    document.body.removeChild(downloader);
  }

  saveToSvg(fileName) {
    const ctx = app.drawAPI.canvas.main;

    let svg_data =
      '<svg width="' +
      ctx.width +
      '" height="' +
      ctx.height +
      '" xmlns="http://www.w3.org/2000/svg" >\n';
    app.workspace.shapes.forEach(shape => {
      svg_data += shape.to_svg() + '\n';
    });
    svg_data += '</svg>';

    const encodedData = 'data:image/svg+xml;base64,' + btoa(svg_data);

    this.downloadFile(fileName + '.svg', encodedData);
  }

  saveToPng(fileName) {
    const ctx = app.drawAPI.canvas.main;
    const image = ctx.toDataURL();

    this.downloadFile(fileName + '.png', image);
  }

  saveState(fileName) {
    let { history, settings, ...saveObject } = {
      ...app.workspace.data,
      appSettings: app.settings.data,
    };

    if (this.save_history) saveObject.history = history;
    else saveObject.history = { history: [], historyIndex: -1 };

    if (this.save_settings) saveObject.settings = settings;

    let json = JSON.stringify(saveObject);

    const file = new Blob([json], { type: 'application/json' });
    const data = window.URL.createObjectURL(file);

    this.downloadFile(fileName + '.' + this.save_format, data);
  }

  saveToFile(fileName) {
    if (!fileName) fileName = 'untitled';

    switch (this.save_format) {
      case 'png':
        this.saveToPng(fileName);
        break;
      case 'svg':
        this.saveToSvg(fileName);
        break;
      case 'agg':
      case 'agt':
      case 'agc':
      case 'agl':
        this.saveState(fileName);
        break;
      default:
        console.log('unknown file format: ' + this.save_image_format);
    }
  }

  get_file_name_from_env() {
    switch (app.workspace.environment.name) {
      case 'Grandeur':
        return 'agg';
      default:
        console.error('Unknown environment for file saving : ', app.workspace.environment.name);
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
        break;

      case 'save_popup_submit':
        this.style.display = 'none';
        this.save_format =
          this.image_or_state == 'state' ? this.get_file_name_from_env() : this.save_image_format;
        this.saveToFile(this.filename);
        break;

      case 'save_popup_format':
        this.save_image_format = event.target.value;
        break;

      case 'save_popup_image_or_state':
        this.image_or_state = event.target.value;
        this.shadowRoot.querySelectorAll('.part').forEach(elem => (elem.style.display = 'none'));
        this.shadowRoot.querySelector('#' + event.target.value + '_form').style.display = 'block';
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
