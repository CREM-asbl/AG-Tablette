import '@components/popups/template-popup';
import { css, html, LitElement } from 'lit';
import { appActions } from '../../store/appState';
import { app } from '../Core/App';

class StateMenu extends LitElement {
  static properties = {
    check: { type: Boolean },
    level: { type: Number },
  };

  constructor() {
    super();
    this.level = 1;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      border-radius: 4px;
      background-color: var(--theme-color-soft);
    }

    button {
      display: block;
      width: 100%;
      padding: 8px;
      font-size: 20px;
      color: var(--text-color);
      border: none;
      border-radius: 3px;
      background-color: var(--theme-color);
      box-shadow: 0 1px 3px var(--menu-shadow-color);
      cursor: pointer;
      transition:
        opacity 0.15s ease-out,
        box-shadow 0.15s ease-out;
    }

    button:hover {
      opacity: 0.8;
      box-shadow: 0 2px 5px var(--menu-shadow-color);
    }

    button:focus-visible {
      outline: 2px solid var(--theme-color-soft);
      outline-offset: 2px;
    }
  `;

  render() {
    const text = this.check
      ? 'Annuler la vérification'
      : 'Vérifier la solution';
    return html`
      <button @click="${this.clickHandler}">${text}</button>
      <button @click="${this.levelHandler}">Niveau : ${this.level}</button>
      <button @click="${this.restartHandler}">Recommencer</button>
    `;
  }

  clickHandler() {
    if (!app.fullHistory.isRunning) {
      const value = this.check ? 'uncheck' : 'check';
      appActions.setTangramState({ currentStep: value });
    }
  }

  levelHandler() {
    if (!app.fullHistory.isRunning) {
      window.dispatchEvent(new CustomEvent('tangram:level-menu-clicked'));
    }
  }

  restartHandler() {
    if (!app.fullHistory.isRunning) {
      window.dispatchEvent(new CustomEvent('tangram:restart-menu-clicked'));
    }
  }

  close = () => {
    this.remove();
  };
}
customElements.define('state-menu', StateMenu);
