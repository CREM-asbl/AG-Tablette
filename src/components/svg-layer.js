import { LitElement, html } from 'lit';
import { app } from '@controllers/Core/App.js';

class SVGLayer extends LitElement {
  static properties = {
    paths: { type: Array },
    width: { type: Number },
    height: { type: Number },
  };

  constructor() {
    super();
    this.paths = [];
  }

  render() {
    if (!this.paths) return html``;
    const viewBox = `0 0 ${this.width || app.canvasWidth} ${this.height || app.canvasHeight}`;

    return html` <svg
      width="100%"
      height="100%"
      viewBox="${viewBox}"
      preserveAspectRatio="xMidYMid meet"
    >
      ${this.paths.map(
        (path) => html`
          <path d=${path} fill="red" stroke="white" stroke-width="1"></path>
        `,
      )}
    </svg>`;
  }

  firstUpdated() {
    app.svgLayer = this;
  }

  updated() {
    const svg = app.svgLayer.shadowRoot.querySelector('svg');
    // svg.querySelectorAll('path').forEach(p => p.remove())
    if (!this.paths) return;

    this.paths.forEach((path) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttributeNS(null, 'd', path);
      p.setAttributeNS(null, 'fill', 'blue');
      p.setAttributeNS(null, 'stroke', 'white');
      p.setAttributeNS(null, 'stroke-width', '2');
      svg.appendChild(p);
    });
  }

  handler() {}
}
customElements.define('svg-layer', SVGLayer);
