import { LitElement, html } from 'lit-element';
import { TemplatePopup } from '../popups/template-popup';

class LevelPopup extends LitElement {
  static get properties() {
    return {
      level: { type: Number },
    };
  }

  constructor() {
    super();
    this.level = 1;
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Niveau de difficulté</h2>
        <div slot="body">
          <input
            type="range"
            min="1"
            max="2"
            value="${this.level}"
            list="level"
            @change="${e => (this.level = e.target.value)}"
          />
          <datalist id="level">
            <option value="1" label="1">1</option>
            <option value="2" label="2">2</option>
          </datalist>
        </div>
        <div slot="footer">
          <button @click="${this.submit}">Ok</button>
        </div>
      </template-popup>
    `;
  }

  submit() {
    this.dispatchEvent(
      new CustomEvent('tangram-level-selected', {
        detail: this.level,
        bubbles: true,
        composed: true,
      })
    );
    this.remove();
  }
}
customElements.define('level-popup', LevelPopup);
