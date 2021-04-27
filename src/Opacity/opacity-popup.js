import { LitElement, html } from 'lit-element';
import { TemplatePopup } from '../popups/template-popup';
import { CompleteHistoryManager } from '../Core/Managers/CompleteHistoryManager';
import { setState } from '../Core/App';

class OpacityPopup extends LitElement {
  constructor() {
    super();

    this.opacity = app.workspaceSettings.shapeOpacity;
    window.addEventListener('state-changed', () => this.opacity = app.workspaceSettings.shapeOpacity);

    window.addEventListener('close-popup', () => {
      this.submitAndClose();
    },
    {
      once: true,
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
            <label for="opacity_popup_select">Opacité</label>
            <select
              name="opacity_popup_select"
              id="opacity_popup_select"
              @change="${this.changeOpacity}"
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
          <button @click="${this.submitAndClose}">Ok</button>
        </div>
      </template-popup>
    `;
  }

  changeOpacity(event) {
    setState({ workspaceSettings: { ...app.workspaceSettings, shapeOpacity: event.target.value } });
  }

  submit() {
    setState({ tool: { ...app.tool, name: 'opacity', currentStep: 'selectObject' } });
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
