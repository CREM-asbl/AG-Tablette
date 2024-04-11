import '@components/icon-button';
import '@components/template-toolbar';
import { css, html, LitElement } from 'lit';
import { app } from './Core/App';
import { FullHistoryManager } from './Core/Managers/FullHistoryManager';

class FullHistoryTools extends LitElement {

  static properties = {
    tools: Array,
    index: Number,
    playPauseButton: String,
  }

  static styles = css`
        :host {
          display: none;
          position: absolute;
          top: 0;
          z-index: 10;
          background-color: var(--theme-color);
          width: ${app.settings.mainMenuWidth}px;
          height: 100dvh;
          padding: 8px;
          box-sizing: border-box;
        }


        nav#sidebar {
          display: grid;
          grid-auto-flow: column;
          justify-content: start;
          gap: 8px;
          grid-template-rows: auto 1fr;
          justify-content: center;
          box-sizing: border-box;
          height: 100%;
        }

        #action-container {
          display: grid;
          place-content: start;
          gap: 8px;
          padding-right: 4px;
          overflow: visible;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          box-sizing: border-box;
        }

        .action-div {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          border-radius: 4px;
          gap: 8px 4px;
          padding: 8px;
          background-color: var(--theme-color-soft);
          box-sizing: border-box;
        }

        h2 {
          grid-area: auto / span 2;
          text-align: center;
          font-size: 1.1rem;
          font-weight: bold;
          margin: 0;
        }

        .single-action-div {
          display: grid;
          grid-template-columns: 1fr 40px;
          background-color: white;
          height: 40px;
          border-radius: 3px;
          box-shadow: 0px 0px 5px var(--menu-shadow-color);
          border: none;
          padding: 0px;
        }

        button {
          cursor: pointer;
          background-color: #fff;
        }
        .action-button {
          border: none;
        }

        .play-action-button {
          margin: 2.5px 2.5px 2.5px 2.5px;
          padding: 0px;
          height: 35px;
          width: 35px;
          background: center / contain no-repeat url("images/replay.svg");
          box-shadow: 0px 0px 3px var(--menu-shadow-color);
          border: none;
        }
  `

  constructor() {
    super();
    this.playPauseButton = 'play';
    let previousStepTimestamp = 0;
    this.tools = app.fullHistory.steps
      .filter((step) => (step.type == 'tool-changed') || step.type == 'undo' || step.type == 'redo')
      .map((step) => {
        let time = step.timeStamp - previousStepTimestamp;
        previousStepTimestamp = step.timeStamp;
        let name = step.detail.title;
        if (step.type == 'undo') name = 'Annuler';
        if (step.type == 'redo') name = 'Refaire';
        if (!name) console.log(step)
        return { name, time, timeStamp: step.timeStamp, actions: [] };
      });
    let toolIndex = -1;
    let actionIndex = 1;
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
    this.index = 0
  }

  render() {
    return html`
      <style>
        button#b${this.index} {
          background-color: var(--button-selected-background-color);
        }
        .action-div {
          background-color: ${getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-color') + '4F'}
        }
      </style>
      <nav id="sidebar">
        <template-toolbar>
          <div slot="body">
            <icon-button name="undo"
                         title="étape précédente"
                         @click="${this._clickHandler}">
            </icon-button>
            <icon-button name="stop"
                         title="arrêter"
                         @click="${this._clickHandler}">
            </icon-button>
            <icon-button name="${this.playPauseButton}"
                          title="${this.playPauseButton}"
                          @click="${this._clickHandler}">
            </icon-button>
            <icon-button name="redo"
                         title="étape suivante"
                         @click="${this._clickHandler}">
            </icon-button>
          </div>
        </template-toolbar>

        <div id="action-container">
          ${this.tools.map((elem, idx) => {
          return html`
              <div name="action-div" class="action-div">
                <h2>
                  ${elem.name}
                  (${(Math.floor(elem.time / 1000 / 60) > 0 ? Math.floor(elem.time / 1000 / 60) + 'm ' : '') + new Number(elem.time / 1000 % 60).toFixed(1) + 's'})
                </h2>
                ${elem.actions.map((action, idx) => {
            return html`
                      <div class="single-action-div">
                        <button
                          id="b${action.actionIndex}"
                          @click="${this._clickHandler}"
                          name="action-button"
                          class="action-button">
                          ${idx + 1}
                          (${(Math.floor(action.time / 1000 / 60) > 0 ? Math.floor(action.time / 1000 / 60) + 'm ' : '') + new Number(action.time / 1000 % 60).toFixed(1) + 's'})
                        </button>
                        <button id="c${action.actionIndex}"
                                @click="${this._clickHandler}"
                                name="play-action-button"
                                class="play-action-button">
                        </button>
                      </div>
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

  firstUpdated() {
    window.addEventListener('fullHistory-changed', this.eventHandler.bind(this));
  }

  eventHandler(e) {
    if (app.fullHistory.isRunning && e.type == 'fullHistory-changed') {
      this.index = app.fullHistory.actionIndex;
      this.shadowRoot.getElementById('b' + this.index)?.parentNode.parentNode.scrollIntoView();
      this.setPlayPause(app.fullHistory.isPlaying ? 'pause' : 'play');
    } else this.close();
  };

  _clickHandler(event) {
    let index = parseInt(this.index);
    let idx;
    switch (event.target.name) {
      case 'action-button':
        idx = parseInt(event.target.id.substring(1));
        FullHistoryManager.moveTo(idx);
        break;
      case 'play-action-button':
        idx = parseInt(event.target.id.substring(1));
        FullHistoryManager.moveTo(idx, true);
        FullHistoryManager.playBrowsing(true);
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
        break;
      case 'play':
        FullHistoryManager.playBrowsing();
        break;
      case 'redo':
        if (index >= app.fullHistory.numberOfActions) {
          break;
        }
        FullHistoryManager.moveTo(index + 1);
        break;
    }
  }

  setPlayPause(state) {
    this.playPauseButton = state;
  }

  close() {
    this.remove();
    window.removeEventListener('fullHistory-changed', this.eventHandler);
  };
}
customElements.define('fullhistory-tools', FullHistoryTools);
