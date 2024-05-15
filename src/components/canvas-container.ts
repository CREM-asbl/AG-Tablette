import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { app, setState } from '../controllers/Core/App';
import { Coordinates } from '../controllers/Core/Objects/Coordinates';
import './canvas-layer';
// import './svg-layer';

class CanvasContainer extends LitElement {
  @property({ type: Object }) cursorPos = Coordinates.nullCoordinates
  @property({ type: Number }) cursorSize = 20
  @property({ type: Boolean }) cursorShow = false
  @property({ type: Array }) paths = []

  static styles = css`
    :host {
      display: block;
      position: relative;
      background-color: white;
      box-sizing: border-box;
    }
    #invisibleCanvas {
      opacity: 0;
    }
    svg-layer {
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0 , 0);
      box-sizing: border-box;
    }
  `
  render() {
    return html`
      <!-- for the paths -->
      <!-- <svg-layer id="svgLayer" .paths='\${this.paths}'></svg-layer> -->

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
        style="margin-left: ${this.cursorPos.x}px; z-index: 50; position: relative; margin-top: ${this.cursorPos.y
      }px; display: ${this.cursorShow ? 'block' : 'none'}"
      />
    `
  }

  firstUpdated() {
    this.setCanvasSize();
    window.onresize = () => { this.setCanvasSize(); };

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
    setState({ settings: { ...app.settings, selectionDistance: Math.min(app.canvasWidth, app.canvasHeight) / 60, magnetismDistance: Math.min(app.canvasWidth, app.canvasHeight) / 60 } });
    const layers = this.shadowRoot.querySelectorAll('canvas-layer')
    layers.forEach(layer => layer.requestUpdate())
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
