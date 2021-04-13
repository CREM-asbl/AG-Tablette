import { LitElement, html } from 'lit-element';
import { TemplatePopup } from '../popups/template-popup';
import { CompleteHistoryManager } from '../Core/Managers/CompleteHistoryManager';

class OpacityPopup extends LitElement {
  constructor() {
    super();

    window.addEventListener('setOpacity', event => {
      this.opacity = event.detail.opacity;
      this.close();
    });

    window.addEventListener('close-popup', () => {
      if (CompleteHistoryManager.isRunning) {
        this.close();
      } else {
        this.submitAndClose();
      }
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
      <template-popup>
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
              <option value="1" ?selected="${this.opacity == 1}">opaque</option>
            </select>
          </div>
        </div>

        <div slot="footer">
          <button @click="${this.submitAndClose}">Ok</button>
        </div>
      </template-popup>
    `;
  }

  submit() {
    window.dispatchEvent(
      new CustomEvent('setOpacity', {
        detail: {
          opacity: parseFloat(
            this.shadowRoot.getElementById('opacity_popup_select').value
          ),
        },
      })
    );
  }

  close() {
    this.remove();
  }

  submitAndClose() {
    this.submit();
    this.close();
  }
}
customElements.define('opacity-popup', OpacityPopup);
