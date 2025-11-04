import '@components/popups/template-popup';
import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';

class StateMenu extends LitElement {
  static properties = {
    check: { type: Boolean },
  };

  static styles = css`
    :host {
      text-align: center;
      padding: 8px;
      border-radius: 5px;
      background-color: var(--theme-color-soft);
    }

    button {
      font-size: 20px;
      border-radius: 4px;
      padding: 8px;
      background-color: #bbb;
      cursor: pointer;
    }
  `;

  render() {
    const text = this.check
      ? 'Annuler la vérification'
      : 'Vérifier la solution';
    return html`<button @click="${this.clickHandler}">${text}</button>`;
  }

  clickHandler() {
    if (!app.fullHistory.isRunning) {
      const value = this.check ? 'uncheck' : 'check';
      setState({ tangram: { ...app.tangram, currentStep: value } });
    }
  }

  close = () => {
    this.remove();
  };
}
customElements.define('state-menu', StateMenu);
