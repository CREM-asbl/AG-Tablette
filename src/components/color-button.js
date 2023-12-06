import { html, LitElement } from 'lit';

class ColorButton extends LitElement {
  static properties = {
    innerText: String,
    textColor: String
  }

  render() {
    return html`
      <style>
        :host {
          color: var(--text-color);
        }
      </style>
      ${this.innerText}
    `;
  }

  // firstUpdated() {
  //   let backgroundColor = rgb2hex(window.getComputedStyle(this, null).backgroundColor);
  //   if (!backgroundColor)
  //     backgroundColor = '#ffffff';
  //   let rgb = RGBFromColor(backgroundColor);
  //   if (rgb.red * 0.299 + rgb.green * 0.587 + rgb.blue * 0.114 > 140) {
  //     this.textColor = "#000000";
  //   } else {
  //     this.textColor = "#ffffff";
  //   }
  // }
}
customElements.define('color-button', ColorButton);
