import { LitElement, html, css } from 'lit-element';
import { app } from './Core/App';
import { FullHistoryManager } from './Core/Managers/FullHistoryManager';

class FullHistoryTools extends LitElement {
  static get properties() {
    return {
      sidebarElements: Array,
      index: Number,
    };
  }

  constructor() {
    super();
    this.sidebarElements = app.fullHistory.steps
      .filter((step) => step.type == 'add-fullstep')
      .map((step) => {
        return { name: step.detail.name };
      });
    this.index = 0;

    this.eventHandler = () => {
      if (app.fullHistory.isRunning)
        this.index = app.fullHistory.actionIndex;
      else
        this.close();
    };
    this.close = () => {
      this.remove();
      window.removeEventListener('fullHistory-changed', this.eventHandler);
    };
    window.addEventListener('fullHistory-changed', this.eventHandler);
  }

  static get styles() {
    return css`
      :host {
        display: none;
      }

      nav#sidebar {
        display: flex;
        justify-content: start;
        flex-direction: column;
        z-index: 10;
        position: absolute;
        right: 10px;
        width: calc(4 * 56px + 7 * 2px);
        height: 96vh;
        height: calc(var(--vh, 1vh) * 96);
        bottom: 2vh;
        bottom: calc(var(--vh, 1vh) * 2);
        border: 2px solid black;
      }

      #command-container {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        margin-top: 2px;
        margin-bottom: 2px;
      }

      #action-container {
        overflow: auto;
      }

      nav#sidebar button {
        margin: 5px;
        width: calc(100% - 2 * 5px);
        height: 2vh;
        height: calc(var(--vh, 1vh) * 5);
      }
    `;
  }

  _clickHandler(event) {
    let index = parseInt(this.index);
    switch (event.target.name) {
      case 'action-button':
        let idx = parseInt(event.target.id);
        FullHistoryManager.moveTo(idx);
        break;
      case 'undo':
        if (index == 0) {
          break;
        }
        FullHistoryManager.moveTo(index - 1);
        break;
      case 'stop':
        FullHistoryManager.stopBrowsing();
        break;
      case 'pause':
        FullHistoryManager.pauseBrowsing();
        event.target.name = 'play';
        break;
      case 'play':
        FullHistoryManager.playBrowsing();
        event.target.name = 'pause';
        break;
      case 'redo':
        if (index >= app.fullHistory.numberOfActions - 1) {
          break;
        }
        FullHistoryManager.moveTo(index + 1);
        break;
    }
  }

  render() {
    return html`
      <style>
        button {
          background-color: #0000;
        }
        button#b${this.index} {
          background-color: #00F;
        }
      </style>
      <nav id="sidebar">
        <div id="command-container">
          <icon-button
            name="undo"
            title="étape précédente"
            @click="${this._clickHandler}"
          ></icon-button>
          <icon-button
            name="stop"
            title="arrêter"
            @click="${this._clickHandler}"
          ></icon-button>
          <icon-button
            name="pause"
            title="pause"
            @click="${this._clickHandler}"
          ></icon-button>
          <icon-button
            name="redo"
            title="étape suivante"
            @click="${this._clickHandler}"
          ></icon-button>
        </div>
        <div id="action-container">
          ${this.sidebarElements.map((elem, idx) => {
            return html`
              <button
                id="b${idx}"
                idx="${idx}"
                @click="${this._clickHandler}"
                name="action-button"
              >
                ${elem.name}
              </button>
            `;
          })}
        </div>
      </nav>
    `;
  }
}
customElements.define('fullhistory-tools', FullHistoryTools);
