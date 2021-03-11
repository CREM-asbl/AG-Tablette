import { LitElement, html, css } from 'lit-element';
import { TemplatePopup } from './template-popup';
import { app } from '../Core/App';
import { getFilesInfosFromEnvironment, readFileFromServer } from '../Core/Database/requests';
import { OpenFileManager } from '../Core/Managers/OpenFileManager';

class OpenServerPopup extends LitElement {
  static get properties() {
    return {
      filesInfos: Array
    };
  }

  constructor() {
    super();

    this.filesInfos = [];

    window.addEventListener('filesInfos-request-done', async event => {
      console.log(event.detail.filesInfos);
      this.filesInfos = event.detail.filesInfos;
    });

    getFilesInfosFromEnvironment()

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        button {
          width: 100%;
        }
      `,
    ];
  }

  updated() {
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier sur le serveur</h2>
        <div slot="body" id="body">
          ${this.filesInfos.length > 0 ? this.filesInfos.map(fileInfo => {
            console.log(fileInfo);
            return html`
              <button @click="${async () => {
                let fileContent = await readFileFromServer(fileInfo.url);
                OpenFileManager.parseFile(fileContent);
                this.close();
              }}">
                ${fileInfo.Titre}
              </button>
            `
          }) : 'Aucun fichier trouvé'}
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
    console.log(event);
    console.log(event.target);
    switch (event.target.name) {
      case 'LocalOpenFile':
        window.dispatchEvent(new CustomEvent('local-open-file'));
        this.close();
        break;

      case 'ServerOpenFile':
        this.renderMode = 'selectServerFile';
        break;

      default:
        console.error(
          'OpenPopup: paramètre inconnu: ' +
            event.target.name +
            ' ' +
            event.target.value +
            ' ' +
            event.target.checked
        );
    }
  }
}
customElements.define('open-server-popup', OpenServerPopup);
