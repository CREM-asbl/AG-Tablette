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

      div {
        cursor: pointer;
        text-align: center;
      }
    `;

  constructor() {
    super()
    this.position = this.getPositionFromZoom(app.workspace.zoomLevel);
  }

  render() {
    changes.get()
    this.updateProperties();
    return html`
      <div class="container">
        <div style="float: left;"><span @click="${() => this.changePosition(this.position - 1)}">-</span></div>
        <div style="float: right;"><span @click="${() => this.changePosition(this.position + 1)}">+</span></div>
        <div style="margin: 0 auto; width: 100px;"><span @click="${() => this.changePosition(50)}">1</span></div>
        <input type="range" min="0" max="100" .value="${this.position}"
         id="myRange" @change="${e => this.showResult(e.target.value)}">
      </div>
    `;
  }

  updateProperties() {
    if (app.tool?.name != 'zoom') return this.close();
    this.zoomLevel = app.tool.zoomLevel;
  };

  close() {
    this.remove();
  };

  changePosition(position) {
    this.showResult(position);
  }

  getZoomFromPosition(position) {
    // position will be between 0 and 100
    let minp = 0;
    let maxp = 100;

    // The result should be between 0.1 an 10
    let minv = Math.log10(app.settings.minZoomLevel);
    let maxv = Math.log10(app.settings.maxZoomLevel);

    // calculate adjustment factor
    let scale = (maxv - minv) / (maxp - minp);

    let zoomLevel = Math.pow(10, minv + scale * (position - minp));
    return zoomLevel;
  }

  getPositionFromZoom(zoomLevel) {
    // position will be between 0 and 100
    let minp = 0;
    let maxp = 100;

    // The result should be between 0.1 an 10
    let minv = Math.log10(app.settings.minZoomLevel);
    let maxv = Math.log10(app.settings.maxZoomLevel);

    // calculate adjustment factor
    let scale = (maxv - minv) / (maxp - minp);

    let pos = (Math.log10(zoomLevel) - minv) / scale + minp;
    return pos;
  }

  showResult(sliderPos) {
    this.position = parseInt(sliderPos);
    let zoom = this.getZoomFromPosition(sliderPos);

    setState({
      tool: {
        ...app.tool,
        currentStep: 'execute',
        zoomLevel: zoom,
      },
    });
  }
}
customElements.define('zoom-menu', ZoomMenu);
