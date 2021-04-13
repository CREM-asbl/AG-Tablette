import { LitElement, html, css } from 'lit-element';
import { CompleteHistoryManager } from './Core/Managers/CompleteHistoryManager';

class completeHistoryTools extends LitElement {
  static get properties() {
    return {
      sidebarElements: Array,
      index: Number,
    };
  }

  constructor() {
    super();
    this.sidebarElements = app.workspace.completeHistory.steps
      .filter(step => step.type == 'actions-executed')
      .map(step => {
        return { name: step.detail.name };
      });
    this.index = 0;

    window.addEventListener('browsing-finished', () => this.close());

    window.addEventListener('actions-executed', () => this.index++);
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

  _clickHandle(event) {
    switch (event.target.name) {
      case 'action-button':
        CompleteHistoryManager.moveTo(event.target.id);
        this.index = event.target.id;
        break;
      case 'undo':
        if (this.index == 0) {
          console.log('break');
          break;
        }
        this.index--;
        CompleteHistoryManager.moveTo(this.index);
        break;
      case 'stop':
        CompleteHistoryManager.stopBrowsing();
        break;
      case 'pause':
        CompleteHistoryManager.pauseBrowsing();
        event.target.name = 'play';
        break;
      case 'play':
        CompleteHistoryManager.playBrowsing();
        event.target.name = 'pause';
        break;
      case 'redo':
        if (this.index >= this.sidebarElements.length - 1) {
          console.log('break');
          break;
        }
        this.index++;
        CompleteHistoryManager.moveTo(this.index);
        break;
    }
  }

  render() {
    return html`
      <nav id="sidebar">
        <div id="command-container">
          <icon-button name="undo" title="étape précédente" @click="${this._clickHandle}"></icon-button>
          <icon-button name="stop" title="arrêter" @click="${this._clickHandle}"></icon-button>
          <icon-button name="pause" title="pause" @click="${this._clickHandle}"></icon-button>
          <icon-button name="redo" title="étape suivante" @click="${this._clickHandle}"></icon-button>
        </div>
        <div id='action-container'>
        ${this.sidebarElements.map((elem, idx) => {
          return html`
            <button
              id="${idx}"
              style="background-color: ${idx == this.index ? 'blue' : 'white'}"
              @click="${this._clickHandle}"
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

  close() {
    this.remove();
  }
}
customElements.define('completehistory-tools', completeHistoryTools);
