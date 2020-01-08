import { LitElement, html } from 'lit-element';
import { app } from './js/App';
import { DrawAPI } from './js/DrawAPI';
import { Point } from './js/Objects/Point';

class DivMainCanvas extends LitElement {
  static get properties() {
    return {
      background: String,
    };
  }

  render() {
    return html`
      <style>
        canvas#upperCanvas,
        canvas#mainCanvas,
        canvas#debugCanvas,
        canvas#invisibleCanvas,
        canvas#backgroundCanvas {
          background-color: rgba(0, 0, 0, 0);
          position: absolute;
          top: 0px;
        }
      </style>

      <!-- for background tasks (invisible canvas) -->
      <canvas id="invisibleCanvas"></canvas>

      <!--for the grid and background-image -->
      <canvas id="backgroundCanvas"></canvas>

      <!-- for the shapes -->
      <canvas id="mainCanvas"></canvas>

      <!-- for the current event (ex: moving shape -->
      <canvas id="upperCanvas"></canvas>
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
    let drawAPI = new DrawAPI(
      this.upperCanvas,
      this.mainCanvas,
      this.backgroundCanvas,
      this.invisibleCanvas,
    );
    app.drawAPI = drawAPI;

    this.setCanvasSize();
    // app.start(this);

    //Events:
    this.addEventListener('click', event => {
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(new CustomEvent('canvasclick', { detail: { mousePos: mousePos } }));
    });

    this.upperCanvas.addEventListener('mousedown', event => {
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(new CustomEvent('canvasmousedown', { detail: { mousePos: mousePos } }));
    });

    this.upperCanvas.addEventListener('mouseup', event => {
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(new CustomEvent('canvasmouseup', { detail: { mousePos: mousePos } }));
    });

    this.upperCanvas.addEventListener('mousemove', event => {
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(new CustomEvent('canvasmousemove', { detail: { mousePos: mousePos } }));
    });

    this.upperCanvas.addEventListener('touchstart', event => {
      window.dispatchEvent('mousedown', event);
    });

    this.upperCanvas.addEventListener('touchmove', event => {
      window.dispatchEvent('mousemove', event);
      // let mousePos = this.getMousePos(event);
      // window.dispatchEvent(new CustomEvent('touchmove', { detail: { mousePos: mousePos} }));
    });

    this.upperCanvas.addEventListener('touchend', event => {
      window.dispatchEvent('mouseup', event);
      window.dispatchEvent('click', event);
      // let mousePos = this.getMousePos(event);
      // window.dispatchEvent(new CustomEvent('touchend', { detail: { mousePos: mousePos} }));
    });

    this.upperCanvas.addEventListener('touchleave', event => {
      window.dispatchEvent('mouseup', event);
      window.dispatchEvent('click', event);
      // let mousePos = this.getMousePos(event);
      // window.dispatchEvent(new CustomEvent('touchleave', { detail: { mousePos: mousePos} }));
    });

    this.upperCanvas.addEventListener('touchcancel', event => {
      window.dispatchEvent('mouseup', event);
      window.dispatchEvent('click', event);
      // let mousePos = this.getMousePos(event);
      // window.dispatchEvent(new CustomEvent('touchcancel', { detail: { mousePos: mousePos} }));
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
      response.x = event.changedTouches[0].clientX - window.canvasLeftShift;
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

    (response.x -= app.workspace.translateOffset.x),
      (response.y -= app.workspace.translateOffset.y),
      (response.x /= app.workspace.zoomLevel);
    response.y /= app.workspace.zoomLevel;
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

    /*
      Lorsque le canvas est redimensionné, la translation et le zoom (scaling)
      sont réinitialisés, il faut donc les réappliquer.
    */
    app.drawAPI.resetTransformations();
    app.drawAPI.translateView(app.workspace.translateOffset);
    app.drawAPI.scaleView(app.workspace.zoomLevel);

    app.drawAPI.askRefresh('main');
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh('background');

    let leftShift = document
      .getElementsByTagName('ag-tablette-app')[0]
      .shadowRoot.getElementById('app-canvas-view-toolbar').clientWidth;
    window.canvasLeftShift = leftShift;
  }

  // Ajout d'un fond d'écran fixé à droite
  set background(value) {
    this.style.display = 'block';
    this.style.background = `url('${value}') no-repeat right`;
  }
}
customElements.define('div-main-canvas', DivMainCanvas);
