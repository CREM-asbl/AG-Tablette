import { LitElement, html, css } from 'lit-element';
import { app } from '../js/App';
import { TemplatePopup } from './template-popup';

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

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        label {
          display: inline-block;
        }
        select {
          width: 2rem;
        }
      `,
    ];
  }

  render() {
    return html`
      <template-popup @close-popup="${this.close}">
        <h2 slot="title">Division</h2>
        <div slot="body" id="body">
          <label for="settings_divide_number_of_parts">Diviser en</label>
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
        </div>

        <div slot="footer">
          <button @click="${this.dividePopupValidate}">Ok</button>
        </div>
      </template-popup>
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
