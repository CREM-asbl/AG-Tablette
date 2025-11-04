import { SignalWatcher } from '@lit-labs/signals';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  getModulesDocFromTheme,
  getThemeDocFromThemeName,
} from '../../firebase/firebase-init';
import {
  cachedSequences,
  selectedNotion,
  toggleNotion,
} from '../../store/notions';
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
  `;

  connectedCallback() {
    super.connectedCallback();
    // Si un objet theme est fourni, extraire le titre
    if (this.theme && (this.theme as any).id) {
      this.title = (this.theme as any).id;
    }
  }

  render() {
    const isSelected = selectedNotion.get() === this.title;
    return html`
      <details name="summary" ?open=${isSelected}>
        <summary name="summary" @click="${this.summaryClick}">
          ${this.title}
        </summary>
        <div class="modules-container">
          ${!this.loaded ? html`<progress></progress>` : html``}
          ${this.modules.length === 0 && this.loaded
            ? html`<div style="padding:12px;color:#888;font-size:0.95em;">
                Aucun module disponible
              </div>`
            : html``}
          ${this.modules
            .filter((info) => info?.hidden != true)
            .map(
              (info) =>
                html` <module-elem
                  title="${info.id}"
                  .fileNames="${info.files
                    ? info.files.map((file) => file.id)
                    : []}"
                >
                </module-elem>`,
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
    if (typeof this.moduleNames === 'string') {
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

    try {
      // Vérifier d'abord si des modules pour ce thème sont déjà en cache mémoire
      let cachedModulesForTheme =
        cachedSequences.get() &&
        cachedSequences.get().find((cache) => cache.theme === this.title);

      // Fallback : si pas de modules en mémoire, tenter de récupérer depuis IndexedDB
      if (!cachedModulesForTheme) {
        const { getAllModules } = await import(
          '../../utils/indexeddb-activities.js'
        );
        const allModules = await getAllModules();
        const filtered = allModules.filter((m) => m.data.theme === this.title);
        if (filtered.length > 0) {
          cachedModulesForTheme = {
            theme: this.title,
            modules: filtered.map((m) => ({ id: m.id, ...m.data })),
          };
          // Mettre à jour le cache mémoire
          const currentCache = Array.isArray(cachedSequences.get())
            ? [...cachedSequences.get()]
            : [];
          currentCache.push(cachedModulesForTheme);
          cachedSequences.set(currentCache);
        }
      }

      if (cachedModulesForTheme) {
        this.modules = cachedModulesForTheme.modules;
        this.loaded = true;
        return;
      }

      // Sinon charger depuis getModulesDocFromTheme (qui gère IndexedDB + serveur)
      const themeDocRef = getThemeDocFromThemeName(this.title);
      const modulesDoc = await getModulesDocFromTheme(this.title); // Passer directement le nom du thème
      this.modules = modulesDoc || [];

      // Sauvegarder les modules dans IndexedDB si récupérés du serveur
      if (modulesDoc && modulesDoc.length > 0 && navigator.onLine) {
        const { saveModulesToIndexedDB } = await import('../../store/notions');
        await saveModulesToIndexedDB(modulesDoc, this.title);
      }

      // Mise à jour du cache des séquences en mémoire
      if (modulesDoc && modulesDoc.length > 0) {
        const currentCache = Array.isArray(cachedSequences.get())
          ? [...cachedSequences.get()]
          : [];
        const existingIndex = currentCache.findIndex(
          (cache) => cache.theme === this.title,
        );
        if (existingIndex >= 0) {
          currentCache[existingIndex] = {
            theme: this.title,
            modules: modulesDoc,
          };
        } else {
          currentCache.push({ theme: this.title, modules: modulesDoc });
        }
        cachedSequences.set(currentCache);
      }

      this.loaded = true;
    } catch (error) {
      console.error(
        'Erreur lors du chargement des modules pour le thème',
        this.title,
        ':',
        error,
      );
      this.modules = [];
      this.loaded = true;
    }
  }
}
customElements.define('theme-elem', ThemeElem);
