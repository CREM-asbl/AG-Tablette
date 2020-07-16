import { LitElement, html, css, unsafeCSS } from 'lit-element';
import './Core/Environments/Environment';

class AgEnvironnements extends LitElement {
  static get isSafari() {
    let ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') != -1) {
      if (ua.indexOf('chrome') > -1) {
        return false; // Chrome
      } else {
        return true; // Safari
      }
    }
    return false;
  }

  static get styles() {
    return css`
      :host {
        display: grid;
        grid-template: 1fr 1fr / 1fr 1fr;
        gap: 16px;
        justify-items: center;
        align-items: center;
        height: 100%;
        padding: 16px;
        box-sizing: border-box;
        background: url('images/manifest/icon.svg') no-repeat center center lightgray;
      }

      div {
        width: 100%;
        height: 100%;
        box-shadow: 0 1px 2px black;
        font-size: 2rem;
        font-weight: bold;
        text-align: center;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
      }

      div:hover {
        box-shadow: 0 3px 8px black;
      }

      #Grandeurs {
        background: url('/images/Environnements/grandeurs.${unsafeCSS(
          this.isSafari ? 'png' : 'webp'
        )}') center center rgba(255, 255, 255, .9);
        background-repeat: no-repeat;
        background-size: contain;
      }

      #Tangram {
        background: url('/images/Environnements/tangram.${unsafeCSS(
          this.isSafari ? 'jpg' : 'webp'
        )}') center center rgba(255, 255, 255, .9);;
        background-repeat: no-repeat;
        background-size: contain;
      }

      #Cubes {
        background: url('/images/Environnements/cubes.${unsafeCSS(
          this.isSafari ? 'png' : 'webp'
        )}') center center rgba(255, 255, 255, .9);;
        background-repeat: no-repeat;
        background-size: contain;
      }

      #Geometrie {
        box-shadow: none;
      }
    `;
  }

  render() {
    return html`
      <div id="Grandeurs" @click="${this.handleClick}">Grandeurs</div>
      <div id="Tangram" @click="${this.handleClick}">Tangram</div>
      <div id="Cubes" @click="${this.handleClick}">Cubes</div>
      <div id="Geometrie">Géométrie</div>
    `;
  }

  handleClick(e) {
    this.dispatchEvent(
      new CustomEvent('set-environnement', {
        detail: e.target.id,
        bubbles: true,
        composed: true,
      })
    );
  }
}
customElements.define('ag-environnements', AgEnvironnements);
