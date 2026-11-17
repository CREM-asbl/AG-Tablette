import '@components/color-button';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('select-menu')
class SelectMenu extends LitElement {
  @property({ type: Array }) potentialShapes: any[] = [];

  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());
  }

  static styles = css`
    /* Template popup base styles (inlined to avoid circular dependency) */
    .field {
      display: flex;
      align-items: center;
      padding: 8px 0;
      width: 100%;
    }

    select {
      height: 32px;
      width: auto;
      border-radius: 4px;
    }

    input {
      height: 24px;
      width: auto;
      border-radius: 4px;
    }

    input[type='checkbox'] {
      height: 24px;
      width: 24px;
    }

    label {
      font-weight: normal;
      margin: 0 8px;
      font-size: 1rem;
    }

    /* Component-specific styles */
    p {
      text-align: center;
    }

    [slot='body'] {
      padding: 0;
    }

    [slot='footer'] {
      padding-top: 16px;
    }
  `;

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
