import { css, html, LitElement } from 'lit';
import { findAllThemes } from '../Firebase/firebase-init';
import { TemplatePopup } from './template-popup';
import './theme-elem';

class OpenServerPopup extends LitElement {
  static get properties() {
    return {
      allThemes: Array,
    };
  }

  constructor() {
    super();

    this.allThemes = [];

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
    let allThemes = await findAllThemes();
    this.allThemes = allThemes;
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
          ${this.allThemes.map(theme => html`<theme-elem title="${theme.id}" moduleNames="${theme.modules.map(module => module.id)}"></theme-elem>`)}
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
