import { app } from '@controllers/Core/App';
import { OpenFileManager } from '@controllers/Core/Managers/OpenFileManager';
import { readFileFromServer } from '@db/firebase-init';
import { css, html, LitElement } from 'lit';
import './open-server-popup';

class FileElem extends LitElement {
  static get properties() {
    return {
      title: String,
      environment: String,
    };
  }

  constructor() {
    super();
  }

  static get styles() {
    return [
      css`
        div {
          cursor: pointer;
          text-align: center;
          width: 90%;
          background-color: var(--theme-color);
          border-radius: 3px;
          box-shadow: 0px 0px 3px var(--menu-shadow-color);
          margin: auto;
          margin-top: 3px;
          margin-bottom: 5px;
          padding: 5px;
        }
      `,
    ];
  }

  render() {
    return html`
      <div @click="${this.openFile}">${this.filenameWithoutExtension(this.title)} ${'(' + this.environment + ')'}</div>
    `;
  }

  async openFile() {
    if (this.environment != app.environment.name) {
      if (confirm('Voulez-vous ouvrir ce fichier dans ' + this.environment + '?')) {
        window.location.href = location.protocol + '//' + location.host + location.pathname + '?activityName=' + this.title;
      } else {
        return;
      }
    }
    let fileDownloaded = await readFileFromServer(this.title);
    let fileDownloadedObject = await fileDownloaded.json();
    OpenFileManager.parseFile(fileDownloadedObject, this.title);
    window.dispatchEvent(new CustomEvent('close-popup'));
  }

  filenameWithoutExtension(fileName) {
    return fileName.slice(0, fileName.lastIndexOf('.'));
  }
}
customElements.define('file-elem', FileElem);
