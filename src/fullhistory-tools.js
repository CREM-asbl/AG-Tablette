import { LitElement, html, css } from 'lit';
import { app } from './Core/App';
import { FullHistoryManager } from './Core/Managers/FullHistoryManager';

class FullHistoryTools extends LitElement {
  static get properties() {
    return {
      tools: Array,
      index: Number,
      playPauseButton: String,
    };
  }

  constructor() {
    super();
    this.playPauseButton = 'pause';
    let previousStepTimestamp = 0;
    this.tools = app.fullHistory.steps
      .filter((step) => step.type == 'tool-changed' && step.detail?.currentStep == 'start')
      .map((step) => {
        let time = step.timeStamp - previousStepTimestamp;
        previousStepTimestamp = step.timeStamp;
        return { name: step.detail.title, time, timeStamp: step.timeStamp, actions: [] };
      });
    let toolIndex = -1;
    let actionIndex = 0;
    app.fullHistory.steps
      .filter((step) => step.type == 'add-fullstep')
      .forEach((step) => {
        let timeStamp = step.timeStamp;
        while (this.tools[toolIndex + 1]?.timeStamp < timeStamp) {
          toolIndex++;
          previousStepTimestamp = this.tools[toolIndex].timeStamp;
        }
        this.tools[toolIndex].actions.push({ name: step.detail.name, time: timeStamp - previousStepTimestamp, timeStamp, actionIndex });
        actionIndex++;
        previousStepTimestamp = this.tools[toolIndex].actions[this.tools[toolIndex].actions.length - 1].timeStamp;
      });
    this.tools.forEach(tool => {
      tool.time = tool.actions.reduce((time, action) => time + action.time, 0)
    });
    this.index = 0;

    this.eventHandler = () => {
      if (app.fullHistory.isRunning) {
        this.index = app.fullHistory.actionIndex;
        this.shadowRoot.getElementById( 'b' + this.index )?.parentNode.scrollIntoView();
      } else this.close();
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

      .action-div {
        width: calc(100% - 2 * 5px - 2 * 5px);
        margin: 5px;
        border-radius: 7px;
        overflow-y: hidden;
        box-shadow: 0px 0px 5px var(--menu-shadow-color);
        padding: 0px 5px;
      }

      h2 {
        text-align: center;
        font-size: 1.1em;
        font-weight: bold;
        margin: 6px 0;
      }

      .action-button {
        margin: 5px 2px 5px 2px;
        width: calc((100% - 2 * 5px - 3 * 2 * 2px) / 3);
        height: 2vh;
        height: calc(var(--vh, 1vh) * 5);
        border-radius: 3px;
        box-shadow: 0px 0px 5px var(--menu-shadow-color);
        border: none;
        padding: 0px;
      }
    `;
  }

  _clickHandler(event) {
    let index = parseInt(this.index);
    console.log(event.target.name);
    switch (event.target.name) {
      case 'action-button':
        this.setPlayPause('play');
        let idx = parseInt(event.target.id.substring(1));
        FullHistoryManager.moveTo(idx);
        break;
      case 'undo':
        if (index == 0) {
          break;
        }
        this.setPlayPause('play');
        FullHistoryManager.moveTo(index - 1);
        break;
      case 'stop':
        FullHistoryManager.stopBrowsing();
        break;
      case 'pause':
        this.setPlayPause('play');
        FullHistoryManager.pauseBrowsing();
        break;
      case 'play':
        this.setPlayPause('pause');
        FullHistoryManager.playBrowsing();
        break;
      case 'redo':
        if (index >= app.fullHistory.numberOfActions - 1) {
          break;
        }
        this.setPlayPause('play');
        FullHistoryManager.moveTo(index + 1);
        break;
    }
  }

  setPlayPause(state) {
    this.playPauseButton = state;
  }

  render() {
    return html`
      <style>
        button {
          background-color: #fff;
        }
        button#b${this.index} {
          background-color: var(--button-selected-background-color);
        }
        .action-div {
          background-color: ${getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-color') + '4F'}
        }
      </style>
      <nav id="sidebar">
        <div id="command-container">
          <icon-button
            style="width: 52px; height: 52px;"
            name="undo"
            title="étape précédente"
            @click="${this._clickHandler}"
          ></icon-button>
          <icon-button
            style="width: 52px; height: 52px;"
            name="stop"
            title="arrêter"
            @click="${this._clickHandler}"
          ></icon-button>
          <icon-button
            style="width: 52px; height: 52px;"
            name="${this.playPauseButton}"
            title="${this.playPauseButton}"
            @click="${this._clickHandler}"
          ></icon-button>
          <icon-button
            style="width: 52px; height: 52px;"
            name="redo"
            title="étape suivante"
            @click="${this._clickHandler}"
          ></icon-button>
        </div>
        <div id="action-container">
          ${this.tools.map((elem, idx) => {
            return html`
              <div
                name="action-div"
                class="action-div"
              >
                <h2>
                  ${elem.name}
                  (${(Math.floor(elem.time / 1000 / 60) > 0 ? Math.floor(elem.time / 1000 / 60) + 'm ' : '') + new Number(elem.time / 1000 % 60).toFixed(1) + 's'})
                </h2>
                ${
                  elem.actions.map((action, idx) => {
                    return html`
                      <button
                        id="b${action.actionIndex}"
                        @click="${this._clickHandler}"
                        name="action-button"
                        class="action-button"
                      >
                        ${idx + 1}
                        (${(Math.floor(action.time / 1000 / 60) > 0 ? Math.floor(action.time / 1000 / 60) + 'm ' : '') + new Number(action.time / 1000 % 60).toFixed(1) + 's'})
                      </button>
                    `;
                  })
                }
              </div>
            `;
          })}
        </div>
      </nav>
    `;
  }
}
customElements.define('fullhistory-tools', FullHistoryTools);
