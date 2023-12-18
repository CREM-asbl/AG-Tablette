import '@components/color-button';
import { findAllFiles, findAllThemes, readFileFromServer } from '@db/firebase-init';
import * as fflate from 'fflate';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TemplatePopup } from './template-popup';
import './theme-elem';

@customElement('open-server-popup')
class OpenServerPopup extends LitElement {
  @property({ type: Array }) allThemes = []

  static styles = [
    TemplatePopup.template_popup_styles(),
    css`
        :host {
          display: block;
        }

        #body {
          display: block;
        }

        color-button {
          margin-top: 10px;
        }
      `
  ]

  async firstUpdated() {
    let allThemes = await findAllThemes();
    this.allThemes = allThemes;
    window.addEventListener('close-popup', () => this.close());
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" id="body">
          ${this.allThemes.map(theme => html`<theme-elem title="${theme.id}" moduleNames="${theme.modules.map(module => module.id)}"></theme-elem>`)}
          <color-button style="display: ${this.allThemes.length > 0 ? 'block' : 'none'}" @click="${this.downloadAllFiles}" innerText="Télécharger tous les fichiers"></color-button>
        </div>
      </template-popup>
    `;
  }

  async downloadAllFiles() {
    let allFilename = await findAllFiles();
    allFilename = allFilename.filter(file => !file.hidden);
    let filesByModules = {};

    await Promise.all(
      allFilename.map(async file => {
        let key = file.module.id;
        let text = await (await readFileFromServer(file.id)).text();
        text = fflate.strToU8(text);
        if (key in filesByModules) {
          filesByModules[key][file.id] = text;
        } else {
          filesByModules[key] = { [file.id]: text };
        }
      })
    );
    const zipped = fflate.zipSync(filesByModules);
    let blob = new Blob([
      zipped
    ]);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "fichiers_AGm_serveur_crem.zip";
    link.click();
    link.remove();
  }

  close() {
    this.remove();
  }

  _actionHandle(event) {
    switch (event.target.name) {
    }
  }
}