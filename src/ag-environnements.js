import { LitElement, html, css } from 'lit';
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
        gap: 24px;
        justify-items: center;
        align-items: center;
        height: 100%;
        padding: 24px;
        box-sizing: border-box;
        background: lightgray;
      }

      .envTile {
        width: 100%;
        height: 100%;
        box-shadow: 0 1px 2px black;
        font-size: 2.3rem;
        font-weight: bold;
        /* text-align: center; */
        background: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        position: relative;
      }

      .envTile:hover {
        box-shadow: 0 3px 8px black;
      }

      .envText {
        width: 100%;
        text-align: center;
        -webkit-user-select: none; /* Safari */
        -moz-user-select: none; /* Firefox */
        -ms-user-select: none; /* IE10+/Edge */
        user-select: none; /* Standard */
      }

      .textBottom {
        position: absolute;
        bottom: 20px;
      }

      .textTop {
        position: absolute;
        top: 20px;
      }

      #Grandeurs {
        background: no-repeat url('/images/Environnements/logo_grandeurs.svg') center center #0baf73;

        background-size: auto 150%;

        /* background: url('/images/Environnements/grandeurs.\${unsafeCSS(
            this.isSafari ? 'png' : 'webp'
          )}');
          center center rgba(255, 255, 255, 0.9); */
      }

      #Tangram {
        background: no-repeat url('/images/Environnements/logo_tangram.svg') center
          center #006CAA;

        background-size: auto 180%;


        /* background: url('/images/Environnements/tangram.\${unsafeCSS(
            this.isSafari ? 'jpg' : 'webp'
          )}');
          center center rgba(255, 255, 255, 0.9); */

      }

      #Cubes {
        background: no-repeat url('/images/Environnements/logo_cubes.svg') center center
        #cf5f2c;

        background-size: auto 150%;

        /* background: url('/images/Environnements/cubes.\${unsafeCSS(
            this.isSafari ? 'png' : 'webp'
          )}');
          center center rgba(255, 255, 255, 0.9); */
        /* background-repeat: no-repeat;
        background-size: cover; */
      }

      #Geometrie {
        background: no-repeat url('/images/Environnements/logo_geometrie.svg') center center
        #888;

        background-size: auto 150%;
      }
    `;
  }

  render() {
    return html`
      <div id="Grandeurs" name="Grandeurs" class="envTile" @click="${() => this.handleClick('Grandeurs')}">
        <div class="textBottom envText" name="Grandeurs">
          Grandeurs
        </div>
      </div>
      <div id="Tangram" name="Tangram" class="envTile" @click="${() => this.handleClick('Tangram')}">
        <div class="textBottom envText" name="Tangram">
          Tangram
        </div>
      </div>
      <div id="Cubes" name="Cubes" class="envTile" @click="${() => this.handleClick('Cubes')}">
        <div class="textTop envText" name="Cubes">
          Cubes
        </div>
      </div>
      <div id="Geometrie" name="Geometrie" class="envTile" @click="${() => this.handleClick('Geometrie')}">
        <div class="textTop envText" name="Geometrie">
          Géométrie
        </div>
      </div>
      <img
        src="images/manifest/icon.svg"
        style="position: absolute; top: calc(50% - 13vmin); left: calc(50% - 13vmin); width: 26vmin; height: 26vmin; transform: rotate(45deg);"
        draggable="false"
      />
    `;
  }

  async handleClick(e) {
    setState({ environmentLoading: true });
    setState({ environment: await loadEnvironnement(e) });
  }
}
customElements.define('ag-environnements', AgEnvironnements);
