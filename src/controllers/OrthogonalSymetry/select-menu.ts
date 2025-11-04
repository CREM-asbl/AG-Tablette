import '@components/color-button';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { TemplatePopup } from '../../components/popups/template-popup';

@customElement('select-menu')
class SelectMenu extends LitElement {
  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());
  }

  static get properties() {
    return {
      potentialShapes: { type: Array },
    };
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        p {
          text-align: center;
        }

        [slot='body'] {
          padding: 0;
        }

        [slot='footer'] {
          padding-top: 16px;
        }
      `,
    ];
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">${'Figure'}</h2>
        <div slot="body" id="body">
          ${this.potentialShapes.map(
            (s) => html`
              <color-button @click="${this.clickHandler}" innerText="${s.id}">
              </color-button>
            `,
          )}
        </div>
      </template-popup>
    `;
  }

  clickHandler(e) {
    const shapeId = e.target.innerText;
    window.dispatchEvent(
      new CustomEvent('shapeSelected', { detail: { shapeId } }),
    );
    this.close();
  }

  close() {
    window.dispatchEvent(new CustomEvent('shapeSelected', { detail: {} }));
    this.remove();
  }
}
