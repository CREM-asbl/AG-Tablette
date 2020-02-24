import { LitElement, html, css, unsafeCSS } from 'lit-element';
import { EnvironmentManager } from './Managers/EnvironmentManager';

class AgEnvironnements extends LitElement {
  // constructor() {
  //   super();

  //   this.isSafari = this.isSafari
  // }

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
        box-shadow: 0 1px 8px black;
      }

      #Grandeurs {
        background: url('/images/Environnements/grandeurs.${unsafeCSS(
          this.isSafari ? 'png' : 'webp',
        )}');
        background-repeat: no-repeat;
        background-size: cover;
      }

      /* #Tangram {
      }

      #Cubes {
      }

      #Geometrie {
      } */
    `;
  }

  render() {
    return html`
      <div id="Grandeurs" @click="${this.handleClick}">Grandeurs</div>
      <div id="Tangram" @click="${this.handleClick}">Tangram</div>
      <div id="Cubes">Cubes</div>
      <div id="Geometrie">Géométrie</div>
    `;
  }

  handleClick(e) {
    EnvironmentManager.setEnvironment(e.target.id);
  }
}
customElements.define('ag-environnements', AgEnvironnements);
