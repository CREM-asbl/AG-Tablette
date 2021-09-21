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
          width: 100%;
        }

        details {
          cursor: pointer;
          text-align: left;
          background-color: var(--theme-color-soft);
          border-radius: 3px;
          box-shadow: 0px 0px 3px var(--menu-shadow-color);
          margin-bottom: 5px;
        }
      `,
    ];
  }

  firstUpdated() {
    if (typeof this.sequenceIds == "string") {
      this.sequenceIds = this.sequenceIds.split(',');
    }
  }

  render() {
    return html`
      <details name="summary">
        <summary name="summary" @click="${this.summaryClick}">${this.title}</summary>
        ${this.sequenceInfos.filter(info => info?.isHidden != true).map(info => html`<sequence-elem  title="${info.Title}" fileIds="${info.File_ids}"></sequence-elem>`)}
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
