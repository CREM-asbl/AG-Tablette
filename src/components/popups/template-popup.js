import { css, html, LitElement } from 'lit';

/**
 * Base popup component providing modal dialog functionality with slots for title, body, and footer.
 * All popup components should use this as a wrapper via <template-popup> tag.
 * 
 * @example
 * <template-popup>
 *   <h2 slot="title">My Title</h2>
 *   <div slot="body">Content here</div>
 *   <div slot="footer"><button>OK</button></div>
 * </template-popup>
 */
export class TemplatePopup extends LitElement {
  static properties = {
    title: { type: String },
  };


  static styles = css`
    :host {
      position: relative;
    }

    dialog::backdrop {
      background-color: rgba(102, 102, 102, 0.5);
    }

    dialog {
      overflow: auto;
      display: grid;
      gap: 16px;
      grid-template: auto 1fr auto / 1fr;
      border-radius: 8px;
      box-shadow: 0px 0px 30px rgb(102, 102, 102);
      border: 2px solid gray;
      background-color: var(--theme-color-soft);
    }

    #popup-close {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 40px;
      cursor: pointer;
      color: #555;
      margin: 8px;
      line-height: 40%;
      display: var(--display-close, grid);
      text-align: right;
    }

    ::slotted([slot='title']) {
      padding: 0;
      margin: 0;
      font-size: 1.5em;
    }

    ::slotted([slot='body']) {
      display: grid;
      place-items: center;
      overflow: auto;
      scrollbar-width: thin;
    }

    ::slotted([slot='footer']) {
      display: grid;
      grid-auto-flow: column;
      gap: 8px;
      align-items: center;
      box-sizing: border-box;
    }
  `;
  render() {
    return html`
      <dialog>
        <slot
          id="popup-close"
          name="close"
          @click="${() => window.dispatchEvent(new Event('close-popup'))}"
        >
          &times;
        </slot>

        <slot name="title"></slot>

        <slot name="body"></slot>

        <slot name="footer"></slot>
      </dialog>
    `;
  }

  firstUpdated() {
    this.shadowRoot?.querySelector('dialog')?.showModal();
    window.addEventListener('keyup', (e) => {
      e.key === 'Escape' && window.dispatchEvent(new Event('close-popup'));
    });
  }
}
customElements.define('template-popup', TemplatePopup);
