import '@components/color-button';
import { findAllFiles, findAllThemes, readFileFromServer } from '@db/firebase-init';
import * as fflate from 'fflate';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './theme-elem';

@customElement('open-server-popup')
class OpenServerPopup extends LitElement {
  @property({ type: Array }) allThemes = []

  static styles = css`
    #body {
          display: grid;
          gap: 4px;
    }
  `

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" id="body">
          <progress style="display: ${this.allThemes.length ? 'none' : 'block'}"></progress>
          ${this.allThemes.map(theme => html`<theme-elem title="${theme.id}" moduleNames="${theme.modules.map(module => module.id)}"></theme-elem>`)}
        </div>
        <div slot="footer">
          <color-button @click="${this.downloadAllFiles}">Télécharger tous les fichiers</color-button>
        </div>
      </template-popup>
    `;
  }

  async firstUpdated() {
    let allThemes = await findAllThemes();
    this.allThemes = allThemes;
    window.addEventListener('close-popup', () => this.close());
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
    let blob = new Blob([zipped]);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "fichiers_AGm_serveur_crem.zip";
    link.click();
    link.remove();
  }

  close() {
    this.remove()
  }
}