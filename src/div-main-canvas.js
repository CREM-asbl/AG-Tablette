import { app } from './Core/App';
import { LitElement, html, css } from 'lit-element';
import { SelectManager } from './Core/Managers/SelectManager';
import { CompleteHistoryManager } from './Core/Managers/CompleteHistoryManager';
import { Point } from './Core/Objects/Point';

class DivMainCanvas extends LitElement {
  constructor() {
    super();

    // this.cursorPos = new Point(0, 0);
    // this.cursorSize = 20;
    // this.cursorShow = false;
  }
  static get properties() {
    return {
      background: String, // utile ?
      // cursorPos: Object,
      // cursorSize: Number,
      // cursorShow: Boolean,
      animCursorX: Number,
      animCursorY: Number,
    };
  }

  static get styles() {
    return css`
      canvas#upperCanvas,
      canvas#mainCanvas,
      canvas#debugCanvas,
      canvas#invisibleCanvas,
      canvas#backgroundCanvas {
        background-color: rgba(0, 0, 0, 0);
        position: absolute;
        top: 0px;
      }

      /* div.clickEffect {
        position: fixed;
        box-sizing: border-box;
        border-style: solid;
        border-color: #000000;
        border-radius: 50%;
        z-index: 99999;
        display: none;
      }

      div.runAnim {
        animation: clickEffect 0.4s ease-out;
      }

      @keyframes clickEffect {
        0% {
          opacity: 1;
          width: 0.5em;
          height: 0.5em;
          margin: -0.25em;
          border-width: 0.5em;
        }
        100% {
          opacity: 0.4;
          width: 3em;
          height: 3em;
          margin: -1.5em;
          border-width: 0.1em;
        }
      } */
    `;
  }

  render() {
    return html`
      <!-- for background tasks (invisible canvas) -->
      <canvas id="invisibleCanvas"></canvas>

      <!--for the grid, tangram outline and background-image -->
      <canvas id="backgroundCanvas"></canvas>

      <!-- for the shapes -->
      <canvas id="mainCanvas"></canvas>

      <!-- for the current event (ex: moving shape -->
      <canvas id="upperCanvas"></canvas>

      <!-- <div class="clickEffect" style="margin-left: \${this.animCursorX}px; margin-top:\${this.animCursorY};"></div> -->
    `;
  }

  /**
   * Défini les event-handlers du <canvas>
   */
  firstUpdated() {
    this.upperCanvas = this.shadowRoot.querySelector('#upperCanvas');
    this.mainCanvas = this.shadowRoot.querySelector('#mainCanvas');
    this.backgroundCanvas = this.shadowRoot.querySelector('#backgroundCanvas');
    this.invisibleCanvas = this.shadowRoot.querySelector('#invisibleCanvas');

    window.app = app;
    app.canvas = {
      upper: this.upperCanvas,
      main: this.mainCanvas,
      background: this.backgroundCanvas,
      invisible: this.invisibleCanvas,
    };
    app.upperCtx = this.upperCanvas.getContext('2d');
    app.mainCtx = this.mainCanvas.getContext('2d');
    app.backgroundCtx = this.backgroundCanvas.getContext('2d');
    app.invisibleCtx = this.invisibleCanvas.getContext('2d');

    app.start();
    window.addEventListener('setCanvasSize', () => this.setCanvasSize());
    window.dispatchEvent(new CustomEvent('setCanvasSize'));

    window.addEventListener('mouse-coordinates-changed', event => {
      app.workspace.lastKnownMouseCoordinates = new Point(
        event.detail.mousePos
      );
    });

    window.addEventListener('show-cursor', () => {
      let mousePos = app.workspace.lastKnownMouseCoordinates;
      this.cursorPos = mousePos.subCoordinates(
        new Point(this.cursorSize / 2, this.cursorSize / 2)
      );
      this.cursorPos.setToCanvasCoordinates();
      this.cursorShow = true;
      window.clearTimeout(this.timeoutId);
      this.timeoutId = window.setTimeout(() => (this.cursorShow = false), 100);
    });

    // window.addEventListener('click-cursor', event => {
    //   this.animCursorX = event.detail.mousePos.x;// + app.settings.get('mainMenuWidth');
    //   this.animCursorY = event.detail.mousePos.y;
    //   let elem = this.shadowRoot.querySelector('.clickEffect');
    //   elem.className = 'clickEffect runAnim';
    //   elem.style.display = 'inline';
    //   elem.addEventListener(
    //     'animationend',
    //     () => {
    //       elem.className = 'clickEffect';
    //       elem.style.display = 'none';
    //     },
    //     { once: true },
    //   );
    // });

    //Events:
    this.upperCanvas.addEventListener('click', event => {
      if (CompleteHistoryManager.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        })
      );
      if (
        app.listenerCounter.objectSelected &&
        'click' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      app.dispatchEv(new CustomEvent('canvasclick'));
    });

