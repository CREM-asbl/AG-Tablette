import { LitElement, html, css } from 'lit-element';
import { setState } from './Core/App';
import { loadEnvironnement } from './Core/Environments/Environment';

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
        background: /* url('images/manifest/icon.svg') no-repeat center center */ lightgray;
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
        background: url('/images/Environnements/grandeurs_test4.jpg') center
          center rgba(255, 255, 255, 0.9);

        /* background: url('/images/Environnements/grandeurs.\${unsafeCSS(
            this.isSafari ? 'png' : 'webp'
          )}');
          center center rgba(255, 255, 255, 0.9); */
        background-repeat: no-repeat;
        background-size: cover;
      }

      #Tangram {
        background: url('/images/Environnements/tangram_test4.jpg') center
          center rgba(255, 255, 255, 0.9);

        /* background: url('/images/Environnements/tangram.\${unsafeCSS(
            this.isSafari ? 'jpg' : 'webp'
          )}');
          center center rgba(255, 255, 255, 0.9); */
        background-repeat: no-repeat;
        background-size: cover;
      }

      #Cubes {
        background: url('/images/Environnements/cubes_test3.jpg') center center
          rgba(255, 255, 255, 0.9);

        /* background: url('/images/Environnements/cubes.\${unsafeCSS(
            this.isSafari ? 'png' : 'webp'
          )}');
          center center rgba(255, 255, 255, 0.9); */
        background-repeat: no-repeat;
        background-size: cover;
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
      <div id="Geometrie" @click="${this.handleClick}">Géométrie</div>
      <img src="images/manifest/icon_test.svg"
        style="position: absolute; top: calc(50% - 13vmin); left: calc(50% - 13vmin); width: 26vmin; height: 26vmin; transform: rotate(45deg);" />
    `;
  }

  async handleClick(e) {
    setState({ environment: await loadEnvironnement(e.target.id) })
  }
}
customElements.define('ag-environnements', AgEnvironnements);
