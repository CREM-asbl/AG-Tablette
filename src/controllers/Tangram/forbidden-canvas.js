import { css, html, LitElement } from 'lit';
import { app } from '../Core/App';

class ForbiddenCanvas extends LitElement {

  static styles = css`
      canvas#unreachableCanvas {
        background-color: rgba(255, 0, 0, 0.2);
        position: absolute;
        top: 0px;
        right: 0px;
        width: ${app.canvasWidth / 2}px;
        height: 100%;
      }
    `

  firstUpdated() {
    this.unreachableCanvas = this.shadowRoot.querySelector(
      '#unreachableCanvas',
    );

    this.unreachableCanvas.setAttribute(
      'height',
      this.unreachableCanvas.clientHeight,
    );
    this.unreachableCanvas.setAttribute(
      'width',
      this.unreachableCanvas.clientWidth,
    );

    app.forbiddenCtx = this.unreachableCanvas.getContext('2d');

    window.dispatchEvent(new Event('forbidden-canvas-drawn'));
    window.addEventListener('close-forbidden-canvas', () => this.close(), {
      once: true,
    })
  }

  render() {
    return html` <canvas id="unreachableCanvas"></canvas> `;
  }

  close() {
    this.remove();
  }
}
customElements.define('forbidden-canvas', ForbiddenCanvas);
