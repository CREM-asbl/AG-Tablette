import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { app } from './Core/App';

@customElement('version-item')
class VersionItem extends LitElement {
  static styles = css`
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
    `

  render() {
    return html`
      <img src="/images/manifest/icon-512.png" />
      <div class="version">${app.short_name} ${app.version}</div>
    `;
  }
}
