import '@components/color-button';
import { templatePopupStyles } from '@components/popups/template-popup';
import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';
import { range } from '../Core/Tools/general';

class DividePopup extends LitElement {
  static properties = {
    parts: Number,
  };

  static styles = [
    templatePopupStyles,
    css`
      select {
        text-align: center;
        width: 2.5rem;
      }
    `,
  ];

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Diviser</h2>
        <div slot="body" id="body">
          <label for="settings_divide_number_of_parts">
            Diviser en
            <select @change="${this.changeNumberOfParts}">
              ${range(2, 9).map(
      (x) =>
        html` <option value="${x}" ?selected="${this.parts === x}">
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
    window.addEventListener(
      'state-changed',
      () => (this.parts = app.settings.numberOfDivisionParts),
    );
    window.addEventListener('close-popup', this.submitAndClose.bind(this));
  }

  changeNumberOfParts(event) {
    setState({
      settings: { ...app.settings, numberOfDivisionParts: event.target.value },
    });
  }

  submit() {
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
