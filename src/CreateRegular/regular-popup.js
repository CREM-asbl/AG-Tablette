import { LitElement, html, css } from 'lit';
import { TemplatePopup } from '../popups/template-popup';
import { app, setState } from '../Core/App';

class RegularPopup extends LitElement {
  constructor() {
    super();

    window.addEventListener(
      'close-popup',
      () => {
        this.submitAndClose();
      },
      {
        once: true,
      },
    );

    this.updateProperties = () => {
      this.points = app.settings.numberOfRegularPoints;
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };
    window.addEventListener('settings-changed', this.eventHandler);
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
        select {
          width: 2rem;
        }
      `,
    ];
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Dessiner un polygone régulier</h2>
        <div slot="body" id="body">
          <label for="settings_divide_number_of_parts"
            >Dessiner un polygone à ${this.points} cotés
          </label>
          <input
            type="range"
            min="3"
            max="20"
            value="${this.points}"
            list="level"
            @input="${this.changeNumberOfPoints}"
          />
          <datalist id="level">
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
        </div>

        <div slot="footer">
          <color-button @click="${() => window.dispatchEvent(new CustomEvent('close-popup'))}" innerText="Ok" backgroundColor="${getComputedStyle(document.documentElement).getPropertyValue('--theme-color')}"></color-button>
        </div>
      </template-popup>
    `;
  }

  changeNumberOfPoints(event) {
    setState({
      settings: { ...app.settings, numberOfRegularPoints: event.target.value },
    });
  }

  submit() {
    setState({
      tool: { ...app.tool, name: 'createRegularPolygon', currentStep: 'drawFirstPoint' },
    });
  }

  close() {
    this.remove();
    window.removeEventListener('settings-changed', this.eventHandler);
  }

  submitAndClose() {
    this.submit();
    this.close();
  }
}
customElements.define('regular-popup', RegularPopup);
