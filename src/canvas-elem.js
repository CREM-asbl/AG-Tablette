import { css, html, LitElement } from 'lit';
import { app, setState } from './Core/App';
import { SelectManager } from './Core/Managers/SelectManager';
import { Coordinates } from './Core/Objects/Coordinates';
import { DrawingEnvironment } from './Core/Objects/DrawingEnvironment';
import { Shape } from './Core/Objects/Shapes/Shape';
import { RegularShape } from './Core/Objects/Shapes/RegularShape';
import { LineShape } from './Core/Objects/Shapes/LineShape';
import { SinglePointShape } from './Core/Objects/Shapes/SinglePointShape';
import { ArrowLineShape } from './Core/Objects/Shapes/ArrowLineShape';
import { Segment } from './Core/Objects/Segment';

class CanvasElem extends LitElement {
  constructor() {
    super();

    this.shapes = [];
    this.segments = [];
    this.points = [];
    this.texts = [];

    this.editingShapeIds = [];

    this.mustDrawShapes = true;
    this.mustDrawSegments = true;
    this.mustDrawPoints = true;
    this.mustDrawGrid = false;

    this.mustScaleShapes = true;
  }

  static get properties() {
    return {
    };
  }

  static get styles() {
    return css`
    `;
  }

  render() {
    if (this.id == 'backgroundCanvas') {
      return html`
        <style>
          canvas {
            border-top-right-radius: 10px;
            border-bottom-right-radius: 10px;
            background-color: #fff;
            position: absolute;
            top: 0px;
          }
        </style>
        <canvas></canvas>
      `
    }
    return html`
      <style>
        canvas {
          background-color: rgba(0, 0, 0, 0);
          position: absolute;
          width: 100%;
          top: 0px;
        }
      </style>
      <canvas></canvas>
    `;
  }

  removeAllObjects() {
    this.shapes = [];
    this.segments = [];
    this.points = [];
    this.texts = [];
    this.clear();
  }

  clear() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  redraw() {
    this.clear();
    this.texts.forEach((text) => text.updateMessage());

    // -> grid canvas
    // if (this.mustDrawGrid) GridManager.drawGridPoints();
    this.draw();
  }

  draw(scaling = 'scale') {
    if (this.mustDrawShapes) {
      this.shapes.forEach((s) => {
        if (this.editingShapeIds.findIndex((id) => s.id == id) == -1) {
          if (s.geometryObject?.geometryIsVisible === false || s.geometryObject?.geometryIsHidden === true)
            return;
          window.dispatchEvent(
            new CustomEvent('draw-shape', { detail: { shape: s, scaling } }),
          );
          if (this.mustDrawPoints && app.settings.areShapesPointed) {
            this.points.forEach((pt) => {
              if (pt.visible && pt.shapeId === s.id) {
                window.dispatchEvent(
                  new CustomEvent('draw-point', {
                    detail: { point: pt, color: pt.color },
                  }),
                );
              }
            });
          } else if (this.mustDrawPoints) {
            this.points.forEach((pt) => {
              if (
                pt.visible &&
                pt.shapeId === s.id &&
                (pt.type == 'shapeCenter' ||
                  pt.type == 'divisionPoint' ||
                  pt.shape.isCircle())
              ) {
                window.dispatchEvent(
                  new CustomEvent('draw-point', {
                    detail: { point: pt, color: pt.color },
                  }),
                );
              }
            });
          }
        }
      });
    }
    if (this.mustDrawPoints) {
      this.points.forEach((pt) => {
        if (pt.visible && pt.shapeId === undefined) {
          window.dispatchEvent(
            new CustomEvent('draw-point', {
              detail: { point: pt, color: pt.color },
            }),
          );
        }
      });
    }
    this.texts.forEach((text) => {
      window.dispatchEvent(
        new CustomEvent('draw-text', {
          detail: { text: text },
        }),
      );
    });
  }

  toSVG() {
    let svg_data = '';
    if (this.mustDrawShapes) {
      this.shapes.forEach((s) => {
        if (this.editingShapeIds.findIndex((id) => s.id == id) == -1) {
          svg_data += s.toSVG();
          if (this.mustDrawPoints && app.settings.areShapesPointed) {
            this.points.forEach((pt) => {
              if (pt.visible && pt.shapeId === s.id) {
                svg_data += pt.toSVG();
              }
            });
          }
        }
      });
    }
    if (this.mustDrawPoints) {
      this.points.forEach((pt) => {
        if (pt.visible && pt.shapeId === undefined) {
          svg_data += pt.toSVG();
        }
      });
    }
    return svg_data;
  }

  findObjectById(id, objectType = 'shape') {
    let object = this[objectType + 's'].find((obj) => obj.id == id);
    return object;
  }

  findObjectsByName(name, objectType = 'shape') {
    let objects = this[objectType + 's'].filter((obj) => obj.name == name);
    return objects;
  }

  findIndexById(id, objectType = 'shape') {
    let index = this[objectType + 's'].findIndex((obj) => obj.id == id);
    return index;
  }

