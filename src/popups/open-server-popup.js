import { css, html, LitElement } from 'lit';
import { downloadFileZip, findAllFiles, findAllThemes, readFileFromServer } from '../Firebase/firebase-init';
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

        color-button {
          margin-bottom: 10px;
        }
      `,
    ];
  }

  async firstUpdated() {
    let allThemes = await findAllThemes();
    this.allThemes = allThemes;
  }

  updated() {
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" id="body">
          <color-button @click="${this.downloadAllFiles}" innerText="Télécharger tous les fichiers"></color-button>
          ${this.allThemes.map(theme => html`<theme-elem title="${theme.id}" moduleNames="${theme.modules.map(module => module.id)}"></theme-elem>`)}
        </div>
      </template-popup>
    `;
  }

  async downloadAllFiles() {
    let allFilename = await findAllFiles();
    allFilename = allFilename.filter(file => !file.hidden).map(filename => filename.id);

    let allFiles = allFilename.map(readFileFromServer);

    downloadFileZip("fichiers_AGm_serveur_crem", allFiles);
  }

  close() {
    this.remove();
  }

  _actionHandle(event) {
    switch (event.target.name) {
    }
  }
}
customElements.define('open-server-popup', OpenServerPopup);
