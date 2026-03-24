import '@components/color-button';
import '@components/popups/template-popup';
import '@styles/popup-variables.css';
import { css, html, LitElement } from 'lit';
import { appActions } from '../../store/appState';
import { app, setState } from '../Core/App';
import { range } from '../Core/Tools/general';

class DividePopup extends LitElement {
  static properties = {
    parts: Number,
  };

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
  `;

  constructor() {
    super();
    this.parts = Number(app.settings.numberOfDivisionParts) || 2;
    this.handleStateChanged = () => {
      this.parts = Number(app.settings.numberOfDivisionParts) || 2;
    };
    this.handleClosePopup = () => this.submitAndClose();
  }


  render() {
    const selectedParts = Number(this.parts) || 2;
    return html`
      <template-popup>
        <h2 slot="title">Diviser</h2>
        <div slot="body" id="body">
          <label for="settings_divide_number_of_parts">
            Diviser en
            <select @change="${this.changeNumberOfParts}">
              ${range(2, 9).map(
      (x) =>
        html` <option value="${x}" ?selected="${selectedParts === x}">
                    ${x}
                  </option>`,
    )}
            </select>
            parts</label
          >
        </div>

        <div slot="footer">
          <color-button
            @click="${() => window.dispatchEvent(new Event('close-popup'))}"
            innerText="Ok"
          ></color-button>
        </div>
      </template-popup>
    `;
  }

  firstUpdated() {
    window.addEventListener('state-changed', this.handleStateChanged);
    window.addEventListener('close-popup', this.handleClosePopup);
  }

  disconnectedCallback() {
    window.removeEventListener('state-changed', this.handleStateChanged);
    window.removeEventListener('close-popup', this.handleClosePopup);
    super.disconnectedCallback();
  }

  changeNumberOfParts(event) {
    const numberOfDivisionParts = Number(event.target.value);
    this.parts = numberOfDivisionParts;
    setState({
      settings: { ...app.settings, numberOfDivisionParts },
    });
  }

  submit() {
    appActions.setActiveTool('divide');
    appActions.setToolState({});
    appActions.setCurrentStep('selectObject');
    setState({
      tool: { ...app.tool, name: 'divide', currentStep: 'selectObject' },
    });
  }

  submitAndClose() {
    this.submit();
    this.remove();
  }
}
customElements.define('divide-popup', DividePopup);
