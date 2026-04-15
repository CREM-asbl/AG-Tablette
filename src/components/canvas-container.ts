import { SignalWatcher } from '@lit-labs/signals';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { app } from '../controllers/Core/App';
import { Coordinates } from '../controllers/Core/Objects/Coordinates';
import { appActions, currentEnvironment, resetWorkspaceState } from '../store/appState';
import './canvas-layer';

class CanvasContainer extends SignalWatcher(LitElement) {
  @property({ type: Object }) cursorPos = Coordinates.nullCoordinates;
  @property({ type: Number }) cursorSize = 20;
  @property({ type: Boolean }) cursorShow = false;
  @property({ type: Boolean }) helpFocused = false;
  @property({ type: String }) helpText = '';

  private timeoutId: number | undefined;
  private contextualGuideFocusListener: (event: CustomEvent) => void;

  private resizeHandler = () => {
    this.setCanvasSize();
  };
  private mouseCoordinatesHandler = (event: CustomEvent) => {
    app.workspace.lastKnownMouseCoordinates = new Coordinates(
      event.detail.mousePos,
    );
  };
  private mouseClickHandler = (event: CustomEvent) => {
    app.workspace.lastKnownMouseClickCoordinates = new Coordinates(
      event.detail.mousePos,
    );
    app.workspace.lastKnownMouseClickTime = event.timeStamp;
  };
  private showCursorHandler = () => {
    const mousePos = app.workspace.lastKnownMouseCoordinates;
    this.cursorPos = mousePos.toCanvasCoordinates();
    this.cursorPos = this.cursorPos.substract(
      new Coordinates({ x: this.cursorSize / 2, y: this.cursorSize / 2 }),
    );
    this.cursorShow = true;
    window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => (this.cursorShow = false), 100);
  };
  private newWindowHandler = () => {
    app.mainCanvasLayer.removeAllObjects();
    app.upperCanvasLayer.removeAllObjects();
    app.tangramCanvasLayer?.removeAllObjects();
    app.invisibleCanvasLayer?.removeAllObjects();
    resetWorkspaceState();
  };

  static styles = css`
    :host {
      display: block;
      position: relative;
      background-color: white;
      box-sizing: border-box;
    }

    :host(.help-highlight) {
      z-index: var(--z-ui-help-highlight);
      box-shadow:
        0 0 0 3px rgba(102, 126, 234, 0.6),
        0 0 0 38px rgba(102, 126, 234, 0.2);
      border-radius: 10px;
    }

    .help-popover {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.3;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      border: 2px solid rgba(255, 255, 255, 0.28);
      pointer-events: none;
      z-index: var(--z-ui-help-popover);
      white-space: nowrap;
      animation: helpPulse 1.5s ease-in-out infinite;
    }

    @keyframes helpPulse {
      0%,
      100% {
        transform: translateX(-50%) scale(1);
      }
      50% {
        transform: translateX(-50%) scale(1.05);
      }
    }

    #invisibleCanvas {
      opacity: 0;
    }
    svg-layer {
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0);
      box-sizing: border-box;
    }
  `;
  render() {
    if (this.helpFocused) {
      this.classList.add('help-highlight');
    } else {
      this.classList.remove('help-highlight');
    }

    const environment = currentEnvironment.get();

    return html`
      ${this.helpFocused && this.helpText
        ? html`<div class="help-popover">${this.helpText}</div>`
        : ''}

      <!-- for the paths -->
      <!-- <svg-layer id="svgLayer" .paths='\${this.paths}'></svg-layer> -->

      <!-- for background tasks (invisible canvas) -->
      <canvas-layer id="invisibleCanvas"></canvas-layer>

      <!-- for background image -->
      <canvas-layer id="backgroundCanvas"></canvas-layer>

      <!-- for grid points or tangram outline -->
      ${environment?.name !== 'Tangram'
        ? html`<canvas-layer id="gridCanvas"></canvas-layer>`
        : html`<canvas-layer
            id="tangramCanvas"
            style="left:50%"
          ></canvas-layer>`}

      <!-- for the shapes -->
      <canvas-layer id="mainCanvas"></canvas-layer>

      <!-- for the current event (ex: moving shape) -->
      <canvas-layer id="upperCanvas"></canvas-layer>

      <img
        src="/images/fake_cursor.png"
        height="${this.cursorSize}"
        width="${this.cursorSize}"
        style="margin-left: ${this.cursorPos
        .x}px; z-index: 50; position: relative; margin-top: ${this.cursorPos
          .y}px; display: ${this.cursorShow ? 'block' : 'none'}"
      />
    `;
  }

  firstUpdated() {
    this.setCanvasSize();
    window.addEventListener('resize', this.resizeHandler);

    appActions.setStarted(true);

    window.addEventListener(
      'mouse-coordinates-changed',
      this.mouseCoordinatesHandler,
    );
    window.addEventListener('mouse-click-changed', this.mouseClickHandler);
    window.addEventListener('show-cursor', this.showCursorHandler);
    window.addEventListener('new-window', this.newWindowHandler);

    this.contextualGuideFocusListener = (event: CustomEvent) => {
      const { active, target, text } = event.detail || {};
      const focused = !!active && target === 'canvas-container';
      this.helpFocused = focused;
      this.helpText = focused ? text || '' : '';
    };
    window.addEventListener(
      'contextual-guide-focus',
      this.contextualGuideFocusListener as EventListener,
    );
  }

  setCanvasSize() {
    app.canvasWidth = this.clientWidth;
    app.canvasHeight = this.clientHeight;
    const selectionDistance = Math.min(app.canvasWidth, app.canvasHeight) / 60;
    app.settings.selectionDistance = selectionDistance;
    app.settings.magnetismDistance = selectionDistance;
    appActions.updateSettings({
      selectionDistance,
      magnetismDistance: selectionDistance,
    });
    const layers = this.shadowRoot.querySelectorAll('canvas-layer');
    layers.forEach((layer) => layer.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener(
      'mouse-coordinates-changed',
      this.mouseCoordinatesHandler,
    );
    window.removeEventListener('mouse-click-changed', this.mouseClickHandler);
    window.removeEventListener('show-cursor', this.showCursorHandler);
    window.removeEventListener('new-window', this.newWindowHandler);
    window.removeEventListener(
      'contextual-guide-focus',
      this.contextualGuideFocusListener as EventListener,
    );
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
    }
  }

  // Ajout d'un fond d'écran fixé à droite
  set background(touch) {
    this.style.display = 'block';
    this.style.background = `url('${touch}') no-repeat right`;
  }
}
customElements.define('canvas-container', CanvasContainer);
