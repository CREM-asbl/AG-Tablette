import '@components/color-button';
import { app } from '@controllers/Core/App';
import { loadEnvironnement } from '@controllers/Core/Environment';
import { OpenFileManager } from '@controllers/Core/Managers/OpenFileManager';
import { readFileFromServer } from '@db/firebase-init';
import { LitElement, css, html } from 'lit';
import { setState } from '../../controllers/Core/App';
import './open-server-popup';

class FileElem extends LitElement {
  static properties = {
    title: { type: String },
    environment: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }
  `

  render() {
    return html`
      <color-button @click="${this.openFile}">${this.filenameWithoutExtension(this.title)} ${'(' + this.environment + ')'}</color-button>
    `;
  }

  async openFile() {
    if (this.environment != app.environment.name) {
      if (confirm('Voulez-vous ouvrir ce fichier dans ' + this.environment + '?')) {
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
