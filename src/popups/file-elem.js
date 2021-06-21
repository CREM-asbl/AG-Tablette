import { LitElement, html, css } from 'lit';
import { TemplatePopup } from './template-popup';
import './open-server-popup';
import { findFilesByIds, openFileFromId, readFileFromServer } from '../Firebase/firebase-init';
import { OpenFileManager } from '../Core/Managers/OpenFileManager';

class FileElem extends LitElement {
  static get properties() {
    return {
      title: String,
      fileName: String,
    };
  }

  constructor() {
    super();
  }

  static get styles() {
    return [
      css`
        :host {
          height: 20px;
          width: 100%;
        }
      `,
    ];
  }

  render() {
    return html`
      <div @click="${this.openFile}">${this.title}</div>
    `;
  }

  /**
   * event handler principal
   */
  async openFile() {
    let fileContent = await readFileFromServer(this.fileName);
    OpenFileManager.parseFile(fileContent);
    window.dispatchEvent(new CustomEvent('close-popup'));
  }
}
customElements.define('file-elem', FileElem);
