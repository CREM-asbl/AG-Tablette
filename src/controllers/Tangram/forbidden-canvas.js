import { css, html, LitElement } from 'lit';

class ForbiddenCanvas extends LitElement {

  static properties = {
    left: { type: Number }
  };

  static styles = css`
      :host {
        background-color: rgba(255, 0, 0, 0.2);
        position: absolute;
        top: 0px;
        right: 0px;
        height: 100%;
        z-index: 100;
      }
    `
  render() {
    this.style.left = this.left ? `${this.left}px` : null;
    return html` <div></div> `;
  }
}
customElements.define('forbidden-canvas', ForbiddenCanvas);