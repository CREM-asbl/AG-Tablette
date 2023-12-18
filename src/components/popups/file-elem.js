import { app } from '@controllers/Core/App';
import { loadEnvironnement } from '@controllers/Core/Environment';
import { OpenFileManager } from '@controllers/Core/Managers/OpenFileManager';
import { readFileFromServer } from '@db/firebase-init';
import { css, html, LitElement } from 'lit';
import { setState } from '../../controllers/Core/App';
import './open-server-popup';

class FileElem extends LitElement {
  static properties = {
    title: String,
    environment: String,
  };

  static styles = [
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

  render() {
    return html`
      <div @click="${this.openFile}">${this.filenameWithoutExtension(this.title)} ${'(' + this.environment + ')'}</div>
    `;
  }

  async openFile() {
    if (this.environment != app.environment.name) {
      if (confirm('Voulez-vous ouvrir ce fichier dans ' + this.environment + '?')) {
        // window.location.href = '/?activityName=' + this.title;
        setState({ environment: await loadEnvironnement(this.environment) });
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
