import { LitElement, html } from 'lit-element';
import { app } from './js/App';
import { State } from './js/States/State';

class AgEnvironnements extends LitElement {
  render() {
    return html`
      <style>
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

        #grandeurs {
          background: url('/images/Environnements/grandeurs.webp');
          background-repeat: no-repeat;
          background-size: cover;
        }
      </style>

      <div id="grandeurs" @click="${this.handleClick}">Grandeurs</div>
      <div id="tangram">Tangram</div>
      <div id="cubes">Cubes</div>
      <div id="geometrie">Géométrie</div>
    `;
  }

  handleClick(e) {
    app.environnement = e.target.id;
    window.dispatchEvent(new CustomEvent('state-changed'));
  }
}
customElements.define('ag-environnements', AgEnvironnements);
