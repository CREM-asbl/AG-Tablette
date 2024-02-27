import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';

class StateMenu extends LitElement {

  static properties = {
    buttonValue: { type: String },
    buttonText: { type: String }
  }

  static styles = css`
      :host {
        position: absolute;
        top: 5px;
        padding: 10px;
        font-size: 20px;
        border-radius: 5px;
        border: 2px solid gray;
        background-color: rgba(0, 0, 0, 0.15);
        width: auto;
        max-width: calc(100% - 230px);
        overflow-y: auto;
        max-height: 30%;
        left: ${app.settings.mainMenuWidth + 5}px;
      }

      div#state-menu-buttons-list > button {
        font-size: 20px;
        border-radius: 5px;
        margin: 5px;
        padding: 4px;
        display: inline-block;
        background-color: #bbb;
        cursor: pointer;
      }
    `

  render() {
    return html`
      <div id="state-menu-buttons-list">
        <button @click="${() => this.clickHandler(this.buttonValue)}">
          ${this.buttonText}
        </button>
      </div>
    `;
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
