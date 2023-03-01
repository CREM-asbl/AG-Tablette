import { css, html, LitElement } from 'lit';
import './canvas-layer';
import { app, setState } from './Core/App';
import { Coordinates } from './Core/Objects/Coordinates';

class CanvasContainer extends LitElement {
  constructor() {
    super();

    this.cursorPos = Coordinates.nullCoordinates;
    this.cursorSize = 20;
    this.cursorShow = false;
  }

  static get properties() {
    return {
      background: String, // utile ?
      cursorPos: Object,
      cursorSize: Number,
      cursorShow: Boolean,
    };
  }

  static get styles() {
    return css`
    `;
  }

  render() {
    return html`
      <!-- for background tasks (invisible canvas) -->
      <canvas-layer id="invisibleCanvas"></canvas-layer>

      <!-- for background image -->
      <canvas-layer id="backgroundCanvas"></canvas-layer>

      <!-- for grid points or tangram outline -->
      ${app.environment.name !== 'Tangram' ? html`<canvas-layer id="gridCanvas"></canvas-layer>` : html`<canvas-layer id="tangramCanvas"></canvas-layer>`}

      <!-- for the shapes -->
      <canvas-layer id="mainCanvas"></canvas-layer>

      <!-- for the current event (ex: moving shape) -->
      <canvas-layer id="upperCanvas"></canvas-layer>

      <img
        src="/images/fake_cursor.png"
        height="${this.cursorSize}"
        width="${this.cursorSize}"
        style="margin-left: ${this.cursorPos.x}px; z-index: 50; position: relative; margin-top: ${
          this.cursorPos.y
        }px; display: ${this.cursorShow ? 'block' : 'none'}"
      >
      </img>
    `;
  }

  firstUpdated() {
    this.setCanvasSize();
    window.onresize = () => {
      this.setCanvasSize();
    };
    window.onorientationchange = () => {
      this.setCanvasSize();
    };
    window.addEventListener('workspace-changed', () => this.setCanvasSize());

    setState({ started: true });

    window.addEventListener('mouse-coordinates-changed', (event) => {
      app.workspace.lastKnownMouseCoordinates = new Coordinates(
        event.detail.mousePos,
      );
    });

    window.addEventListener('mouse-click-changed', (event) => {
      app.workspace.lastKnownMouseClickCoordinates = new Coordinates(
        event.detail.mousePos,
      );
      app.workspace.lastKnownMouseClickTime = event.timeStamp;
    });

    window.addEventListener('show-cursor', () => {
      let mousePos = app.workspace.lastKnownMouseCoordinates;
      this.cursorPos = mousePos.toCanvasCoordinates();
      this.cursorPos = this.cursorPos.substract(
        new Coordinates({ x: this.cursorSize / 2, y: this.cursorSize / 2 }),
      );
      this.cursorShow = true;
      window.clearTimeout(this.timeoutId);
      this.timeoutId = window.setTimeout(() => (this.cursorShow = false), 100);
    });
  }

  setCanvasSize() {
    app.canvasWidth = this.clientWidth;
    app.canvasHeight = this.clientHeight;

    window.dispatchEvent(new CustomEvent('resize-canvas'));

    setState({ settings: { ...app.settings, selectionDistance: Math.min(app.canvasWidth, app.canvasHeight) / 60, magnetismDistance: Math.min(app.canvasWidth, app.canvasHeight) / 60 } });
  }

  isOutsideOfCanvas(mousePos) {
    mousePos = mousePos.toCanvasCoordinates();
    if (mousePos.x < 0 || mousePos.y < 0) return true;
    else if (mousePos.x > app.canvasWidth || mousePos.y > app.canvasHeight)
      return true;
    else if (
      document.body.querySelector('forbidden-canvas') != null &&
      mousePos.x > app.canvasWidth / 2
    )
      return true;
    return false;
  }

  // Ajout d'un fond d'écran fixé à droite
  set background(touch) {
    this.style.display = 'block';
    this.style.background = `url('${touch}') no-repeat right`;
  }
}
customElements.define('canvas-container', CanvasContainer);
