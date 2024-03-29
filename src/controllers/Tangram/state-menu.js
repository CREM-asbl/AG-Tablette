import '@components/popups/template-popup';
import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';

class StateMenu extends LitElement {

  static properties = {
    buttonValue: { type: String },
    buttonText: { type: String }
  }

  static styles = css`
      :host {
        text-align: center;
        padding: 8px;
        border-radius: 5px;
        /* border: 2px solid gray; */
        /* background-color: rgba(0, 0, 0, 0.15); */
        background-color: var(--theme-color-soft);
      }

      button {
        font-size: 20px;
        border-radius: 4px;
        padding: 8px;
        background-color: #bbb;
        cursor: pointer;
      }
    `

  render() {
    return html`
        <button @click="${() => this.clickHandler(this.buttonValue)}">
          ${this.buttonText}
        </button>`
  }

  firstUpdated() {
    window.addEventListener('tangram-changed', this.updateProperties);
    window.addEventListener('new-window', this.close);
  }

  clickHandler(value) {
    if (!app.fullHistory.isRunning) {
      setState({ tangram: { ...app.tangram, currentStep: value } });
    }
  }

  updateProperties = () => {
    if (app.tangram?.buttonText == undefined)
      this.remove();
    this.buttonText = app.tangram.buttonText;
    this.buttonValue = app.tangram.buttonValue;
  };

  close = () => {
    this.remove();
    window.removeEventListener('tangram-changed', this.updateProperties);
    window.removeEventListener('new-window', this.close);
  };
}
customElements.define('state-menu', StateMenu);
