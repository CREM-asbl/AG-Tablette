import { SignalWatcher } from '@lit-labs/signals';
import { css, html, LitElement } from 'lit';
import { app, changes, setState } from '../Core/App';

class ZoomMenu extends SignalWatcher(LitElement) {
  static get properties() {
    return {
      zoomLevel: { type: Number },
      position: { type: Number },
    };
  }

  static styles = css`
    :host {
      display: grid;
      grid-template: auto / auto 1fr auto;
      justify-items: center;
      position: absolute;
      top: 5px;
      padding: 10px;
      font-size: 28px;
      border-radius: 5px;
      border: 2px solid gray;
      background-color: rgba(0, 0, 0, 0.15);
      width: auto;
      max-width: calc(100% - 230px);
      overflow-y: auto;
      max-height: 30%;
      left: ${app.settings.mainMenuWidth + 5}px;
    }

    div > * {
      cursor: pointer;
      text-align: center;
    }

    input,
    .info {
      grid-area: auto / span 3;
    }

    .info {
      cursor: initial;
      font-size: 0.8rem;
    }
  `;

  render() {
    changes.get();
    this.updateProperties();
    return html`
      <div>
        <span @click="${() => this.showResult(this.position - 1)}">-</span>
      </div>
      <div><span @click="${() => this.showResult(50)}">100%</span></div>
      <div>
        <span @click="${() => this.showResult(this.position + 1)}">+</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        .value="${this.position}"
        id="myRange"
        @change="${(e) => this.showResult(e.target.value)}"
        @input="${(e) => this.showResult(e.target.value, false)}"
        aria-label="Zoom"
      />
      <div class="info">Zoom: ${(this.zoomLevel * 100).toFixed(2)}%</div>
    `;
  }

  updateProperties() {
    this.zoomLevel = app.tool?.zoomLevel || app.workspace.zoomLevel;
    this.position = this.getPositionFromZoom(app.workspace.zoomLevel);
  }

  close() {
    this.remove();
  }

  getZoomFromPosition(position) {
    // position will be between 0 and 100
    const minp = 0;
    const maxp = 100;

    // The result should be between 0.1 an 10
    const minv = Math.log10(app.settings.minZoomLevel);
    const maxv = Math.log10(app.settings.maxZoomLevel);

    // calculate adjustment factor
    const scale = (maxv - minv) / (maxp - minp);

    const zoomLevel = Math.pow(10, minv + scale * (position - minp));
    return zoomLevel;
  }

  getPositionFromZoom(zoomLevel) {
    // position will be between 0 and 100
    const minp = 0;
    const maxp = 100;

    // The result should be between 0.1 an 10
    const minv = Math.log10(app.settings.minZoomLevel);
    const maxv = Math.log10(app.settings.maxZoomLevel);

    // calculate adjustment factor
    const scale = (maxv - minv) / (maxp - minp);

    const pos = (Math.log10(zoomLevel) - minv) / scale + minp;
    return pos;
  }

  showResult(sliderPos, applyZoom = true) {
    this.position = parseInt(sliderPos);
    const zoom = this.getZoomFromPosition(sliderPos);

    const step = applyZoom ? 'execute' : 'zoom';

    setState({
      tool: {
        ...app.tool,
        currentStep: step,
        zoomLevel: zoom,
      },
    });
  }
}
customElements.define('zoom-menu', ZoomMenu);
