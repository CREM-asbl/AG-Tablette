import { LitElement, html, css } from 'lit-element';
import { TemplatePopup } from '../popups/template-popup';

class DividePopup extends LitElement {
  constructor() {
    super();
    this.parts = 2;

    window.addEventListener('close-popup', () => this.submit());
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
      <template-popup>
        <h2 slot="title">Diviser</h2>
        <div slot="body" id="body">
          <label for="settings_divide_number_of_parts">Diviser en</label>
          <select @change="${e => (this.parts = e.target.value)}">
            <option value="2" ?selected="${this.parts == 2}">2</option>
            <option value="3" ?selected="${this.parts == 3}">3</option>
            <option value="4" ?selected="${this.parts == 4}">4</option>
            <option value="5" ?selected="${this.parts == 5}">5</option>
            <option value="6" ?selected="${this.parts == 6}">6</option>
            <option value="7" ?selected="${this.parts == 7}">7</option>
            <option value="8" ?selected="${this.parts == 8}">8</option>
          </select>
          <span> parties</span>
        </div>

        <div slot="footer">
          <button @click="${this.submit}">Ok</button>
        </div>
      </template-popup>
    `;
  }

  close() {
    this.remove();
  }

  submit() {
    window.dispatchEvent(
      new CustomEvent('setNumberOfParts', {
        detail: { nbOfParts: this.parts, close: true },
      })
    );
    this.close();
  }
}
customElements.define('divide-popup', DividePopup);
