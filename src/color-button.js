import { LitElement, html, css } from 'lit';
import { RGBFromColor, rgb2hex } from './Core/Tools/general';

class ColorButton extends LitElement {
  static get properties() {
    return {
      innerText: String,
      textColor: String,
      name: String,
    };
  }

  static get styles() {
    return css`
    `;
  }

  constructor() {
    super();
  }

  render() {
    return html`
      <style>
        :host {
          color: ${this.textColor};
        }
      </style>
      ${this.innerText}
    `;
  }

  firstUpdated() {
    let backgroundColor = rgb2hex(window.getComputedStyle(this, null).backgroundColor);
    if (!backgroundColor)
      backgroundColor = '#ffffff';
    let rgb = RGBFromColor(backgroundColor);
    if (rgb.red * 0.299 + rgb.green * 0.587 + rgb.blue * 0.114 > 140) {
      this.textColor = "#000000";
    } else {
      this.textColor = "#ffffff";
    }
  }
}
customElements.define('color-button', ColorButton);
