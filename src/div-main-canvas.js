import { app, setState } from './Core/App';
import { LitElement, html, css } from 'lit';
import { SelectManager } from './Core/Managers/SelectManager';
import { Coordinates } from './Core/Objects/Coordinates';
import { DrawingEnvironment } from './Core/Objects/DrawingEnvironment';

class DivMainCanvas extends LitElement {
  constructor() {
    super();

    this.shapes = [];
    this.segments = [];
    this.points = [];

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

      canvas#backgroundCanvas {
        border-radius: 10px;
        background-color: #fff;
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

      <img
        src="/images/fake_cursor.png"
        height="${this.cursorSize}"
        width="${this.cursorSize}"
        style="margin-left: ${this.cursorPos.x}px; z-index: 50; position: relative; margin-top: ${
      this.cursorPos.y
    }px; display: ${this.cursorShow ? 'block' : 'none'}"
      >
      </img>

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

    this.upperDrawingEnvironment = new DrawingEnvironment(this.upperCanvas, 'upper');
    app.upperDrawingEnvironment = this.upperDrawingEnvironment;
    this.mainDrawingEnvironment = new DrawingEnvironment(this.mainCanvas, 'main');
    app.mainDrawingEnvironment = this.mainDrawingEnvironment;
    this.backgroundDrawingEnvironment = new DrawingEnvironment(
      this.backgroundCanvas, 'background'
    );
    app.backgroundDrawingEnvironment = this.backgroundDrawingEnvironment;
    this.invisibleDrawingEnvironment = new DrawingEnvironment(
      this.invisibleCanvas, 'invisible'
    );
    app.invisibleDrawingEnvironment = this.invisibleDrawingEnvironment;

    this.setCanvasSize();
    window.onresize = () => {
      this.setCanvasSize();
    };
    window.onorientationchange = () => {
      this.setCanvasSize();
    };

    setState({ started: true });

    window.addEventListener('workspace-changed', () => this.setCanvasSize());

    window.addEventListener('mouse-coordinates-changed', (event) => {
      app.workspace.lastKnownMouseCoordinates = new Coordinates(
        event.detail.mousePos,
      );
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

    // window.addEventListener('click-cursor', event => {
    //   this.animCursorX = event.detail.mousePos.x;// + app.settings.mainMenuWidth;
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

    // Events
    this.upperCanvas.addEventListener('click', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      if (
        app.listenerCounter.objectSelected &&
        'click' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      app.dispatchEv(new CustomEvent('canvasClick'));
    });

    this.upperCanvas.addEventListener('mousedown', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      if (
        app.listenerCounter.objectSelected &&
        'mousedown' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      app.dispatchEv(new CustomEvent('canvasMouseDown'));
    });

    this.upperCanvas.addEventListener('mouseup', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      app.dispatchEv(new CustomEvent('canvasMouseUp'));
    });

    this.upperCanvas.addEventListener('mousemove', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      app.dispatchEv(new CustomEvent('canvasMouseMove'));
    });

    this.upperCanvas.addEventListener('mouseout', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      app.dispatchEv(new CustomEvent('canvasMouseUp'));
    });

    let handleWheel = (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = new Coordinates({
        x: event.clientX - app.settings.mainMenuWidth,
        y: event.clientY,
      });
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      let correctedDeltaY = event.deltaY;
      if (event.deltaY > 0) {
        correctedDeltaY = event.deltaY / 10 + 1;
      } else if (event.deltaY < 0) {
        correctedDeltaY = event.deltaY / 10 - 1;
      }
      let detail = {
        deltaY: correctedDeltaY,
      };
      app.dispatchEv(new CustomEvent('canvasMouseWheel', { detail: detail }));
    }

    // this.upperCanvas.addEventListener('mousewheel', (event) => {
    //   event.preventDefault();
    //   handleWheel(event);
    // });
    this.upperCanvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      handleWheel(event);
    });


    this.upperCanvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
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
          new Coordinates({
            x: touch.clientX - app.settings.mainMenuWidth,
            y: touch.clientY,
          }),
        );
      }
      app.dispatchEv(new CustomEvent('canvasMouseDown'));
      app.dispatchEv(new CustomEvent('canvasTouchStart', { detail: detail }));
    });

    this.upperCanvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      let detail = {
        touches: [],
      };
      for (let touch of event.touches) {
        detail.touches.push(
          new Coordinates({
            x: touch.clientX - app.settings.mainMenuWidth,
            y: touch.clientY,
          }),
        );
      }
      if (this.isOutsideOfCanvas(mousePos)) {
        app.dispatchEv(new CustomEvent('canvasMouseUp'));
        app.dispatchEv(new CustomEvent('canvasTouchEnd', { detail: detail }));
        return;
      }
      app.dispatchEv(new CustomEvent('canvasMouseMove'));
      app.dispatchEv(new CustomEvent('canvasTouchMove', { detail: detail }));
    });

    this.upperCanvas.addEventListener('touchend', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
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
          new Coordinates({
            x: touch.clientX - app.settings.mainMenuWidth,
            y: touch.clientY,
          }),
        );
      }
      app.dispatchEv(new CustomEvent('canvasMouseUp'));
      app.dispatchEv(new CustomEvent('canvasClick'));
      app.dispatchEv(new CustomEvent('canvasTouchEnd', { detail: detail }));
    });

    this.upperCanvas.addEventListener('touchcancel', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
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
          new Coordinates({
            x: touch.clientX - app.settings.mainMenuWidth,
            y: touch.clientY,
          }),
        );
      }
      app.dispatchEv(new CustomEvent('canvasMouseUp'));
      app.dispatchEv(new CustomEvent('canvasClick'));
      app.dispatchEv(new CustomEvent('canvastouchcancel', { detail: detail }));
    });

    this.upperCanvas.addEventListener('touchcancel', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
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
          new Coordinates({
            x: touch.clientX - app.settings.mainMenuWidth,
            y: touch.clientY,
          }),
        );
      }
      app.dispatchEv(new CustomEvent('canvasMouseUp'));
      app.dispatchEv(new CustomEvent('canvasClick'));
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
    let response = Coordinates.nullCoordinates;

    if (
      event.changedTouches &&
      event.changedTouches[0] &&
      event.changedTouches[0].clientX !== undefined
    ) {
      response.x = event.changedTouches[0].clientX - app.settings.mainMenuWidth;
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

    response = response.fromCanvasCoordinates();
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
customElements.define('div-main-canvas', DivMainCanvas);
