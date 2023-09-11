import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';
import { range } from '../Core/Tools/general';
import { TemplatePopup } from '../popups/template-popup';

class ScalarPopup extends LitElement {
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
      this.numerator = app.settings.scalarNumerator;
      this.denominator = app.settings.scalarDenominator;
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };
    window.addEventListener('settings-changed', this.eventHandler);
  }

  static get properties() {
    return {
      numerator: Number,
      denominator: Number,
    };
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        span {
          font-weight: normal;
        }

        select {
          text-align: center;
          width: 2.5rem;
        }

        hr {
          height:4px;
          width:20%;
          border-width:0;
          text-align:left;
          margin:3px auto 3px;
          color:black;
          background-color:black;
        }
      `,
    ];
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Multiplier un vecteur par un scalaire</h2>
        <div slot="body" id="body">
          <label for="settings_divide_number_of_parts">Multiplier par</label>
          <select @change="${this.changeNumerator}">
            ${range(1, 9).map(
              (x) =>
                html`<option value="${x}" ?selected="${this.numerator == x}">
                  ${x}
                </option>`,
            )}
          </select>
          <hr>
          <select @change="${this.changeDenominator}">
            ${range(1, 9).map(
              (x) =>
                html`<option value="${x}" ?selected="${this.denominator == x}">
                  ${x}
                </option>`,
            )}
          </select>
        </div>

        <div slot="footer">
          <color-button @click="${() => window.dispatchEvent(new CustomEvent('close-popup'))}" innerText="Ok"></color-button>
        </div>
      </template-popup>
    `;
  }

  changeNumerator(event) {
    setState({
      settings: { ...app.settings, scalarNumerator: parseInt(event.target.value) },
    });
  }

  changeDenominator(event) {
    setState({
      settings: { ...app.settings, scalarDenominator: parseInt(event.target.value) },
    });
  }

  submit() {
    setState({
      tool: { ...app.tool, name: 'scalarMultiplication', currentStep: 'selectObject' },
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
customElements.define('scalar-popup', ScalarPopup);
