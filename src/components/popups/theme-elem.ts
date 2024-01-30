import { app, setState } from '@controllers/Core/App';
import { getModulesDocFromTheme, getThemeDocFromThemeName } from '@db/firebase-init';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import './module-elem';

class ThemeElem extends LitElement {
  @property({ type: String }) title
  @property({ type: Array }) modules = []
  @property({ type: Array }) moduleNames = []

  static styles = [
    css`
        :host {
          width: 100%;
        }

        summary {
          font-weight: bold;
        }

        details {
          padding: 4px;
          background-color: rgba(0, 0, 0, .1);
          border-radius: 4px;
        }
      `,
  ];

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

  render() {
    return html`
      <details name="summary">
        <summary name="summary" @click="${this.summaryClick}">${this.title}</summary>
        ${this.modules.filter(info => info?.hidden != true).map(info => html`<module-elem title="${info.id}" fileNames="${info.files.map(file => file.id)}"></module-elem>`)}
      </details>
    `;
  }

  async summaryClick() {
    this.isOpen = !this.isOpen;
    let notionsOpen = [...app.notionsOpen];
    if (this.isOpen) {
      notionsOpen.push(this.title);
    } else {
      notionsOpen = notionsOpen.filter(notion => notion != this.title);
    }
    setState({ notionsOpen });
    this.loadModules();
  }

  async loadModules() {
    let themeDocRef = getThemeDocFromThemeName(this.title);
    let modulesDoc = await getModulesDocFromTheme(themeDocRef);
    this.modules = modulesDoc;
  }
}
customElements.define('theme-elem', ThemeElem);
