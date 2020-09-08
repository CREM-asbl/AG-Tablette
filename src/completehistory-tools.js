import { LitElement, html, css } from 'lit-element';
import { CompleteHistoryManager } from './Core/Managers/CompleteHistoryManager';

class completeHistoryTools extends LitElement {
  static get properties() {
    return {
      sidebarElements: Array,
      index: Number,
      toRender: Boolean,
    };
  }

  constructor() {
    super();
    this.sidebarElements = [];
    this.index = 0;
    this.toRender = false;

    window.addEventListener('start-browsing', () => {
      this.index = 0;
      if (app.workspace.completeHistory.steps.length > 1)
        this.style.display = 'block';
    });

    window.addEventListener('browsing-finished', () => {
      this.style.display = 'none';
    });

    window.addEventListener('actions-executed', event => {
      if (CompleteHistoryManager.isRunning) {
        this.index++;
      } else {
        this.sidebarElements.push(event.detail);
        this.toRender = !this.toRender;
      }
    });
  }

  static get styles() {
    return css`
      :host {
        display: none;
      }

      nav#sidebar {
        display: flex;
        flex-direction: column;
        justify-content: start;
        z-index: 10;
        overflow: auto;
        position: absolute;
        right: 10px;
        width: 200px;
        height: 96vh;
        bottom: 2vh;
        border: 2px solid black;
      }

      nav#sidebar button {
        margin: 5px;
      }
    `;
  }

  _clickHandle(event) {
    CompleteHistoryManager.moveTo(event.target.id);
    this.index = event.target.id;
  }

  render() {
    return html`
      <nav id="sidebar">
        ${this.sidebarElements.map((elem, idx) => {
          if (idx == this.index) {
            return html`
              <button
                id="${idx}"
                style="background-color: blue;"
                @click="${this._clickHandle}"
              >
                ${elem.name}
              </button>
            `;
          } else {
            return html`
              <button id="${idx}" @click="${this._clickHandle}">
                ${elem.name}
              </button>
            `;
          }
        })}
      </nav>
    `;
  }
}
customElements.define('completehistory-tools', completeHistoryTools);
