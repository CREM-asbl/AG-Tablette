import { getFilesDocFromModule, getModuleDocFromModuleName } from '@db/firebase-init';
import { SignalWatcher } from '@lit-labs/signals';
import { sequences, toggleSequence } from '@store/notions';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import './file-elem';

class ModuleElem extends SignalWatcher(LitElement) {
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
    this.isOpen = sequences.get().some(sequence => sequence === this.title);
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
    if (this.isOpen) {
      this.loadFiles();
    }
    toggleSequence(this.title);
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
