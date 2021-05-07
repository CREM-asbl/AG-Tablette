import { LitElement, html } from 'lit-element';
import { TemplatePopup } from '../popups/template-popup';
import { app, setState } from '../Core/App';

class OpacityPopup extends LitElement {
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
      this.opacity = app.settings.shapeOpacity;
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };
    window.addEventListener('settings-changed', this.eventHandler);
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
              <option value="1" ?selected="${this.opacity == 1}">opaque</option>
            </select>
          </div>
        </div>

        <div slot="footer">
          <button @click="${() => window.dispatchEvent(new CustomEvent('close-popup'))}">Ok</button>
        </div>
      </template-popup>
    `;
  }

  changeOpacity(event) {
    setState({
      settings: { ...app.settings, shapeOpacity: event.target.value },
    });
  }

  submit() {
    setState({
      tool: { ...app.tool, name: 'opacity', currentStep: 'selectObject' },
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
customElements.define('opacity-popup', OpacityPopup);
