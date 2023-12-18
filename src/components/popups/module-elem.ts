import { app, setState } from '@controllers/Core/App';
import { getFilesDocFromModule, getModuleDocFromModuleName } from '@db/firebase-init';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import './file-elem';

class ModuleElem extends LitElement {
  @property({ type: String }) title
  @property({ type: Array }) files = []
  @property({ type: Array }) fileNames = []


  static styles = [
    css`

        details {
          cursor: pointer;
          width: 90%;
          text-align: left;
          background-color: var(--theme-color-soft);
          border-radius: 3px;
          box-shadow: 0px 0px 3px var(--menu-shadow-color);
          margin: auto;
          margin-top: 3px;
          margin-bottom: 5px;
          padding: 5px;
        }
      `,
  ];

  firstUpdated() {
    this.isOpen = app.sequencesOpen.some(sequence => {
      return sequence == this.title
    });
    if (this.isOpen) {
      this.shadowRoot.querySelector('details').open = true;
      this.loadFiles();
    }
    if (typeof this.fileNames == "string") {
      this.fileNames = this.fileNames.split(',');
    }
  }

  lastElemOfPath(path) {
    let lastElem = path.substring(path.lastIndexOf('/') + 1);
    return lastElem;
  }

  render() {
    return html`
      <details name="summary">
        <summary name="summary" @click="${this.summaryClick}">${this.title}</summary>
        ${this.files.map(info => html`<file-elem title="${info.id}" environment="${info.environment}"></file-elem>`)}
      </details>
    `;
  }

  async summaryClick() {
    this.isOpen = !this.isOpen;
    let sequencesOpen = [...app.sequencesOpen];
    if (this.isOpen) {
      sequencesOpen.push(this.title);
    } else {
      sequencesOpen = sequencesOpen.filter(notion => notion != this.title);
    }
    setState({ sequencesOpen });
    this.loadFiles();
  }

  async loadFiles() {
    let moduleDocRef = getModuleDocFromModuleName(this.title);
    let filesDoc = await getFilesDocFromModule(moduleDocRef);
    filesDoc = filesDoc.filter(fileDoc => !fileDoc.hidden);
    this.files = filesDoc;
  }
}
customElements.define('module-elem', ModuleElem);
