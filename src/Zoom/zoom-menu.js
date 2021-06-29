import { app, setState } from '../Core/App';
import { LitElement, html, css } from 'lit-element';
import { Coordinates } from '../Core/Objects/Coordinates';

class ZoomMenu extends LitElement {
  constructor() {
    super();
    this.updateProperties = () => {
      this.zoomLevel = app.tool.zoomLevel;
    };
    this.updateProperties();
    this.zoomLevel = app.workspace.zoomLevel;

    this.eventHandler = e => {
      if (e.type == 'new-window') this.close();
      else if (app.tool?.name == 'zoom') this.updateProperties();
      else this.close();
    };
    this.close = () => {
      this.remove();
      window.removeEventListener('new-window', this.eventHandler);
      window.removeEventListener('tool-changed', this.eventHandler);
    };

    window.addEventListener('new-window', this.eventHandler);
    window.addEventListener('tool-changed', this.eventHandler);
  }

  static get properties() {
    return {
      zoomLevel: { type: Number },
      startPosition: { type: Number },
    };
  }

  static get styles() {
    return css`
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

        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -o-user-select: none;
        user-select: none;
      }
    `;
  }

  firstUpdated() {
    this.startPosition = this.getPositionFromZoom(app.workspace.zoomLevel);
  }

  render() {
    return html`
      <div class="container">
        <div style="float: left">${app.settings.minZoomLevel}</div>
        <div style="float: right">${app.settings.maxZoomLevel}</div>
        <div style="margin: 0 auto; width: 100px; text-align: center;">1</div>
        <input type="range" min="0" max="100" value="${this.startPosition}" class="slider" id="myRange" @input="${e => this.showResult(e.target.value)}" @change="${e => this.applyZoom(e.target.value)}">
        <div>Valeur : ${this.zoomLevel.toFixed(2)}</div>
      </div>
    `;
  }

  getZoomFromPosition(position) {
    // position will be between 0 and 100
    var minp = 0;
    var maxp = 100;

    // The result should be between 0.1 an 10
    var minv = Math.log10(app.settings.minZoomLevel);
    var maxv = Math.log10(app.settings.maxZoomLevel);

    // calculate adjustment factor
    var scale = (maxv - minv) / (maxp - minp);

    let zoomLevel = Math.pow(10, minv + scale * (position - minp));
    return zoomLevel;
  }

  getPositionFromZoom(zoomLevel) {
    // position will be between 0 and 100
    var minp = 0;
    var maxp = 100;

    // The result should be between 0.1 an 10
    var minv = Math.log10(app.settings.minZoomLevel);
    var maxv = Math.log10(app.settings.maxZoomLevel);

    // calculate adjustment factor
    var scale = (maxv - minv) / (maxp - minp);

    let pos = (Math.log10(zoomLevel) - minv) / scale + minp;
    return pos;
  }

  showResult(sliderPos) {
    let zoom = this.getZoomFromPosition(sliderPos);

    setState({
      tool: {
        ...app.tool,
        currentStep: 'zoom',
        zoomLevel: zoom,
      },
    });
  }

  applyZoom(sliderPos) {
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