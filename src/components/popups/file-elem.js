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
    environment: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }
    [loading] {
      color: red;
      animation: blink 3s infinite;
    }

   @keyframes blink {
    0% { opacity: .5 }
    50% { opacity: 1 }
    100% { opacity: .5 }
   }
  `

  render() {
    return html`
      <color-button @click="${this.openFile}">
        ${this.filenameWithoutExtension(this.title)} ${'(' + this.environment + ')'}
      </color-button>
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
    const button = this.shadowRoot?.querySelector('color-button')
    button?.setAttribute('loading', 'true')
    button.disabled = true
    const t = performance.now()
    console.log('openFile')
    let fileDownloaded = await readFileFromServer(this.title);
    console.log('fileDownloaded')
    let fileDownloadedObject = await fileDownloaded.json();
    console.log('fileDownloadedObject')
    OpenFileManager.parseFile(fileDownloadedObject, this.title);
    console.log('file opened', performance.now() - t)
    window.dispatchEvent(new CustomEvent('close-popup'));
  }

  filenameWithoutExtension(fileName) {
    return fileName.slice(0, fileName.lastIndexOf('.'));
  }
}
customElements.define('file-elem', FileElem);
