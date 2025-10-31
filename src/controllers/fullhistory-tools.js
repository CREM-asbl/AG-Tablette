import '@components/icon-button';
import '@components/template-toolbar';
import { SignalWatcher } from '@lit-labs/signals';
import { css, html, LitElement } from 'lit';
import { app, changes } from './Core/App';
import { FullHistoryManager } from './Core/Managers/FullHistoryManager';

const formatTime = (milliseconds) => {
  const minutes = Math.floor(milliseconds / 1000 / 60);
  const seconds = (milliseconds / 1000 % 60).toFixed(1);
  return (minutes > 0 ? minutes + 'm ' : '') + seconds + 's';
}

class FullHistoryTools extends SignalWatcher(LitElement) {

  static properties = {
    tools: Array,
    index: Number,
    playPauseButton: String
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
          padding: 12px;
          box-sizing: border-box;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        nav#sidebar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
          box-sizing: border-box;
        }

        #action-container {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding-right: 4px;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          box-sizing: border-box;
          flex-grow: 1;
        }

        .timeline {
          position: relative;
          margin-left: 18px;
          border-left: 2px solid rgba(255, 255, 255, 0.5);
          padding-left: 16px;
        }

        .tool-marker {
          position: relative;
          margin-bottom: 8px;
          padding-bottom: 8px;
        }

        .tool-marker:before {
          content: "";
          position: absolute;
          left: -25px;
          top: 5px;
          width: 12px;
          height: 12px;
          background-color: white;
          border: 2px solid white;
          border-radius: 50%;
          z-index: 1;
          box-shadow: 0 0 0 2px var(--theme-color);
        }

        .tool-marker.past:before {
          background-color: #2e8b57; /* SeaGreen - cohérent avec les actions passées */
          border-color: #2e8b57;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
        }

        .tool-marker.active:before {
          background-color: var(--theme-color);
          border-color: white;
          box-shadow: 0 0 0 2px var(--theme-color), 0 0 8px rgba(255, 255, 255, 0.5);
        }

        .tool-marker.future:before {
          background-color: #888;
          border-color: #888;
          opacity: 0.7;
        }

        .tool-marker:last-child {
          margin-bottom: 24px;
        }

        .tool-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--theme-color-soft);
          padding: 6px 10px;
          border-radius: 8px 8px 0 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }

        .tool-name {
          font-weight: 700;
          font-size: 0.9rem;
          margin: 0;
          color: white;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          letter-spacing: 0.01em;
        }

        .tool-time {
          font-size: 0.75rem;
          color: white;
          background-color: rgba(0, 0, 0, 0.4);
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .tool-actions {
          background-color: white;
          border-radius: 0 0 8px 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          transition: background-color 0.2s, opacity 0.2s;
          position: relative;
        }

        .action-item:last-child {
          border-bottom: none;
        }

        .action-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .action-item.active {
          background-color: rgba(var(--theme-color-rgb), 0.15);
        }

        .action-item.past {
          background-color: rgba(0, 200, 0, 0.05);
        }

        .action-item.past .action-index {
          background-color: #2e8b57; /* SeaGreen */
        }

        .action-item.future {
          background-color: rgba(0, 0, 0, 0.03);
          opacity: 0.7;
        }

        .action-item.future .action-index {
          background-color: #888;
        }

        .action-button {
          display: flex;
          align-items: center;
          width: 100%;
          text-align: left;
          padding: 8px 10px;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          color: #222;
          font-size: 0.85rem;
        }

        .action-index {
          background-color: var(--theme-color);
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
          font-size: 0.7rem;
          font-weight: bold;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .action-time {
          margin-left: auto;
          font-size: 0.75rem;
          color: #555;
          background-color: rgba(0, 0, 0, 0.05);
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 500;
        }

        .play-action-button {
          background: center / 60% no-repeat url("/images/replay.svg");
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border: none;
          background-color: transparent;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .play-action-button:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .controls {
          display: flex;
          flex-direction: column;
          background: var(--theme-color-soft);
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .progress-label {
          font-size: 0.9rem;
          color: white;
          margin: 0 0 8px 0;
          font-weight: 600;
          text-align: center;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          letter-spacing: 0.01em;
        }

        .progress-bar {
          position: relative;
          width: 100%;
          height: 8px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 2px;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .progress-filled {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background-color: white;
          border-radius: 4px;
          transition: width 0.3s ease;
          box-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        .current-marker {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: white;
          left: -22px;
          top: 10px;
          z-index: 2;
          box-shadow: 0 0 0 2px var(--theme-color), 0 0 4px rgba(0, 0, 0, 0.5);
          animation: pulse 2s infinite;
        }
  `

  constructor() {
    super();
    this.playPauseButton = 'play';
    let previousStepTimestamp = 0;
    this.tools = app.fullHistory.steps
      .filter((step) => (step.type == 'tool-changed') || step.type == 'undo' || step.type == 'redo')
      .map((step) => {
        const time = step.timeStamp - previousStepTimestamp;
        previousStepTimestamp = step.timeStamp;
        let name = step.detail.title;
        if (step.type == 'undo') name = 'Annuler';
        if (step.type == 'redo') name = 'Refaire';
        
        return { name, time, timeStamp: step.timeStamp, actions: [] };
      });
    let toolIndex = -1;
    let actionIndex = 1;
    app.fullHistory.steps
      .filter((step) => step.type == 'add-fullstep')
      .forEach((step) => {
        const timeStamp = step.timeStamp;
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
    changes.get()
    this.updateProperties();

    // Calcul du nombre total d'actions pour la barre de progression
    const totalActions = app.fullHistory.numberOfActions || 1;
    const currentProgress = (this.index / totalActions) * 100;

    // Récupération de la couleur du thème pour les styles dynamiques
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();

    return html`
      <style>
        button#b${this.index} {
          background-color: rgba(0, 0, 0, 0.05);
        }
        .action-item.active {
          background-color: ${themeColor}22; /* Opacité ~13% pour assurer un bon contraste */
        }

        /* Colorisation de la timeline elle-même pour indiquer la progression */
        .timeline::before {
          content: '';
          position: absolute;
          left: -2px;
          top: 0;
          width: 2px;
          height: ${currentProgress}%;
          background-color: #2e8b57; /* SeaGreen - même couleur que les actions passées */
          z-index: 2;
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

        <div class="controls">
          <span class="progress-label">Progression: ${this.index}/${totalActions}</span>
          <div class="progress-bar">
            <div class="progress-filled" style="width: ${currentProgress}%"></div>
          </div>
        </div>

        <div id="action-container">
          <div class="timeline">
            ${this.tools.map((tool, toolIdx) => {
      // Déterminer l'état du marqueur d'outil
      const hasActiveAction = tool.actions.some(action => action.actionIndex === this.index);
      const isToolPast = tool.actions.length > 0 &&
        tool.actions[tool.actions.length - 1].actionIndex < this.index;
      const isToolFuture = tool.actions.length > 0 &&
        tool.actions[0].actionIndex > this.index;
      const toolStateClass = hasActiveAction ? 'active' :
        isToolPast ? 'past' :
          isToolFuture ? 'future' : '';

      return html`
              <div class="tool-marker ${toolStateClass}">
                <div class="tool-header">
                  <h3 class="tool-name">${tool.name}</h3>
                  <span class="tool-time">${formatTime(tool.time)}</span>
                </div>
                <div class="tool-actions">
                  ${tool.actions.map((action, actionIdx) => {
        const isActive = action.actionIndex === this.index;
        const isPast = action.actionIndex < this.index;
        const isFuture = action.actionIndex > this.index;
        return html`
                      <div class="action-item ${isActive ? 'active' : isPast ? 'past' : isFuture ? 'future' : ''}">
                        ${isActive ? html`<div class="current-marker"></div>` : ''}
                        <button
                          id="b${action.actionIndex}"
                          @click="${this._clickHandler}"
                          name="action-button"
                          class="action-button">
                          <span class="action-index">${actionIdx + 1}</span>
                          <span class="action-time">${formatTime(action.time)}</span>
                        </button>
                        <button id="c${action.actionIndex}"
                                @click="${this._clickHandler}"
                                name="play-action-button"
                                class="play-action-button">
                        </button>
                      </div>
                    `;
      })}
                </div>
              </div>
            `;
    })}
          </div>
        </div>
      </nav>
    `;
  }

  updateProperties() {
    if (!app.fullHistory.isRunning) {
      this.close()
      return
    }
    if (app.fullHistory.index != this.index) {
      this.index = app.fullHistory.actionIndex;
      this.shadowRoot.getElementById('b' + this.index)?.parentNode.scrollIntoView();
      this.playPauseButton = app.fullHistory.isPlaying ? 'pause' : 'play';
    }
  };

  _clickHandler(event) {
    const index = parseInt(this.index);
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

  close() {
    this.remove();
  };
}
customElements.define('fullhistory-tools', FullHistoryTools);