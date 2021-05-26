import { app } from '../Core/App';
import { LitElement, html, css } from 'lit';

class StateMenu extends LitElement {
  constructor() {
    super();
    this.buttons = [];

    window.addEventListener('close-state-menu', () => {
      this /*.shadowRoot.querySelector('state-menu')*/.remove();
    });
  }

  static get properties() {
    return {
      buttons: { type: Array },
    };
  }

  static get styles() {
    return css`
      :host {
        position: absolute;
        top: 5px;
        padding: 10px;
        font-size: 20px;
        border-radius: 5px;
        border: 2px solid gray;
        background-color: rgba(0, 0, 0, 0.15);
        width: auto;
        max-width: calc(100% - 230px);
        overflow-y: auto;
        max-height: 30%;
        left: ${app.settings.mainMenuWidth + 5}px;
      }

      div#state-menu-buttons-list > button {
        font-size: 20px;
        border-radius: 5px;
        margin: 5px;
        padding: 4px;
        display: inline-block;
        background-color: #bbb;
      }
    `;
  }

  render() {
    return html`
      <div id="state-menu-buttons-list">
        ${this.buttons.map(
          (button) => html`
            <button @click="${() => this.clickBtn(button.value)}">
              ${button.text}
            </button>
          `,
        )}
      </div>
    `;
  }

  clickBtn(value) {
    window.dispatchEvent(
      new CustomEvent('state-menu-button-click', { detail: value }),
    );
  }
}

customElements.define('state-menu', StateMenu);
