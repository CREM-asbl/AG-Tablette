import { SignalWatcher } from '@lit-labs/signals';
import { cachedFiles, selectedSequence, toggleSequence } from '@store/notions';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import './file-elem';

class ModuleElem extends SignalWatcher(LitElement) {
  @property({ type: String }) title = '';
  @property({ type: Array }) files = [];
  @property({ type: String }) fileNames = '';
  @property({ type: Boolean }) loaded = false;
  @state() private isOpen = false;
  @state() private fileNamesList: string[] = [];

  static styles = css`
    details {
      margin: 8px 0;
      border-radius: 6px;
      overflow: hidden;
      background-color: rgba(255, 255, 255, 0.15);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    details[open] {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    summary {
      cursor: pointer;
      padding: 10px 14px;
      background-color: rgba(0, 0, 0, 0.05);
      font-weight: 500;
      position: relative;
      display: flex;
      align-items: center;
      transition: background-color 0.2s ease;
    }

    summary:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    summary::-webkit-details-marker {
      display: none;
    }

    summary::after {
      content: '▼';
      font-size: 0.7em;
      margin-left: auto;
      transition: transform 0.3s ease;
      opacity: 0.7;
    }

    details[open] summary::after {
      transform: rotate(180deg);
    }

    .grid {
      display: grid;
      gap: 8px;
      padding: 12px;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }

    progress {
      width: 100%;
      height: 4px;
      margin: 8px 0;
      border-radius: 2px;
    }

    .loading-container {
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .loading-text {
      font-size: 0.85em;
      color: rgba(0, 0, 0, 0.6);
    }
  `;

  firstUpdated() {
    this.isOpen = selectedSequence.get() === this.title;

    // Toujours vérifier le cache au démarrage, même si le composant n'est pas ouvert
    this.checkCache();

    if (this.isOpen) {
      this.loadFiles();
      this.scrollIntoViewIfNeeded();
    }

    if (Array.isArray(this.fileNames)) {
      // fileNames est déjà un tableau, rien à faire
    } else if (typeof this.fileNames === 'string') {
      this.fileNamesList = this.fileNames.split(',');
    }
  }

  // Méthode pour faire défiler vers cet élément s'il est ouvert
  scrollIntoViewIfNeeded() {
    if (this.isOpen) {
      setTimeout(() => {
        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }

  // Méthode pour vérifier si les données sont disponibles dans le cache
  checkCache() {
    if (!this.loaded && cachedFiles.get()) {
      const cachedFilesForModule = cachedFiles
        .get()
        .find((cache) => cache.module === this.title);
      if (cachedFilesForModule) {
        this.files = cachedFilesForModule.files;
        this.loaded = true;
      }
    }
  }

  lastElemOfPath(path) {
    const lastElem = path.substring(path.lastIndexOf('/') + 1);
    return lastElem;
  }

  render() {
    const isSelected = selectedSequence.get() === this.title;

    return html`
      <details name="summary" ?open=${isSelected}>
        <summary name="summary" @click="${this.summaryClick}">
          ${this.title}
        </summary>
        ${!this.loaded
        ? html`<div class="loading-container">
              <progress></progress>
              <span class="loading-text">Chargement des fichiers...</span>
            </div>`
        : html`<div class="grid">
              ${this.files.length > 0
            ? this.files.map(
              (info) =>
                html`<file-elem
                        title="${info.id}"
                        environment="${info.environment}"
                      ></file-elem>`,
            )
            : html`<div class="no-files">Aucun fichier disponible</div>`}
            </div>`}
      </details>
    `;
  }

  async summaryClick(e) {
    // Empêcher le comportement par défaut pour gérer manuellement l'état
    e.preventDefault();

    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadFiles();
      this.scrollIntoViewIfNeeded();
    }
    toggleSequence(this.title);

    // Mettre à jour manuellement l'état ouvert/fermé de l'élément details
    const details = e.target.closest('details');
    if (details) {
      details.open = this.isOpen;
    }
  }

  async loadFiles() {
    if (this.loaded) return;

    // Vérifier d'abord si des fichiers pour ce module sont déjà en cache
    const cachedFilesForModule =
      cachedFiles.get() &&
      cachedFiles.get().find((cache) => cache.module === this.title);

    if (cachedFilesForModule) {
      this.files = cachedFilesForModule.files;
      this.loaded = true;
      return;
    }

    // Sinon charger depuis le serveur
    const { getFilesDocFromModule, getModuleDocFromModuleName } = await import('@db/firebase-init');
    const moduleDocRef = getModuleDocFromModuleName(this.title);
    let filesDoc = await getFilesDocFromModule(moduleDocRef);
    filesDoc = filesDoc.filter((fileDoc) => !fileDoc.hidden);
    this.files = filesDoc;
    this.loaded = true;

    // Mise à jour du cache des fichiers
    if (filesDoc && filesDoc.length > 0) {
      // S'assurer que cachedFiles.get() est initialisé comme un tableau
      const currentCachedFiles = Array.isArray(cachedFiles.get())
        ? cachedFiles.get()
        : [];

      // Rechercher si ce module existe déjà dans le cache pour le mettre à jour au lieu de l'ajouter
      const existingModuleIndex = currentCachedFiles.findIndex(
        (cache) => cache.module === this.title,
      );

      if (existingModuleIndex >= 0) {
        // Mettre à jour l'entrée existante
        const updatedCache = [...currentCachedFiles];
        updatedCache[existingModuleIndex] = {
          module: this.title,
          files: filesDoc,
          timestamp: Date.now(),
        };
        cachedFiles.set(updatedCache);
      } else {
        // Ajouter une nouvelle entrée
        const updatedCache = [
          ...currentCachedFiles,
          {
            module: this.title,
            files: filesDoc,
            timestamp: Date.now(),
          },
        ];
        cachedFiles.set(updatedCache);
      }
    }
  }

  updated() {
    const isSelected = selectedSequence.get() === this.title;
    // Ne mettre à jour isOpen que si sa valeur a changé
    if (this.isOpen !== isSelected) {
      this.isOpen = isSelected;
      if (this.isOpen) {
        this.scrollIntoViewIfNeeded();
      }
    }

    if (isSelected && !this.loaded) {
      this.loadFiles();
    }
  }
}
customElements.define('module-elem', ModuleElem);
