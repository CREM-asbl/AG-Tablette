import { css, html, LitElement } from 'lit';
import { app } from '../Core/App';

class ForbiddenCanvas extends LitElement {

  static styles = css`
      div {
        background-color: rgba(255, 0, 0, 0.2);
        position: absolute;
        top: 0px;
        right: 0px;
        width: ${app.canvasWidth / 2}px;
        height: 100%;
      }
    `

  render() {
    return html` <div></div> `;
  }
}
customElements.define('forbidden-canvas', ForbiddenCanvas);