import { LitElement, html, css } from 'lit';
import { TemplatePopup } from './template-popup';
import { findFilesByIds } from '../Firebase/firebase-init';
import './file-elem';

class SequenceElem extends LitElement {
  static get properties() {
    return {
      title: String,
      fileIds: Array,
      fileInfos: Array,
    };
  }

  constructor() {
    super();

    this.fileInfos = [];
  }

  static get styles() {
    return [
      css`

        details {
          cursor: pointer;
          width: 90%;
          text-align: left;
          background-color: var(--theme-color-soft);
          border-radius: 3px;
          box-shadow: 0px 0px 3px var(--menu-shadow-color);
          margin: auto;
          margin-bottom: 3px;
        }
      `,
    ];
  }

  updated() {
    console.log(this.fileIds);
    if (typeof this.fileIds == "string") {
      this.fileIds = this.fileIds.split(',');
    }
    console.log(this.fileIds);
  }

  render() {
    return html`
      <details name="summary">
        <summary name="summary" @click="${this.summaryClick}">${this.title}</summary>
        ${this.fileInfos.map(info => html`<file-elem  title="${info.Title}" fileName="${info.URL}"></file-elem>`)}
      </details>
    `;
  }

  /**
   * event handler principal
   */
  async summaryClick() {
    console.log(this.fileIds);
    let fileInfos = await findFilesByIds(this.fileIds, false);
    this.fileInfos = fileInfos;
    this.fileInfos.sort((el1, el2) => {
      if (el1.Title > el2.Title)
        return 1;
      return -1;
    });
    console.log(this.fileIds);
  }
}
customElements.define('sequence-elem', SequenceElem);
