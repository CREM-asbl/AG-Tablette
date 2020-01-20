import { LitElement, html } from 'lit-element';
import { TemplatePopup } from './template-popup';

class OpacityPopup extends LitElement {
  constructor() {
    super();

    window.addEventListener('setOpacity', event => {
      this.opacity = event.detail.opacity;
      this.close();
    });
  }

  static get properties() {
    return {
      opacity: Number,
    };
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup @close-popup="${this.opacityPopupValidate}">
        <h2 slot="title">Opacité</h2>
        <div slot="body" id="body">
          <div class="field">
            <label for="opacity_popup_select">Opacité </label>
            <select
              name="opacity_popup_select"
              id="opacity_popup_select"
              @change="${this._actionHandle}"
            >
              <option value="0" ?selected="${this.opacity == 0}">
                transparent
              </option>
              <option value="0.7" ?selected="${this.opacity == 0.7}">
                semi-transparent
              </option>
              <option value="1" ?selected="${this.opacity == 1}">
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
