import { app } from '../Core/App';
import { LitElement, html } from 'lit-element';
import { TemplatePopup } from './template-popup';
import { FileManager } from '../Core/Managers/FileManager';
import '../version-item';

class OpenPopup extends LitElement {
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

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" id="body">
          <button name="LocalOpenFile" @click="${this._actionHandle}">Ouvrir en local</button>
          <button name="ServerOpenFile" @click="${this._actionHandle}">
            Ouvrir sur le serveur
          </button>
        </div>

        <div slot="footer"></div>
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
      case 'LocalOpenFile':
        window.dispatchEvent(new CustomEvent('LocalOpenFile'));
        this.close();
        break;

      case 'ServerOpenFile':
        // server open
        break;

      default:
        console.log(
          'OpenPopup: paramètre inconnu: ' +
            event.target.name +
            ' ' +
            event.target.value +
            ' ' +
            event.target.checked,
        );
    }
  }
}
customElements.define('open-popup', OpenPopup);
