import { LitElement, html, css } from 'lit-element';
import { app } from '../js/App';

export class Notification extends LitElement {
  static get properties() {
    return {
      title: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: none;
        position: absolute;
        top: 10px;
        right: 10px;
      }

      h1 {
        text-align: right;
        max-width: 200px;
        font-size: 1.5em;
        padding: 15px;
        padding-right: 55px;
        margin: 0;
      }

      #notif-close {
        position: relative;
        font-size: 60px;
        float: right;
        cursor: pointer;
        color: #555;
        box-sizing: content-box;
        width: 15px;
        height: 15px;
        margin-top: 15px;
        margin-right: 35px;
        line-height: 40%;
      }
    `;
  }

  constructor() {
    super();

    this.title = '';

    this.timeoutId = null;

    addEventListener('show-notif', e => {
      this.show(e.detail.message, e.detail.showTime);
    });
  }

  render() {
    return html`
      <div class="background">
        <div id="template-view">
          <div id="notif-close" @click="${() => this.close()}">
            &times;
          </div>

          <h1>
            ${this.title}
          </h1>
        </div>
      </div>
    `;
  }

  show(message = this.title, showTime = 3) {
    window.clearTimeout(this.timeoutId);
    this.title = message;
    this.style.display = 'block';
    if (showTime) {
      this.timeoutId = window.setTimeout(() => this.close(), showTime * 1000);
    }
  }

  close() {
    this.style.display = 'none';
  }
}
customElements.define('notif-center', Notification);
