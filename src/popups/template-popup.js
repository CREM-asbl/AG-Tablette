import { LitElement, html, css } from 'lit-element';

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

      [slot='body'] {
        height: calc(100% - 160px);
        overflow: auto;
        padding: 16px;
      }

      [slot='footer'] {
        display: flex;
        justify-content: right;
        place-content: center;
        place-items: center;
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
      }
    `;
  }

  static get styles() {
    return css`
      .background {
        display: flex;
        background-color: rgba(0, 0, 0, 0.5);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
      }

      #template-view {
        margin: auto;
        border-radius: 4px;
        border: 2px solid gray;
        background-color: #ddd;
        overflow-y: hidden;
      }

      #popup-close {
        position: relative;
        font-size: 60px;
        float: right;
        cursor: pointer;
        color: #555;
        box-sizing: content-box;
        width: 30px;
        height: 30px;
        margin: 8px;
        overflow: hidden;
        line-height: 40%;
      }
    `;
  }

  render() {
    return html`
      <div class="background">
        <div id="template-view">
          <div id="popup-close" @click="${() => window.dispatchEvent(new Event('close-popup'))}">
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

addEventListener('keyup', e => {
  e.key === 'Escape' && window.dispatchEvent(new Event('close-popup'));
});

customElements.define('template-popup', TemplatePopup);
