import { LitElement, html, css } from 'lit';
import { TemplatePopup } from './template-popup';
import { findAllNotions } from '../Firebase/firebase-init';
import './notion-elem';

class OpenServerPopup extends LitElement {
  static get properties() {
    return {
      notionInfos: Array,
    };
  }

  constructor() {
    super();

    this.notionInfos = [];

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        :host {
          display: block;
        }

        #body {
          display: block;
        }
      `,
    ];
  }

  async firstUpdated() {
    let notionInfos = await findAllNotions(false);
    this.notionInfos = notionInfos;
  }

  updated() {
    // window.setTimeout(
    //   () => this.shadowRoot.querySelector('#focus').focus(),
    //   200,
    // );
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" id="body">
          ${this.notionInfos.map(info => html`<notion-elem title="${info.Title}" sequenceIds="${info.Sequence_ids}"></notion-elem>`)}
        </div>
      </template-popup>
    `;
  }

  close() {
    this.remove();
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
    }
  }
}
customElements.define('open-server-popup', OpenServerPopup);
