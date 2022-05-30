import { css, html, LitElement } from 'lit';
import { app } from '../Core/App';
import { OpenFileManager } from '../Core/Managers/OpenFileManager';
import { readFileFromServer } from '../Firebase/firebase-init';
import './open-server-popup';

class FileElem extends LitElement {
  static get properties() {
    return {
      title: String,
      fileName: String,
      env: String,
      fileId: String,
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

  firstUpdated() {
    let extension = this.getExtension(this.title);

    const environmentsByExtensions = {
      agg: 'Grandeurs',
      agt: 'Tangram',
      agc: 'Cubes',
      agl: 'Geometrie',
    };

    this.env = environmentsByExtensions[extension];
  }

  getExtension(fileName) {
    return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
  }

  render() {
    return html`
      <div @click="${this.openFile}">${this.title.slice(0, -4)} ${this.env ? '(' + this.env + ')' : ''}</div>
    `;
  }

  /**
   * event handler principal
   */
  async openFile() {
    if (this.env != app.environment.name && confirm('Voulez-vous ouvrir ce fichier dans ' + this.env + '?')) {
      window.location.href = location.protocol + '//' + location.host + location.pathname + '?activityId=' + this.fileId;
    }
    let fileContent = await readFileFromServer(this.fileName);
    OpenFileManager.parseFile(fileContent);
    window.dispatchEvent(new CustomEvent('close-popup'));
  }
}
customElements.define('file-elem', FileElem);
