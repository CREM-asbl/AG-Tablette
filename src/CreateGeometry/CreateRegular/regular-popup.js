import { LitElement, html, css } from 'lit-element';
import { TemplatePopup } from '../../popups/template-popup';

class RegularPopup extends LitElement {
  constructor() {
    super();
    this.points = 3;

    window.addEventListener('close-popup', () => this.submit());
  }

  static get properties() {
    return {
      points: Number,
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
        <h2 slot="title">Créer un polygone régulier</h2>
        <div slot="body" id="body">
          <label for="settings_divide_number_of_parts"
            >Créer un polygone à</label
          >
          <input
            type="range"
            min="3"
            max="20"
            value="${this.points}"
            list="level"
            @change="${(e) => (this.points = e.target.value)}"
          />
          <datalist id="level">
            <option value="1" label="1">1</option>
            <option value="2" label="2">2</option>
            <option value="3" label="3">3</option>
            <option value="4" label="4">4</option>
            <option value="5" label="5">5</option>
            <option value="6" label="6">6</option>
            <option value="7" label="7">7</option>
            <option value="8" label="8">8</option>
            <option value="9" label="9">9</option>
            <option value="10" label="10">10</option>
            <option value="11" label="11">11</option>
            <option value="12" label="12">12</option>
            <option value="13" label="13">13</option>
            <option value="14" label="14">14</option>
            <option value="15" label="15">15</option>
            <option value="16" label="16">16</option>
            <option value="17" label="17">17</option>
            <option value="18" label="18">18</option>
            <option value="19" label="19">19</option>
            <option value="20" label="20">20</option>
          </datalist>
          <span> ${this.points} cotés</span>
        </div>

        <div slot="footer">
          <button @click="${this.submit}">Ok</button>
        </div>
      </template-popup>
    `;
  }

  submit() {
    window.dispatchEvent(
      new CustomEvent('setNumberOfPoints', {
        detail: { nbOfPoints: this.points },
      }),
    );
    this.close();
  }

  close() {
    this.remove();
  }
}
customElements.define('regular-popup', RegularPopup);
