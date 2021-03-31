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

    window.addEventListener('browsing-finished', () => this.close());

    window.addEventListener('actions-executed', () => this.index++);

    window.addEventListener('complete-history-steps', event => {
      this.sidebarElements = event.detail.steps
        .filter(step => step.type == 'actions-executed')
        .map(step => {
          return { name: step.detail.name };
        });
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
        height: calc(var(--vh, 1vh) * 96);
        bottom: 2vh;
        bottom: calc(var(--vh, 1vh) * 2);
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

  close() {
    this.remove();
  }
}
customElements.define('completehistory-tools', completeHistoryTools);
