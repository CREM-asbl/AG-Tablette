import { LitElement, html, css } from 'lit-element';
import '../version-item';
import { app } from '../js/App';

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
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        position: absolute;
        top: 0px;
        left: 0px;
        z-index: 100;
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

      label {
        display: block;
        margin: 0 16px;
        font-weight: bold;
        font-size: 1rem;
      }

      button {
        padding: 8px 16px;
        margin: 0 4px;
      }
    `;
  }

  static get styles() {
    return css`
      #template-view {
        position: absolute;
        left: 2%;
        top: 2%;
        right: 2%;
        bottom: 2%;
        border-radius: 10px;
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

      footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
      }

      version-item {
        flex: 1;
      }
    `;
  }

  constructor() {
    super();

    addEventListener('keyup', e => {
      e.key === 'Escape' && this.dispatchEvent(new Event('close-popup'));
    });
  }

  render() {
    return html`
      <div id="template-view">
        <div id="popup-close" @click="${() => this.dispatchEvent(new Event('close-popup'))}">
          &times;
        </div>

        <slot name="title"></slot>

        <slot name="body"></slot>

        <footer>
          <version-item></version-item>
          <slot name="footer"></slot>
        </footer>
      </div>
    `;
  }
}
customElements.define('template-popup', TemplatePopup);