  removeObjectById(id, objectType = 'shape') {
    let index = this.findIndexById(id, objectType);
    if (index != -1) {
      if (objectType == 'shape') {
        let object = this.findObjectById(id, objectType);
        object.segments.forEach((seg) =>
          this.removeObjectById(seg.id, 'segment'),
        );
        object.points.forEach((pt) => this.removeObjectById(pt.id, 'point'));
      }
      this[objectType + 's'].splice(index, 1);
    }
  }

  getCommonSegmentOfTwoPoints(pt1Id, pt2Id) {
    let pt1 = this.findObjectById(pt1Id, 'point');
    let pt2 = this.findObjectById(pt2Id, 'point');
    if (pt1.shape.name == 'PointOnLine' || pt2.shape.name == 'PointOnLine') {
      let segId;
      if (pt1.shape.name == 'PointOnLine')
        segId = pt1.shape.geometryObject.geometryParentObjectId1;
      else
        segId = pt2.shape.geometryObject.geometryParentObjectId1;
      return app.mainCanvasElem.findObjectById(segId, 'segment');
    }
    let segmentIds1 = pt1.segmentIds;
    let segmentIds2 = pt2.segmentIds;
    let commonSegmentIds = segmentIds1.filter(
      (id1) => segmentIds2.findIndex((id2) => id2 == id1) != -1,
    );
    let commonSegments = commonSegmentIds.map((id) =>
      this.segments.find((seg) => seg.id == id),
    );
    commonSegments.sort((seg1, seg2) => seg2.idx - seg1.idx);
    return commonSegments[0];
  }

  saveData() {
    let data = {
      shapesData: this.shapes.map((shape) => shape.saveData()),
      segmentsData: this.segments.map((segment) => segment.saveData()),
      pointsData: this.points.map((point) => point.saveData()),
    };
    return data;
  }

  loadFromData(data) {
    this.removeAllObjects();
    if (data != undefined) {
      data.shapesData.forEach((shapeData) => {
        if (shapeData.type == 'Shape')
          Shape.loadFromData(shapeData);
        else if (shapeData.type == 'RegularShape')
          RegularShape.loadFromData(shapeData);
        else if (shapeData.type == 'LineShape')
          LineShape.loadFromData(shapeData);
        else if (shapeData.type == 'SinglePointShape')
          SinglePointShape.loadFromData(shapeData);
        else if (shapeData.type == 'ArrowLineShape')
          ArrowLineShape.loadFromData(shapeData);
        else {
          shapeData.fillColor = shapeData.color;
          shapeData.fillOpacity = shapeData.opacity;
          shapeData.strokeColor = shapeData.borderColor;
          shapeData.strokeWidth = shapeData.borderSize;
          if (shapeData.segmentIds.length == 1) {
            LineShape.loadFromData(shapeData);
          } else {
            RegularShape.loadFromData(shapeData);
          }
        }
      });
      data.segmentsData.forEach((segmentData) =>
        Segment.loadFromData(segmentData),
      );
      data.pointsData.forEach((pointData) => Point.loadFromData(pointData));
      this.redraw();
    } else {
      console.info('nothing to see here');
    }
  }

  firstUpdated() {
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.canvasName = this.id.substring(0, this.id.lastIndexOf('C'));
    this.ctx = this.canvas.getContext('2d');

    app[this.canvasName + 'CanvasElem'] = this;

    this.setCanvasSize();
    window.addEventListener('resize-canvas', () => this.setCanvasSize());

    if (this.canvasName == 'upper') {
      this.createListeners();
    }
  }

  createListeners() {
    this.canvas.addEventListener('click', (event) => {
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

    this.canvas.addEventListener('mousedown', (event) => {
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
      this.pressTimeoutId = window.setTimeout(() => app.dispatchEv(new CustomEvent('canvasLongPress')), 1000);
      app.dispatchEv(new CustomEvent('canvasMouseDown'));
    });

    this.canvas.addEventListener('mouseup', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      window.clearTimeout(this.pressTimeoutId);
      app.dispatchEv(new CustomEvent('canvasMouseUp'));
    });

    this.canvas.addEventListener('mousemove', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      window.clearTimeout(this.pressTimeoutId);
      app.dispatchEv(new CustomEvent('canvasMouseMove'));
    });

    this.canvas.addEventListener('mouseout', (event) => {
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

    // this.canvas.addEventListener('mousewheel', (event) => {
    //   event.preventDefault();
    //   handleWheel(event);
    // });
    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      handleWheel(event);
    });


    this.canvas.addEventListener('touchstart', (event) => {
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

    this.canvas.addEventListener('touchmove', (event) => {
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

    this.canvas.addEventListener('touchend', (event) => {
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

    this.canvas.addEventListener('touchcancel', (event) => {
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

    this.canvas.addEventListener('touchcancel', (event) => {
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

  setCanvasSize() {
    this.canvas.setAttribute('width', app.canvasWidth);
    this.canvas.setAttribute('height', app.canvasHeight);
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

  // // Ajout d'un fond d'écran fixé à droite
  // set background(touch) {
  //   this.style.display = 'block';
  //   this.style.background = `url('${touch}') no-repeat right`;
  // }
}
customElements.define('canvas-elem', CanvasElem);