    this.upperCanvas.addEventListener('mousedown', event => {
      if (CompleteHistoryManager.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        })
      );
      if (
        app.listenerCounter.objectSelected &&
        'mousedown' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      app.dispatchEv(new CustomEvent('canvasmousedown'));
    });

    this.upperCanvas.addEventListener('mouseup', event => {
      if (CompleteHistoryManager.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        })
      );
      app.dispatchEv(new CustomEvent('canvasmouseup'));
    });

    this.upperCanvas.addEventListener('mousemove', event => {
      if (CompleteHistoryManager.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        })
      );
      app.dispatchEv(new CustomEvent('canvasmousemove'));
    });

    this.upperCanvas.addEventListener('mousewheel', event => {
      event.preventDefault();
      if (CompleteHistoryManager.isRunning) return;
      let mousePos = new Point(
        event.clientX - app.settings.get('mainMenuWidth'),
        event.clientY
      );
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        })
      );
      let detail = {
        deltaY: event.deltaY,
      };
      app.dispatchEv(new CustomEvent('canvasmousewheel', { detail: detail }));
    });

    this.upperCanvas.addEventListener('touchstart', event => {
      event.preventDefault();
      if (CompleteHistoryManager.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        })
      );
      if (
        app.listenerCounter.objectSelected &&
        'mousedown' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      let detail = {
        touches: [],
      };
      for (let touch of event.touches) {
        detail.touches.push(
          new Point(
            touch.clientX - app.settings.get('mainMenuWidth'),
            touch.clientY
          )
        );
      }
      app.dispatchEv(new CustomEvent('canvasmousedown'));
      app.dispatchEv(new CustomEvent('canvastouchstart', { detail: detail }));
    });

    this.upperCanvas.addEventListener('touchmove', event => {
      event.preventDefault();
      if (CompleteHistoryManager.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        })
      );
      let detail = {
        touches: [],
      };
      for (let touch of event.touches) {
        detail.touches.push(
          new Point(
            touch.clientX - app.settings.get('mainMenuWidth'),
            touch.clientY
          )
        );
      }
      app.dispatchEv(new CustomEvent('canvasmousemove'));
      app.dispatchEv(new CustomEvent('canvastouchmove', { detail: detail }));
    });

    this.upperCanvas.addEventListener('touchend', event => {
      event.preventDefault();
      if (CompleteHistoryManager.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        })
      );
      if (
        app.listenerCounter.objectSelected &&
        'click' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      let detail = {
        touches: [],
      };
      for (let touch of event.changedTouches) {
        detail.touches.push(
          new Point(
            touch.clientX - app.settings.get('mainMenuWidth'),
            touch.clientY
          )
        );
      }
      app.dispatchEv(new CustomEvent('canvasmouseup'));
      app.dispatchEv(new CustomEvent('canvasclick'));
      app.dispatchEv(new CustomEvent('canvastouchend', { detail: detail }));
    });

    this.upperCanvas.addEventListener('touchcancel', event => {
      event.preventDefault();
      if (CompleteHistoryManager.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        })
      );
      if (
        app.listenerCounter.objectSelected &&
        'click' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      let detail = {
        touches: [],
      };
      for (let touch of event.changedTouches) {
        detail.touches.push(
          new Point(
            touch.clientX - app.settings.get('mainMenuWidth'),
            touch.clientY
          )
        );
      }
      app.dispatchEv(new CustomEvent('canvasmouseup'));
      app.dispatchEv(new CustomEvent('canvasclick'));
      app.dispatchEv(new CustomEvent('canvastouchcancel', { detail: detail }));
    });
  }

  /**
   * Récupère les coordonnées de la souris à partir d'un événement javascript
   * @param event: référence vers l'événement (Event)
   * @return coordonnées de la souris (Point)
   * @Error: si les coordonnées n'ont pas été trouvées, une alerte (alert())
   *  est déclenchée et la fonction retourne null
   */
  getMousePos(event) {
    let response = new Point(0, 0);

    if (
      event.changedTouches &&
      event.changedTouches[0] &&
      event.changedTouches[0].clientX !== undefined
    ) {
      response.x =
        event.changedTouches[0].clientX - app.settings.get('mainMenuWidth');
      response.y = event.changedTouches[0].clientY;
    } else if (event.offsetX !== undefined) {
      response.x = event.offsetX;
      response.y = event.offsetY;
    } else if (event.layerX !== undefined) {
      response.x = event.layerX;
      response.y = event.layerY;
    } else if (event.clientX !== undefined) {
      response.x = event.clientX;
      response.y = event.clientY;
    } else if (event.pageX !== undefined) {
      response.x = event.pageX;
      response.y = event.pageY;
    } else if (event.x !== undefined) {
      response.x = event.x;
      response.y = event.y;
    } else {
      alert('navigator not compatible');
      //TODO: envoyer un rapport d'erreur...
      let str = event.type;
      for (let property1 in event) {
        str += ' | ' + property1 + ' : ' + event[property1];
      }
      console.error(str);

      if (event.touches) {
        str = 'touches: ' + event.touches.length + '';
        for (let property1 in event['touches'][0]) {
          str += ' | ' + property1 + ' : ' + ['touches'][0][property1];
        }
        console.error(str);
      }
      return null;
    }

    response.translate(app.workspace.translateOffset, true);
    response.multiplyWithScalar(1 / app.workspace.zoomLevel, true);
    return response;
  }

  /**
   * Défini les attributs width and height des 3 <canvas>.
   * Doit être appelé au démarrage et lorsque la page est redimensionnée.
   */
  setCanvasSize() {
    this.upperCanvas.setAttribute('height', this.clientHeight);
    this.mainCanvas.setAttribute('height', this.clientHeight);
    this.backgroundCanvas.setAttribute('height', this.clientHeight);
    this.invisibleCanvas.setAttribute('height', this.clientHeight);

    this.upperCanvas.setAttribute('width', this.clientWidth);
    this.mainCanvas.setAttribute('width', this.clientWidth);
    this.backgroundCanvas.setAttribute('width', this.clientWidth);
    this.invisibleCanvas.setAttribute('width', this.clientWidth);

    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refreshBackground'));

    app.canvasWidth = this.clientWidth;
    app.canvasHeight = this.clientHeight;
  }

  // Ajout d'un fond d'écran fixé à droite
  set background(touch) {
    this.style.display = 'block';
    this.style.background = `url('${touch}') no-repeat right`;
  }
}
customElements.define('div-main-canvas', DivMainCanvas);
