import { LitElement, html, css } from 'lit';

export class TemplatePopup extends LitElement {
  static get properties() {
    return {
      title: { type: String },
    };
  }

  /**
   * default styles for popup
   */
  static template_popup_styles() {
    return css`
      :host {
        display: none;
      }

      h2 {
        padding: 16px;
        margin: 0;
      }

      .field {
        display: flex;
        align-items: center;
        padding: 8px 0;
      }

      select {
        height: 32px;
        width: 150px;
      }

      input[type='checkbox'] {
        height: 24px;
        width: 24px;
      }

      [slot='title'] {
        grid-area: 1 / 1 / 2 / 2;
      }

      [slot='body'] {
        grid-area: 2 / 1 / 3 / 3;
        display: grid;
        place-items: center;
        overflow: auto;
        padding: 16px;
        text-align: center;
      }

      [slot='footer'] {
        grid-area: 3 / 1 / 4 / 3;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
      }

      label {
        display: block;
        margin: 0 4px;
        font-weight: bold;
        font-size: 1rem;
      }

      button {
        display: block;
        padding: 8px 16px;
        margin: 0 4px;
        background-color: var(--theme-color);
        border: none;
        box-shadow: 0px 0px 3px var(--menu-shadow-color);
        border-radius: 3px;
      }
    `;
  }

  static get styles() {
    return css`
      .background {
        display: flex;
        background-color: rgba(102, 102, 102, 0.5);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
      }

      #template-view {
        display: grid;
        grid-template-columns: 1fr 40px;
        margin: auto;
        border-radius: 7px;
        box-shadow: 0px 0px 30px rgb(102, 102, 102);
        /* border: 2px solid gray; */
        background-color: var(--theme-color-soft);
        overflow-y: hidden;
      }

      #popup-close {
        grid-area: 1 / 2;
        font-size: 40px;
        cursor: pointer;
        color: #555;
        margin: 8px;
        /* overflow: hidden; */
        line-height: 40%;

        display: grid;
        text-align: right;
      }
    `;
  }

  render() {
    return html`
      <div class="background">
        <div id="template-view">
          <div
            id="popup-close"
            @click="${() => window.dispatchEvent(new Event('close-popup'))}"
          >
            &times;
          </div>

          <slot name="title"></slot>

          <slot name="body"></slot>

          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }
}

addEventListener('keyup', (e) => {
  e.key === 'Escape' && window.dispatchEvent(new Event('close-popup'));
});

customElements.define('template-popup', TemplatePopup);
