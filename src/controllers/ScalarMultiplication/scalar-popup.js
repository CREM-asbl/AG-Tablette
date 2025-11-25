import '@components/color-button';
import '@styles/popup-variables.css';
import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';
import { range } from '../Core/Tools/utils';

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

  static styles = css`
    .field {
      display: var(--popup-field-display);
      align-items: var(--popup-field-align-items);
      padding: var(--popup-field-padding);
      width: var(--popup-field-width);
    }

    select {
      height: var(--popup-select-height);
      width: var(--popup-select-width);
      border-radius: var(--popup-select-border-radius);
      text-align: center;
      width: 2.5rem;
    }

    input {
      height: var(--popup-input-height);
      width: var(--popup-input-width);
      border-radius: var(--popup-input-border-radius);
    }

    input[type='checkbox'] {
      height: var(--popup-checkbox-height);
      width: var(--popup-checkbox-width);
    }

    label {
      font-weight: var(--popup-label-font-weight);
      margin: var(--popup-label-margin);
      font-size: var(--popup-label-font-size);
    }

    span {
      font-weight: normal;
    }

    hr {
      height: 4px;
      width: 20%;
      border-width: 0;
      text-align: left;
      margin: 3px auto 3px;
      color: black;
      background-color: black;
    }
  `;



  render() {
    return html`
      <template-popup>
        <h2 slot="title">Multiplier un vecteur par un scalaire</h2>
        <div slot="body" id="body">
          <label for="settings_divide_number_of_parts">Multiplier par</label>
          <select @change="${this.changeNumerator}">
            ${range(1, 9).map(
      (x) =>
        html`<option value="${x}" ?selected="${this.numerator === x}">
                  ${x}
                </option>`,
    )}
          </select>
          <hr />
          <select @change="${this.changeDenominator}">
            ${range(1, 9).map(
      (x) =>
        html`<option value="${x}" ?selected="${this.denominator === x}">
                  ${x}
                </option>`,
    )}
          </select>
        </div>

        <div slot="footer">
          <color-button
            @click="${() =>
        window.dispatchEvent(new CustomEvent('close-popup'))}"
            innerText="Ok"
          ></color-button>
        </div>
      </template-popup>
    `;
  }

  changeNumerator(event) {
    setState({
      settings: {
        ...app.settings,
        scalarNumerator: parseInt(event.target.value),
      },
    });
  }

  changeDenominator(event) {
    setState({
      settings: {
        ...app.settings,
        scalarDenominator: parseInt(event.target.value),
      },
    });
  }

  submit() {
    setState({
      tool: {
        ...app.tool,
        name: 'scalarMultiplication',
        currentStep: 'selectObject',
      },
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
