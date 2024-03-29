import { createElem } from '@controllers/Core/Tools/general';
import { css, html, LitElement } from 'lit';

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
        position: fixed;
        top: 10px;
        right: 10px;
        border-radius: 7px;
      }

      div {
        cursor: pointer;
        text-align: center;
        max-width: 200px;
        font-size: 1.5em;
        font-weight: bold;
        padding: 10px;
        margin: 0;
      }
      /*
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
      } */
    `;
  }

  constructor() {
    super();

    this.title = '';

    this.timeoutId = null;

    this.backgroundColor = document.documentElement.style.getPropertyValue(
      '--theme-color-soft',
    );
    this.fontColor = '#000000';

    window.addEventListener('show-notif', (e) => {
      this.show(e.detail.message, e.detail.showTime);
    });
  }

  render() {
    return html`<div @click="${() => this.showHelp()}">${this.title}</div> `;
  }

  show(message = this.title, showTime = 3) {
    window.clearTimeout(this.timeoutId);
    this.title = message;
    this.style.display = 'block';
    this.style.backgroundColor = this.backgroundColor;
    this.style.color = this.fontColor;
    this.showAnimation(-200);
    if (showTime) {
      this.timeoutId = window.setTimeout(() => this.close(), showTime * 1000);
    }
  }

  showAnimation(offset) {
    this.style.right = offset + 'px';
    if (offset >= 10) {
      this.style.right = '10px';
      return;
    }
    offset += 20;
    this.showAnimFrameId = window.requestAnimationFrame(() =>
      this.showAnimation(offset),
    );
  }

  close() {
    this.closeAnimation(256);
  }

  closeAnimation(opacity) {
    this.style.backgroundColor =
      this.backgroundColor + opacity.toString(16).padStart(2, '0');
    this.style.color = this.fontColor + opacity.toString(16);
    if (opacity <= 0) {
      this.style.display = 'none';
      return;
    }
    opacity -= 256 / 8;
    this.closeAnimFrameId = window.requestAnimationFrame(() =>
      this.closeAnimation(opacity),
    );
  }

  showHelp() {
    import('./help-popup');
    createElem('help-popup');
  }
}
customElements.define('notif-center', Notification);
