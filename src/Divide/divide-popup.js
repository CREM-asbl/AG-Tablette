import { LitElement, html, css } from 'lit-element';
import { app, setState } from '../Core/App';
import { CompleteHistoryManager } from '../Core/Managers/CompleteHistoryManager';
import { TemplatePopup } from '../popups/template-popup';
import { range } from '../Core/Tools/general';

class DividePopup extends LitElement {
  constructor() {
    super();

    window.addEventListener('close-popup', () => {
      this.submitAndClose();
    },
    {
      once: true,
    });

    this.parts = app.workspaceSettings.numberOfDivisionParts;
    window.addEventListener('state-changed', () => this.parts = app.workspaceSettings.numberOfDivisionParts);
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
          <select @change="${this.changeNumberOfParts}">
            ${range(2, 9).map(x => html`<option value="${x}" ?selected="${this.parts == x}">${x}</option>`)}
          </select>
          <span>parties</span>
        </div>

        <div slot="footer">
          <button @click="${this.submitAndClose}">Ok</button>
        </div>
      </template-popup>
    `;
  }

  changeNumberOfParts(event) {
    setState({ workspaceSettings: { ...app.workspaceSettings, numberOfDivisionParts: event.target.value } });
  }

  submit() {
    setState({ tool: { ...app.tool, name: 'divide', currentStep: 'selectObject' } });
  }

  close() {
    this.remove();
  }

  submitAndClose() {
    this.submit();
    this.close();
  }
}
customElements.define('divide-popup', DividePopup);
