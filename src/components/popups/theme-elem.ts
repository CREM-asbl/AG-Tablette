import { SignalWatcher } from '@lit-labs/signals';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { getModulesDocFromTheme, getThemeDocFromThemeName } from '../../firebase/firebase-init';
import { cachedSequences, selectedNotion, toggleNotion } from '../../store/notions';
import './module-elem';

class ThemeElem extends SignalWatcher(LitElement) {
  @property({ type: Object }) theme = {};
  @property({ type: String }) title = '';
  @property({ type: Array }) modules = [];
  @property({ type: String }) moduleNames = '';
  @property({ type: Boolean }) loaded = false;
  @state() private isOpen = false;
  @state() private moduleNamesList: string[] = [];

  static styles = css`
    :host {
      width: 100%;
      display: block;
    }

    details {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      background-color: rgba(255, 255, 255, 0.1);
    }

    details[open] {
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 8px;
    }

    summary {
      cursor: pointer;
      font-weight: 500;
      padding: 12px 16px;
      background-color: var(--theme-color);
      color: white;
      border-radius: 6px;
      position: relative;
      display: flex;
      align-items: center;
      outline: none;
      transition: background-color 0.2s ease;
    }

    summary:hover {
      background-color: var(--theme-color-dark, var(--theme-color));
    }

    summary::-webkit-details-marker {
      display: none;
    }

    summary::after {
      content: '▼';
      font-size: 0.8em;
      margin-left: auto;
      transition: transform 0.3s ease;
    }

    details[open] summary::after {
      transform: rotate(180deg);
    }

    .modules-container {
      padding: 12px;
    }

    progress {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      margin: 8px 0;
    }
  `

  connectedCallback() {
    super.connectedCallback();
    // Si un objet theme est fourni, extraire le titre
    if (this.theme && this.theme.id) {
      this.title = this.theme.id;
    }
  }

  render() {
    const isSelected = selectedNotion.get() === this.title;
    return html`
      <details name="summary" ?open=${isSelected}>
        <summary name="summary" @click="${this.summaryClick}">${this.title}</summary>
        <div class="modules-container">
          ${!this.loaded ? html`<progress></progress>` : html``}
          ${this.modules.filter(info => info?.hidden != true).map(info => html`
            <module-elem
              title="${info.id}"
              .fileNames="${info.files.map(file => file.id)}">
            </module-elem>`
    )}
        </div>
      </details>
    `;
  }

  firstUpdated() {
    this.isOpen = selectedNotion.get() === this.title;
    if (this.isOpen) {
      this.loadModules();
    }
    if (typeof this.moduleNames === "string") {
      this.moduleNamesList = this.moduleNames.split(',');
    }
  }

  updated() {
    const isSelected = selectedNotion.get() === this.title;
    // Ne mettre à jour isOpen que si sa valeur a changé
    if (this.isOpen !== isSelected) {
      this.isOpen = isSelected;
    }

    if (isSelected && !this.loaded) {
      this.loadModules();
    }
  }

  async summaryClick(e) {
    // Empêcher le comportement par défaut pour gérer manuellement l'état
    e.preventDefault();

    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadModules();
    }
    toggleNotion(this.title);

    // Mettre à jour manuellement l'état ouvert/fermé de l'élément details
    const details = e.target.closest('details');
    if (details) {
      details.open = this.isOpen;
    }
  }

  async loadModules() {
    if (this.loaded) return;

    // Vérifier d'abord si des modules pour ce thème sont déjà en cache
    // S'assurer que cachedSequences.value existe avant d'utiliser find()
    const cachedModulesForTheme = cachedSequences.value &&
      cachedSequences.value.find(cache => cache.theme === this.title);

    if (cachedModulesForTheme) {
      console.log('Utilisation des séquences en cache pour le thème:', this.title);
      this.modules = cachedModulesForTheme.modules;
      this.loaded = true;
      return;
    }

    // Sinon charger depuis le serveur
    let themeDocRef = getThemeDocFromThemeName(this.title);
    let modulesDoc = await getModulesDocFromTheme(themeDocRef);
    this.modules = modulesDoc;

    // Mise à jour du cache des séquences
    if (modulesDoc && modulesDoc.length > 0) {
      // S'assurer que cachedSequences.value est initialisé comme un tableau
      const currentCache = Array.isArray(cachedSequences.value) ? [...cachedSequences.value] : [];
      currentCache.push({
        theme: this.title,
        modules: modulesDoc
      });
      cachedSequences.value = currentCache;
      console.log('Séquences mises en cache pour le thème:', this.title);
    }

    this.loaded = true;
  }
}
customElements.define('theme-elem', ThemeElem);