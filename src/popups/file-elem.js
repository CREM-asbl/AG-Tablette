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

        div {
          cursor: pointer;
          text-align: center;
          width: 90%;
          background-color: var(--theme-color);
          border-radius: 3px;
          box-shadow: 0px 0px 3px var(--menu-shadow-color);
          margin: auto;
          margin-bottom: 3px;
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
