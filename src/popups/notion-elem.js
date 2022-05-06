import { css, html, LitElement } from 'lit';
import { findSequencesByIds } from '../Firebase/firebase-init';
import './sequence-elem';
import { app, setState } from '../Core/App';

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
          padding: 5px;
          margin-bottom: 5px;
        }
      `,
    ];
  }

  firstUpdated() {
    this.isOpen = app.notionsOpen.some(notion => {
      return notion == this.title
    });
    if (this.isOpen) {
      this.shadowRoot.querySelector('details').open = true;
      this.loadSequences();
    }
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

  async summaryClick() {
    this.isOpen = !this.isOpen;
    let notionsOpen = [...app.notionsOpen];
    if (this.isOpen) {
      notionsOpen.push(this.title);
    } else {
      notionsOpen = notionsOpen.filter(notion => notion != this.title);
    }
    setState({ notionsOpen });
    this.loadSequences();
  }

  async loadSequences() {
    if (this.sequenceInfos.length > 0)
      return;
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
