import '@components/icon-button';
import { css, html, LitElement } from 'lit';
import { TemplateToolbar } from '../components/template-toolbar';
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
    this.playPauseButton = 'play';
    let previousStepTimestamp = 0;
    this.tools = app.fullHistory.steps
      .filter((step) => (step.type == 'tool-changed') || step.type == 'undo' || step.type == 'redo')
      .map((step) => {
        let time = step.timeStamp - previousStepTimestamp;
        previousStepTimestamp = step.timeStamp;
        let name = step.detail.title;
        if (step.type == 'undo') {
          name = 'Annuler';
        } else if (step.type == 'redo') {
          name = 'Refaire';
        }
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
    this.index = 0;

    this.updateProperties = () => {
      this.iconSize = app.menuIconSize;
    };
    this.updateProperties();
    this.eventHandler = (e) => {
      if (app.fullHistory.isRunning) {
        if (e.type == 'fullHistory-changed') {
          this.index = app.fullHistory.actionIndex;
          this.shadowRoot.getElementById('b' + this.index)?.parentNode.parentNode.scrollIntoView();
          this.setPlayPause(app.fullHistory.isPlaying ? 'pause' : 'play');
        } else {
          this.updateProperties();
        }
      } else this.close();
    };
    this.close = () => {
      this.remove();
      window.removeEventListener('fullHistory-changed', this.eventHandler);
    };

    window.addEventListener('fullHistory-changed', this.eventHandler);
  }

  static get styles() {
    return [
      TemplateToolbar.templateToolbarStyles(),
      css`
        :host {
          display: none;
        }

        button {
          cursor: pointer;
        }

        nav#sidebar {
          display: flex;
          flex-direction: column;
          justify-content: start;
          z-index: 10;
          position: absolute;
          box-sizing: border-box;
          background-color: var(--theme-color);
          flex: 0 0 ${app.settings.mainMenuWidth}px;
          top: 0;
          width: ${app.settings.mainMenuWidth}px;
          height: 100dvh;
          scrollbar-width: thin;
        }

        template-toolbar {
          margin: 10px 10px 0px 10px;
          z-index: 15;
        }

        #action-container {
          overflow: visible;
          padding: 0px 10px 10px;

          /* scrollbar hidden */
          /* -ms-overflow-style: none; IE and Edge */
          /* scrollbar-width: none; Firefox */
          overflow-y: scroll;
          overflow-x: hidden;
        }

        .action-div {
          width: 100%;
          border-radius: 7px;
          overflow-y: hidden;
          box-shadow: 0px 0px 5px var(--menu-shadow-color);
          padding: 0px;
          margin: 5px 0px 0px;
          background-color: var(--theme-color-soft);
          font-size: 0;
        }

        h2 {
          text-align: center;
          font-size: 1.1rem;
          font-weight: bold;
          margin: 6px 0;
        }

        .single-action-div {
          background-color: white;
          width: calc((100% - 3 * 5px) / 2);
          height: 40px;
          border-radius: 3px;
          box-shadow: 0px 0px 5px var(--menu-shadow-color);
          border: none;
          padding: 0px;
          display: inline-flex;
        }

        .left-single-action-div {
          margin: 5px 2.5px 5px 5px;
        }

        .right-single-action-div {
          margin: 5px 5px 5px 2.5px;
        }

        .action-button {
          margin: 0px;
          padding: 0px;
          border: none;
          border-radius: 3px;

          width: calc(100% - 40px);
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
    ]
  }

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
        FullHistoryManager.moveTo(idx, true, true);
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
        <template-toolbar>
          <div slot="body">
            <icon-button
              style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
              name="undo"
              title="étape précédente"
              @click="${this._clickHandler}"
            ></icon-button>
            <icon-button
              style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
              name="stop"
              title="arrêter"
              @click="${this._clickHandler}"
            ></icon-button>
            <icon-button
              style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
              name="${this.playPauseButton}"
              title="${this.playPauseButton}"
              @click="${this._clickHandler}"
            ></icon-button>
            <icon-button
              style="width: ${this.iconSize}px; height: ${this.iconSize}px;"
              name="redo"
              title="étape suivante"
              @click="${this._clickHandler}"
            ></icon-button>
          </div>
        </template-toolbar>

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
                ${elem.actions.map((action, idx) => {
            return html`
                      <div
                        class="single-action-div ${idx % 2 ? 'right-single-action-div' : 'left-single-action-div'}"
                      >
                        <button
                          id="b${action.actionIndex}"
                          @click="${this._clickHandler}"
                          name="action-button"
                          class="action-button"
                        >
                          ${idx + 1}
                          (${(Math.floor(action.time / 1000 / 60) > 0 ? Math.floor(action.time / 1000 / 60) + 'm ' : '') + new Number(action.time / 1000 % 60).toFixed(1) + 's'})
                        </button>
                        <button
                          id="c${action.actionIndex}"
                          @click="${this._clickHandler}"
                          name="play-action-button"
                          class="play-action-button"
                        >
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
}
customElements.define('fullhistory-tools', FullHistoryTools);
