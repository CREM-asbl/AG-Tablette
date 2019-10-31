import { LitElement, html } from 'lit-element';
import { app } from '../js/App';

class DividePopup extends LitElement {
  constructor() {
    super();
    this.parts = 2;
  }

  static get properties() {
    return {
      parts: Number,
    };
  }

  render() {
    return html`
      <style>
        :host {
          display: none;
        }

        .background {
          display: flex;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          align-items: center;
          justify-content: center;
        }

        #divide-popup {
          padding: 16px;
          border-radius: 4px;
          background-color: #ddd;
          width: 30%;
          min-width: 250px;
          overflow-y: auto;
          text-align: center;
          box-shadow: 0 1px 2px black;
        }

        select {
          font-size: 16px;
        }

        button {
          padding: 4px 8px;
          margin-top: 16px;
        }
      </style>
      <div class="background">
        <div id="divide-popup">
          <label for="settings_divide_number_of_parts">Diviser en </label>
          <select @change="${e => (this.parts = e.target.value)}">
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
          </select>
          <span> parties</span>
          <br />
          <button @click="${this.close}">Annuler</button>
          <button @click="${this.dividePopupValidate}">OK</button>
        </div>
      </div>
    `;
  }

  close() {
    this.style.display = 'none';
  }

  dividePopupValidate() {
    app.state.setNumberOfparts(this.parts);
    this.close();
  }
}
customElements.define('divide-popup', DividePopup);
