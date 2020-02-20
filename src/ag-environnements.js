import { LitElement, html, css } from 'lit-element';
import { EnvironmentManager } from './js/EnvironmentManager';

class AgEnvironnements extends LitElement {
  static get styles() {
    return css`
      :host {
        display: grid;
        grid-template: 1fr 1fr / 1fr 1fr;
        gap: 16px;
        justify-items: center;
        align-items: center;
        height: 100vh;
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
        background: url('/images/Environnements/grandeurs.webp');
        background-repeat: no-repeat;
        background-size: cover;
      }

      #Tangram {
      }

      #Cubes {
      }

      #Geometrie {
      }
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
