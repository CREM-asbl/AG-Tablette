import { css, html, LitElement } from 'lit';
import { app } from '../Core/App';
import { OpenFileManager } from '../Core/Managers/OpenFileManager';
import { readFileFromServer } from '../Firebase/firebase-init';
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
    if (this.environment != app.environment.name && confirm('Voulez-vous ouvrir ce fichier dans ' + this.environment + '?')) {
      window.location.href = location.protocol + '//' + location.host + location.pathname + '?activityName=' + this.title;
    }
    let fileDownloaded = await readFileFromServer(this.title);
    let fileDownloadedObject = await fileDownloaded.json();
    OpenFileManager.parseFile(fileDownloadedObject);
    window.dispatchEvent(new CustomEvent('close-popup'));
  }

  filenameWithoutExtension(fileName) {
    return fileName.slice(0, fileName.lastIndexOf('.'));
  }
}
customElements.define('file-elem', FileElem);
