import { LitElement, html } from 'lit-element';
import { app } from './js/App';

class VersionItem extends LitElement {
  static get properties() {
    return {
      version: String,
    };
  }

  constructor() {
    super();
    this.version = app.short_name + ' ' + app.version;
  }

  render() {
    return html`
      <style>
        :host {
          display: flex;
          align-items: center;
          height: 20px;
        }
        img {
          height: 100%;
          margin: 4px;
        }
        div {
          margin-left: 4px;
          text-align: right;
          font-size: 0.8rem;
          color: darkslategray;
        }
      </style>
      <img src="/images/manifest/icon.svg" />
      <div class="version">${this.version}</div>
    `;
  }
}
customElements.define('version-item', VersionItem);
