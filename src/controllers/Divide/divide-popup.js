import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';
import { range } from '../Core/Tools/general';
import { TemplatePopup } from '../popups/template-popup';

class DividePopup extends LitElement {
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
      this.parts = app.settings.numberOfDivisionParts;
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };
    window.addEventListener('settings-changed', this.eventHandler);
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
        span {
          font-weight: normal;
        }
        select {
          text-align: center;
          width: 2.5rem;
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
          <select @change="${this.changeNumberOfParts}">
            ${range(2, 9).map(
              (x) =>
                html`<option value="${x}" ?selected="${this.parts == x}">
                  ${x}
                </option>`,
            )}
          </select>
          <span>parts</span>
        </div>

        <div slot="footer">
          <color-button @click="${() => window.dispatchEvent(new CustomEvent('close-popup'))}" innerText="Ok"></color-button>
        </div>
      </template-popup>
    `;
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

  close() {
    this.remove();
    window.removeEventListener('settings-changed', this.eventHandler);
  }

  submitAndClose() {
    this.submit();
    this.close();
  }
}
customElements.define('divide-popup', DividePopup);
