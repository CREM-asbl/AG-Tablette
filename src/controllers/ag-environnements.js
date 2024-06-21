import { css, html, LitElement } from 'lit';
import { setState } from './Core/App';
import { loadEnvironnement } from './Core/Environment';

class AgEnvironnements extends LitElement {
  static get styles() {
    return css`
      :host {
        display: grid;
        grid-template: 1fr 1fr / 1fr 1fr;
        gap: 2dvh;
        justify-items: center;
        align-items: center;
        height: 100%;
        padding: 2dvh;
        box-sizing: border-box;
        background: lightgray;
      }

      .envTile {
        display: grid;
        place-items: center center;
        width: 100%;
        height: 100%;
        padding: 16px;
        box-shadow: 0 1px 2px black;
        font-weight: bold;
        font-size: 5dvh;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        box-sizing: border-box;
      }

      .envTile:hover {
        box-shadow: 0 3px 8px black;
      }

      .envText {
        text-align: center;
      }

      img {
        display: block;
        width: auto;
        height: 100%;
        object-fit: contain;
      }

      #Grandeurs {
        background: #0baf73;
      }

      #Tangram {
        background: #006CAA;
      }

      #Gandeurs, #Tangram {
        grid-template-rows: "1fr auto";
      }

      #Cubes {
        background: #cf5f2c;
      }

      #Geometrie {
        background: #888;
      }

      #Cubes, #Geometrie {
        grid-template-rows: "auto 1fr";
      }

      .rotate {
        -ms-transform: translateY(-50%);
        transform: translateY(-50%) translateX(-50%) rotate(-30deg);
      }

      .logo-wrapper {
        z-index: 99;
        position: absolute;
        top: calc(50% - 13vmin);
        left: calc(50% - 13vmin);
        width: 26vmin;
        height: 26vmin;
        transform: rotate(45deg);

        filter: drop-shadow( 0px 0px 2px rgba(0, 0, 0));
        -webkit-filter: drop-shadow( 0px 0px 2px rgba(0, 0, 0));
      }

      #logo {
        width: 26vmin;
        height: 26vmin;
      }
    `;
  }

  render() {
    return html`
      <div id="Grandeurs" name="Grandeurs" class="envTile" @click="${() => this.handleClick('Grandeurs')}" alt="logo Grandeurs">
      <img src="/images/Environnements/logo_grandeurs_96x96.svg" alt="logo grandeurs"/>
      <div class="envText" name="Grandeurs">
          Grandeurs
        </div>
      </div>
      <div id="Tangram" name="Tangram" class="envTile" @click="${() => this.handleClick('Tangram')}" alt="logo Tangram">
      <img src="/images/Environnements/logo_tangram_96x96.svg" alt="logo tangram"/>
      <div class="envText" name="Tangram">
          Tangram
        </div>
      </div>
      <div id="Cubes" name="Cubes" class="envTile" @click="${() => this.handleClick('Cubes')}" alt="logo Cubes">
        <div class="envText" name="Cubes">
          Cubes
        </div>
        <img src="/images/Environnements/logo_cubes_96x96.svg" alt="logo cubes"/>
      </div>
      <div id="Geometrie" name="Geometrie" class="envTile" @click="${() => this.handleClick('Geometrie')}" alt="logo Géométrie">
        <div class="envText" name="Geometrie">
          Géométrie
        </div>
        <img src="/images/Environnements/logo_geometrie_96x96.svg" alt="logo géométrie"/>
      </div>
      <div class="logo-wrapper">
        <img
          id="logo"
          src="images/manifest/icon.svg"
          draggable="false"
          alt="logo"
        />
      </div>
    `;
  }

  async handleClick(e) {
    loadEnvironnement(e)
  }
}
customElements.define('ag-environnements', AgEnvironnements);
