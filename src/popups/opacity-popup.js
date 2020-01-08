import { LitElement, html } from 'lit-element';
import { app } from '../js/App';
import { TemplatePopup } from './template-popup';

class OpacityPopup extends LitElement {
  constructor() {
    super();
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup @close-popup="${this.close}">
        <h2 slot="title">Opacité</h2>
        <div slot="body" id="body">
          <div class="field">
            <label for="opacity_popup_select">Opacité </label>
            <select
              name="opacity_popup_select"
              id="opacity_popup_select"
              @change="${this._actionHandle}"
            >
              <option
                value="0"
                ?selected="${app.state && app.state.action ? app.state.action.opacity == 0 : false}"
              >
                transparent
              </option>
              <option
                value="0.7"
                ?selected="${app.state && app.state.action
                  ? app.state.action.opacity == 0.7
                  : false}"
              >
                semi-transparent
              </option>
              <option
                value="1"
                ?selected="${app.state && app.state.action ? app.state.action.opacity == 1 : false}"
              >
                opaque
              </option>
            </select>
          </div>
        </div>

        <div slot="footer">
          <button @click="${this.opacityPopupValidate}">Ok</button>
        </div>
      </template-popup>
    `;
  }

  opacityPopupValidate() {
    window.dispatchEvent(
      new CustomEvent('setOpacity', {
        detail: {
          opacity: parseFloat(this.shadowRoot.getElementById('opacity_popup_select').value),
        },
      }),
    );
    this.close();
  }

  close() {
    this.style.display = 'none';
  }
}
customElements.define('opacity-popup', OpacityPopup);
