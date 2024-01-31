import { app, setState } from '@controllers/Core/App';
import { getFilesDocFromModule, getModuleDocFromModuleName } from '@db/firebase-init';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import './file-elem';

class ModuleElem extends LitElement {
  @property({ type: String }) title
  @property({ type: Array }) files = []
  @property({ type: Array }) fileNames = []
  @property({ type: Boolean }) loaded

  static styles = css`
    summary { cursor: pointer; }
    details { padding: 8px 16px; }
    .grid { display: grid; gap: 4px; padding: 8px; }
    progress { width: 100%; }
  `

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
        ${!this.loaded ? html`<progress></progress>` : html``}
        <div class="grid">
          ${this.files.map(info => html`<file-elem title="${info.id}" environment="${info.environment}"></file-elem>`)}
        </div>
      </details>
    `;
  }

  async summaryClick() {
    this.isOpen = !this.isOpen;
    let sequencesOpen = [...app.sequencesOpen];
    if (this.isOpen) {
      sequencesOpen.push(this.title);
      this.loadFiles();
    } else {
      sequencesOpen = sequencesOpen.filter(notion => notion != this.title);
    }
    setState({ sequencesOpen });
  }

  async loadFiles() {
    if (this.loaded) return
    let moduleDocRef = getModuleDocFromModuleName(this.title);
    let filesDoc = await getFilesDocFromModule(moduleDocRef);
    filesDoc = filesDoc.filter(fileDoc => !fileDoc.hidden);
    this.files = filesDoc;
    this.loaded = true
  }
}
customElements.define('module-elem', ModuleElem);
