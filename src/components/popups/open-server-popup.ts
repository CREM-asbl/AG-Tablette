import '@components/color-button';
import { findAllFiles, findAllThemes, readFileFromServer } from '@db/firebase-init';
import * as fflate from 'fflate';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './theme-elem';

@customElement('open-server-popup')
class OpenServerPopup extends LitElement {
  @property({ type: Array }) allThemes = []
  @property({ type: Boolean }) isDownloading = false;

  static styles = css`
    .popup-content {
      display: grid;
      gap: 4px;
    }

    .loading-indicator {
      width: 100%;
      margin: 1rem 0;
    }

    .theme-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .download-progress {
      margin-top: 1rem;
      width: 100%;
    }

    .error-message {
      color: red;
      font-size: 0.9em;
      margin-top: 0.5rem;
    }
  `

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" class="popup-content">
          <progress class="loading-indicator" style="display: ${this.allThemes.length ? 'none' : 'block'}"></progress>
          <div class="theme-list">
            ${this.allThemes.map(theme => html`<theme-elem .title="${theme.id}" .moduleNames="${theme.modules.map(module => module.id)}"></theme-elem>`)}
          </div>
          ${this.isDownloading ? html`
            <progress class="download-progress"></progress>
            <div>Téléchargement en cours...</div>
          ` : ''}
        </div>
        <div slot="footer">
          <color-button
            @click="${this.downloadAllFiles}"
            ?disabled="${this.isDownloading}">
            ${this.isDownloading ? 'Téléchargement...' : 'Télécharger tous les fichiers'}
          </color-button>
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
    if (this.isDownloading) return;

    try {
      this.isDownloading = true;
      let allFilename = await findAllFiles();
      allFilename = allFilename.filter(file => !file.hidden);

      const MAX_SIZE = 100 * 1024 * 1024; // 100 Mo
      let totalSize = 0;
      let filesByModules = {};

      await Promise.all(
        allFilename.map(async file => {
          let key = file.module.id;
          let response = await readFileFromServer(file.id);
          let text = await response.text();
          totalSize += text.length;

          if (totalSize > MAX_SIZE) {
            throw new Error("La taille totale des fichiers dépasse la limite autorisée (100 Mo)");
          }

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
      const url = URL.createObjectURL(blob);
      try {
        link.href = url;
        link.download = "fichiers_AGm_serveur_crem.zip";
        link.click();
      } finally {
        URL.revokeObjectURL(url);
        link.remove();
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement des fichiers :", error);
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      errorDiv.textContent = error.message || "Une erreur est survenue lors du téléchargement";
      this.shadowRoot.querySelector('.popup-content').appendChild(errorDiv);
    } finally {
      this.isDownloading = false;
    }
  }

  close() {
    this.remove()
  }
}