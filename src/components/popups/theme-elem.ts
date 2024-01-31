import { app, setState } from '@controllers/Core/App';
import { getModulesDocFromTheme, getThemeDocFromThemeName } from '@db/firebase-init';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import './module-elem';

class ThemeElem extends LitElement {
  @property({ type: String }) title
  @property({ type: Array }) modules = []
  @property({ type: Array }) moduleNames = []
  @property({ type: Boolean }) loaded

  static styles = css`
    :host { width: 100%; }

    summary { cursor: pointer; font-weight: bold; }

    details {
          padding: 4px;
          background-color: rgba(0, 0, 0, .1);
          border-radius: 4px;
    }

    progress { width: 100%; }
  `

  render() {
    return html`
      <details name="summary">
        <summary name="summary" @click="${this.summaryClick}">${this.title}</summary>
        ${!this.loaded ? html`<progress></progress>` : html``}
        ${this.modules.filter(info => info?.hidden != true).map(info => html`<module-elem title="${info.id}" fileNames="${info.files.map(file => file.id)}"></module-elem>`)}
      </details>
    `;
  }

  firstUpdated() {
    this.isOpen = app.notionsOpen.some(notion => {
      return notion == this.title
    });
    if (this.isOpen) {
      this.shadowRoot.querySelector('details').open = true;
      this.loadModules();
    }
    if (typeof this.moduleNames == "string") {
      this.moduleNames = this.moduleNames.split(',');
    }
  }

  async summaryClick() {
    this.isOpen = !this.isOpen;
    let notionsOpen = [...app.notionsOpen];
    if (this.isOpen) {
      notionsOpen.push(this.title);
      this.loadModules();
    } else {
      notionsOpen = notionsOpen.filter(notion => notion != this.title);
    }
    setState({ notionsOpen });
  }

  async loadModules() {
    if (this.loaded) return
    let themeDocRef = getThemeDocFromThemeName(this.title);
    let modulesDoc = await getModulesDocFromTheme(themeDocRef);
    this.modules = modulesDoc;
    this.loaded = true
  }
}
customElements.define('theme-elem', ThemeElem);