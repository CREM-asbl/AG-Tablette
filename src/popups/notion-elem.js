import { LitElement, html, css } from 'lit';
import { TemplatePopup } from './template-popup';
import { findSequencesByIds } from '../Firebase/firebase-init';
import './sequence-elem';

class NotionElem extends LitElement {
  static get properties() {
    return {
      title: String,
      sequenceIds: Array,
      sequenceInfos: Array,
    };
  }

  constructor() {
    super();

    this.sequenceInfos = [];
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

  firstUpdated() {
    if (typeof this.sequenceIds == "string") {
      this.sequenceIds = this.sequenceIds.split(',');
    }
    console.log(this.sequenceIds);
  }

  render() {
    return html`
      <details name="summary">
        <summary name="summary" @click="${this.summaryClick}">${this.title}</summary>
        ${this.sequenceInfos.map(info => html`<sequence-elem  title="${info.Title}" fileIds="${info.File_ids}"></sequence-elem>`)}
      </details>
    `;
  }

  /**
   * event handler principal
   */
  async summaryClick() {
    let sequenceInfos = await findSequencesByIds(this.sequenceIds, false);
    this.sequenceInfos = sequenceInfos;
    this.sequenceInfos.sort((el1, el2) => {
      if (el1.Title > el2.Title)
        return 1;
      return -1;
    });
  }
}
customElements.define('notion-elem', NotionElem);
