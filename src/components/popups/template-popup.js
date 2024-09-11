import { css, html, LitElement } from 'lit';

export class TemplatePopup extends LitElement {
  static properties = {
    title: { type: String }
  };

  /**
   * default styles for popup
   */
  static template_popup_styles() {
    return css`
      .field {
        display: flex;
        align-items: center;
        padding: 8px 0;
        width : 100%;
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

      input[type=checkbox] {
        height: 24px;
        width: 24px;
      }

      label {
        font-weight: normal;
        margin: 0 8px;
        font-size: 1rem;
      }
    `;
  }

  static styles = css`
      :host {
        position: relative
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

      ::slotted([slot=title]) {
        padding: 0;
        margin: 0;
        font-size: 1.5em;
      }

      ::slotted([slot=body]) {
        display: grid;
        place-items: center;
        overflow: auto;
        scrollbar-width: thin;
      }

      ::slotted([slot=footer]) {
        display: grid;
        grid-auto-flow: column;
        gap: 8px;
        align-items: center;
        box-sizing: border-box;
      }
  `
  render() {
    return html`
      <dialog>
          <slot id="popup-close" name="close"
            @click="${() => window.dispatchEvent(new Event('close-popup'))}">
            &times;
          </slot>

          <slot name="title"></slot>

          <slot name="body"></slot>

          <slot name="footer"></slot>
      </dialog>
    `;
  }

  firstUpdated() {
    this.shadowRoot?.querySelector('dialog')?.showModal()
    window.addEventListener('keyup', (e) => {
      e.key === 'Escape' && window.dispatchEvent(new Event('close-popup'));
    });
  }
}
customElements.define('template-popup', TemplatePopup);
