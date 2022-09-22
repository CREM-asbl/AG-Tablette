import { css, html, LitElement } from 'lit';

export class TemplatePopup extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      popupHeight: { type: Number }
    };
  }

  constructor() {
    super();

    this.popupHeight = 70;
    this.movementSpeed = 7;
  }

  /**
   * default styles for popup
   */
  static template_popup_styles() {
    return css`
      :host {
        display: none;
      }

      h2, h3 {
        padding: 16px;
        margin: 0;
        font-size: 1.5em;
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
        padding-top: 3px;
        text-align: center;
      }

      [slot='footer'] {
        grid-area: 3 / 1 / 4 / 3;
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        padding: 16px;
        padding-top: 0px;
      }

      label {
        display: inline-block;
        font-weight: normal;
        margin: 0 4px;
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

      color-button {
        display: block;
        padding: 8px 16px;
        margin: 0 4px;
        background-color: var(--theme-color);
        border: none;
        box-shadow: 0px 0px 3px var(--menu-shadow-color);
        border-radius: 3px;
        cursor: pointer;
      }

      color-button:hover {
        opacity: 0.8;
        box-shadow: 0px 0px 5px var(--menu-shadow-color);
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
        max-height: 100%;
        overflow: auto;
        display: grid;
        grid-template-columns: 1fr 40px;
        margin: auto;
        border-radius: 7px;
        box-shadow: 0px 0px 30px rgb(102, 102, 102);
        /* border: 2px solid gray; */
        background-color: var(--theme-color-soft);
      }

      #popup-close {
        grid-area: 1 / 2;
        font-size: 40px;
        cursor: pointer;
        color: #555;
        margin: 8px;
        line-height: 40%;

        display: grid;
        text-align: right;
      }
    `;
  }

  updateHeight() {
    // this.movementSpeed *= 2;
    if (this.popupHeight > 0) {
      this.popupHeight -= this.movementSpeed;
      window.requestAnimationFrame(() => this.updateHeight());
    }
  }

  firstUpdated() {
    window.requestAnimationFrame(() => this.updateHeight());
  }

  render() {
    return html`
      <div class="background" style="padding-bottom: ${this.popupHeight}px;">
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

window.addEventListener('keyup', (e) => {
  e.key === 'Escape' && window.dispatchEvent(new Event('close-popup'));
});

customElements.define('template-popup', TemplatePopup);
