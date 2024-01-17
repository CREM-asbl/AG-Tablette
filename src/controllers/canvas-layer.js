import { html, LitElement } from 'lit';
import { app, setState } from './Core/App';
import { SelectManager } from './Core/Managers/SelectManager';
import { Coordinates } from './Core/Objects/Coordinates';
import { Point } from './Core/Objects/Point';
import { Segment } from './Core/Objects/Segment';
import { ArrowLineShape } from './Core/Objects/Shapes/ArrowLineShape';
import { CubeShape } from './Core/Objects/Shapes/CubeShape';
import { LineShape } from './Core/Objects/Shapes/LineShape';
import { RegularShape } from './Core/Objects/Shapes/RegularShape';
import { Shape } from './Core/Objects/Shapes/Shape';
import { SinglePointShape } from './Core/Objects/Shapes/SinglePointShape';
import { StripLineShape } from './Core/Objects/Shapes/StripLineShape';
import { capitalizeFirstLetter, createElem, findObjectById } from './Core/Tools/general';

class CanvasLayer extends LitElement {
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

    if (this.canvasName == 'upper')
      window.dispatchEvent(new CustomEvent('refreshStateUpper'));
    else if (this.canvasName == 'grid') {
      this.removeAllObjects();
      if (app.settings.gridShown) this.drawGridPoints();
    }

    this.draw();
  }

  draw(scaling = 'scale') {
    if (this.mustDrawShapes) {
      this.shapes.forEach((s) => {
        if (this.editingShapeIds.findIndex((id) => s.id == id) == -1) {
          if (s.geometryObject &&
            (
              s.geometryObject.geometryIsVisible === false ||
              s.geometryObject.geometryIsHidden === true ||
              s.geometryObject.geometryIsConstaintDraw === true
            )
          )
            return;
          this.drawShape(s, scaling);
          if (this.mustDrawPoints) {
            if (app.environment.name == 'Geometrie') {
              this.drawGeometryShapePoint(s);
            } else {
              this.drawShapePoint(s);
            }
          }
        }
      });
    }
    if (this.mustDrawPoints) {
      this.points.forEach((pt) => {
        if (pt.visible && pt.shapeId === undefined) {
          this.drawPoint(pt);
        }
      });
    }
    this.texts.forEach((text) => {
      this.drawText(text);
    });
  }

  drawGeometryShapePoint(shape) {
    if (app.settings.areShapesPointed) {
      shape.points.forEach((pt) => {
        if (pt.visible) {
          this.drawPoint(pt);
        }
      });
    } else if (shape instanceof SinglePointShape) {
      if (!shape.geometryObject.geometryPointOnTheFlyChildId) {
        this.drawPoint(shape.points[0]);
      }
    } else {
      shape.points.forEach((pt) => {
        if (
          pt.visible &&
          (
            pt.type == 'shapeCenter' ||
            pt.type == 'divisionPoint'// ||
            // pt.shape.isCircle()
          )
        ) {
          this.drawPoint(pt);
        }
      });
    }
  }

  drawShapePoint(shape) {
    if (app.settings.areShapesPointed) {
      shape.points.forEach((pt) => {
        if (pt.visible) {
          this.drawPoint(pt);
        }
      });
    } else {
      shape.points.forEach((pt) => {
        if (
          pt.visible &&
          (pt.type == 'shapeCenter' ||
            pt.type == 'divisionPoint' ||
            pt.shape.isCircle())
        ) {
          this.drawPoint(pt);
        }
      });
    }
  }

  toSVG() {
    let svg_data = '';
    if (this.mustDrawShapes) {
      this.shapes.forEach((s) => {
        if (this.editingShapeIds.findIndex((id) => s.id == id) == -1) {
          if (s.geometryObject &&
            (
              s.geometryObject.geometryIsVisible === false ||
              s.geometryObject.geometryIsHidden === true ||
              s.geometryObject.geometryIsConstaintDraw === true
            )
          ) {
            return;
          }
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

  getCommonSegmentOfTwoPoints(pt1Id, pt2Id) {
    let pt1 = findObjectById(pt1Id);
    let pt2 = findObjectById(pt2Id);
    if (pt1.shape.name == 'PointOnLine' || pt2.shape.name == 'PointOnLine') {
      let segId;
      if (pt1.shape.name == 'PointOnLine')
        segId = pt1.shape.geometryObject.geometryParentObjectId1;
      else
        segId = pt2.shape.geometryObject.geometryParentObjectId1;
      return findObjectById(segId);
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
        if (isFinite(shapeData.indexOfReference)) {
          shapeData = app.history.steps[shapeData.indexOfReference].objects.shapesData.find(s => s.id == shapeData.id);
        }
        if (shapeData.type == 'Shape')
          Shape.loadFromData(shapeData);
        else if (shapeData.type == 'RegularShape')
          RegularShape.loadFromData(shapeData);
        else if (shapeData.type == 'CubeShape')
          CubeShape.loadFromData(shapeData);
        else if (shapeData.type == 'LineShape')
          LineShape.loadFromData(shapeData);
        else if (shapeData.type == 'SinglePointShape')
          SinglePointShape.loadFromData(shapeData);
        else if (shapeData.type == 'ArrowLineShape')
          ArrowLineShape.loadFromData(shapeData);
        else if (shapeData.type == 'StripLineShape')
          StripLineShape.loadFromData(shapeData);
        else {
          shapeData.fillColor = shapeData.color;
          shapeData.fillOpacity = parseFloat(shapeData.opacity);
          shapeData.strokeColor = shapeData.borderColor;
          shapeData.strokeWidth = shapeData.borderSize;
          if (shapeData.segmentIds.length == 1 && !shapeData.name.startsWith('Disque')) {
            LineShape.loadFromData(shapeData);
          } else {
            RegularShape.loadFromData(shapeData);
          }
        }
      });
      data.segmentsData.forEach((segmentData) => {
        if (isFinite(segmentData.indexOfReference)) {
          segmentData = app.history.steps[segmentData.indexOfReference].objects.segmentsData.find(seg => seg.id == segmentData.id);
        }
        Segment.loadFromData(segmentData);
      });
      data.pointsData.forEach((pointData) => {
        if (isFinite(pointData.indexOfReference)) {
          pointData = app.history.steps[pointData.indexOfReference].objects.pointsData.find(pt => pt.id == pointData.id);
        }
        Point.loadFromData(pointData);
      });
      this.redraw();
    } else {
      console.info('nothing to see here');
    }
  }

  firstUpdated() {
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.canvasName = this.id.substring(0, this.id.lastIndexOf('C'));
    this.ctx = this.canvas.getContext('2d');

    app[this.canvasName + 'CanvasLayer'] = this;

    this.setCanvasSize();
    window.addEventListener('resize-canvas', () => this.setCanvasSize());

    window.addEventListener('refresh' + capitalizeFirstLetter(this.canvasName), () => {
      this.redraw();
    });

    if (this.canvasName == 'upper') {
      this.createListeners();
      window.addEventListener('tool-updated', () => {
        this.redraw();
      });
    } else if (this.canvasName == 'main') {
      window.addEventListener('refresh', () => {
        this.redraw();
      });
      window.addEventListener('tool-updated', () => {
        this.redraw();
      });
    } else if (this.canvasName == 'grid') {
      window.addEventListener('settings-changed', () => {
        this.redraw();
      });
      window.addEventListener('tool-changed', () => {
        if (app.tool?.name === 'grid') {
          if (app.environment.name == 'Cubes') {
            if (app.settings.gridShown) {
              setState({
                settings: {
                  ...app.settings,
                  gridType: 'none',
                  gridShown: false,
                  gridSize: 2,
                },
              });
            } else {
              setState({
                settings: {
                  ...app.settings,
                  gridType: 'vertical-triangle',
                  gridShown: true,
                  gridSize: 2,
                },
              });
            }
            if (!app.fullHistory.isRunning) {
              window.dispatchEvent(
                new CustomEvent('actions-executed', {
                  detail: { name: 'Grille' },
                }),
              );
            }
          } else {
            import('@components/popups/grid-popup');
            createElem('grid-popup');
          }
        }
      });
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

      let mustExitFunction = false;

      if (app.workspace.lastKnownMouseClickTime && app.workspace.lastKnownMouseClickTime > event.timeStamp - 100 && app.workspace.lastKnownMouseClickCoordinates.dist(mousePos) < 5) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Double clic détecté, le deuxième clic n\'a pas été pris en compte.' } }));
        mustExitFunction = true;
      }

      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      window.dispatchEvent(
        new CustomEvent('mouse-click-changed', {
          detail: { mousePos: mousePos },
        }),
      );

      if (mustExitFunction)
        return;

      if (
        app.listenerCounter.objectSelected &&
        'mousedown' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      this.pressPositionForLongPress = mousePos;
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
      if (this.pressPositionForLongPress?.dist(mousePos) > 5)
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
      this.pressPositionForLongPress = mousePos;
      this.pressTimeoutId = window.setTimeout(() => app.dispatchEv(new CustomEvent('canvasLongPress')), 1000);
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
        window.clearTimeout(this.pressTimeoutId);
        app.dispatchEv(new CustomEvent('canvasMouseUp'));
        app.dispatchEv(new CustomEvent('canvasTouchEnd', { detail: detail }));
        return;
      }
      if (this.pressPositionForLongPress?.dist(mousePos) > 20)
        window.clearTimeout(this.pressTimeoutId);
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
      window.clearTimeout(this.pressTimeoutId);
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
      window.clearTimeout(this.pressTimeoutId);
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
    this.redraw();
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

  drawGridPoints() {
    const canvasWidth = app.canvasWidth,
      canvasHeight = app.canvasHeight,
      offsetX = app.workspace.translateOffset.x,
      offsetY = app.workspace.translateOffset.y,
      actualZoomLvl = app.workspace.zoomLevel,
      // Ne pas voir les points apparaître :
      marginToAdd = 20 * actualZoomLvl,
      minCoord = new Coordinates({
        x: -offsetX / actualZoomLvl - marginToAdd,
        y: -offsetY / actualZoomLvl - marginToAdd,
      }),
      maxCoord = new Coordinates({
        x: (canvasWidth - offsetX) / actualZoomLvl + marginToAdd,
        y: (canvasHeight - offsetY) / actualZoomLvl + marginToAdd,
      });

    let size = app.settings.gridSize,
      type = app.settings.gridType;
    if (type == 'square') {
      let t1 = Math.ceil((minCoord.x - 10) / (50 * size)),
        startX = 10 + t1 * 50 * size,
        t2 = Math.ceil((minCoord.y - 10) / (50 * size)),
        startY = 10 + t2 * 50 * size;
      for (let x = startX; x <= maxCoord.x; x += 50 * size) {
        for (let y = startY; y <= maxCoord.y; y += 50 * size) {
          new Point({
            layer: 'grid',
            coordinates: new Coordinates({ x, y }),
            color: '#F00',
            size: 1.5,
          });
        }
      }
    } else if (type == 'horizontal-triangle') {
      let approx = 43.3012701892,
        t1 = Math.ceil((minCoord.x - 10) / (50 * size)),
        startX = 10 + t1 * 50 * size,
        t2 = Math.ceil((minCoord.y - 10) / (approx * 2 * size)),
        startY = 10 + t2 * approx * 2 * size;

      for (let x = startX; x <= maxCoord.x; x += 50 * size) {
        for (let y = startY; y <= maxCoord.y; y += approx * 2 * size) {
          new Point({
            layer: 'grid',
            coordinates: new Coordinates({ x, y }),
            color: '#F00',
            size: 1.5,
          });
        }
      }

      t1 = Math.ceil((minCoord.x - 10 - (50 * size) / 2) / (50 * size));
      startX = 10 + (50 * size) / 2 + t1 * 50 * size;
      t2 = Math.ceil((minCoord.y - 10 - approx * size) / (approx * 2 * size));
      startY = 10 + approx * size + t2 * approx * 2 * size;
      for (let x = startX; x <= maxCoord.x; x += 50 * size) {
        for (let y = startY; y <= maxCoord.y; y += approx * 2 * size) {
          new Point({
            layer: 'grid',
            coordinates: new Coordinates({ x, y }),
            color: '#F00',
            size: 1.5,
          });
        }
      }
    } else if (type == 'vertical-triangle') {
      let approx = 43.3012701892,
        t1 = Math.ceil((minCoord.x - 10) / (approx * 2 * size)),
        startX = 10 + t1 * approx * 2 * size,
        t2 = Math.ceil((minCoord.y - 10) / (50 * size)),
        startY = 10 + t2 * 50 * size;

      for (let x = startX; x <= maxCoord.x; x += approx * 2 * size) {
        for (let y = startY; y <= maxCoord.y; y += 50 * size) {
          new Point({
            layer: 'grid',
            coordinates: new Coordinates({ x, y }),
            color: '#F00',
            size: 1.5,
          });
        }
      }

      t1 = Math.ceil((minCoord.x - 10 - approx * size) / (approx * 2 * size));
      startX = 10 + approx * size + t1 * approx * 2 * size;
      t2 = Math.ceil((minCoord.y - 10 - (50 * size) / 2) / (50 * size));
      startY = 10 + (50 * size) / 2 + t2 * 50 * size;
      for (let x = startX; x <= maxCoord.x; x += approx * 2 * size) {
        for (let y = startY; y <= maxCoord.y; y += 50 * size) {
          new Point({
            layer: 'grid',
            coordinates: new Coordinates({ x, y }),
            color: '#F00',
            size: 1.5,
          });
        }
      }
    }
  }

  getClosestGridPoint(coord) {
    let x = coord.x,
      y = coord.y,
      possibilities = [],
      gridType = app.settings.gridType,
      gridSize = app.settings.gridSize;

    if (gridType == 'square') {
      let topleft = new Coordinates({
        x: x - ((x - 10) % (50 * gridSize)),
        y: y - ((y - 10) % (50 * gridSize)),
      });
      // closest point on top and left
      possibilities.push(topleft);
      possibilities.push(topleft.add({ x: 0, y: 50 * gridSize }));
      possibilities.push(topleft.add({ x: 50 * gridSize, y: 0 }));
      possibilities.push(topleft.add({ x: 50 * gridSize, y: 50 * gridSize }));
    } else if (gridType == 'horizontal-triangle') {
      let height = 43.3012701892,
        topY = y - ((y - 10) % (height * gridSize)),
        topX =
          x -
          ((x - 10) % (50 * gridSize)) +
          (Math.round(topY / height / gridSize) % 2) * 25 * gridSize;
      if (topX > x) topX -= 50 * gridSize;
      let topleft1 = new Coordinates({ x: topX, y: topY });

      possibilities.push(topleft1);
      possibilities.push(topleft1.add({ x: 50 * gridSize, y: 0 }));
      possibilities.push(
        topleft1.add({ x: 25 * gridSize, y: height * gridSize }),
      );
    } else if (gridType == 'vertical-triangle') {
      let height = 43.3012701892,
        topX = x - ((x - 10) % (height * gridSize)),
        topY =
          y -
          ((y - 10) % (50 * gridSize)) +
          (Math.round(topX / height / gridSize) % 2) * 25 * gridSize;
      if (topY > y) topY -= 50 * gridSize;
      let topleft1 = new Coordinates({ x: topX, y: topY });

      possibilities.push(topleft1);
      possibilities.push(topleft1.add({ x: 0, y: 50 * gridSize }));
      possibilities.push(
        topleft1.add({ x: height * gridSize, y: 25 * gridSize }),
      );
    }

    possibilities.sort((poss1, poss2) =>
      coord.dist(poss1) > coord.dist(poss2) ? 1 : -1,
    );
    possibilities = possibilities.filter(
      (poss) =>
        this.points.findIndex((pt) =>
          pt.coordinates.equal(poss),
        ) != -1,
    );

    if (possibilities.length == 0) return null;

    const closestCoord = possibilities[0];
    const closestPoint = this.points.find((pt) =>
      pt.coordinates.equal(closestCoord),
    );
    closestPoint.type = 'grid';

    return closestPoint;
  }

  drawShape(shape, scaling) {
    shape.setCtxForDrawing(this.ctx, scaling);
    this.ctx.miterLimit = 1;

    let pathScaleMethod = this.mustScaleShapes
      ? 'scale'
      : 'no scale',
      path = new Path2D(shape.getSVGPath(pathScaleMethod, true, false, true));
    if (shape.drawHidden) {
      let canvasPattern = document.createElement("canvas");
      canvasPattern.width = 10;
      canvasPattern.height = 10;
      let contextPattern = canvasPattern.getContext("2d");

      let path = new Path2D(`
        M 5 0 L 10 5 L 10 10 L 0 0 L 5 0 M 0 5 L 5 10 L 0 10 L 0 5
      `);
      contextPattern.fillStyle = this.ctx.fillStyle;
      contextPattern.fill(path);

      let pattern = this.ctx.createPattern(canvasPattern, "repeat");
      canvasPattern.remove();

      this.ctx.fillStyle = pattern;
    }
    this.ctx.fill(path, 'nonzero');

    path = new Path2D(shape.getSVGPath(pathScaleMethod, true, true));
    this.ctx.globalAlpha = 1;

    if (shape.drawHidden) {
      this.ctx.setLineDash([5, 15]);
    }
    if (shape.segments.some(seg => seg.color != undefined)) {
      shape.segments.forEach(seg => {
        let path = new Path2D(seg.getSVGPath(pathScaleMethod, true));
        this.ctx.strokeStyle = seg.color ? seg.color : shape.strokeColor;
        if (seg.width != 1)
          this.ctx.lineWidth = seg.width;
        this.ctx.stroke(path);
        this.ctx.lineWidth = shape.strokeWidth;
      });
    } else
      this.ctx.stroke(path);
    this.ctx.setLineDash([]);
  }

  drawPoint(point, justForAgrumentCount, doSave = true) {
    if (point.geometryIsVisible === false || point.geometryIsHidden === true)
      return;
    if (doSave) this.ctx.save();

    this.ctx.fillStyle = point.color;
    this.ctx.globalAlpha = 1;

    const canvasCoodinates = point.coordinates.toCanvasCoordinates();

    this.ctx.beginPath();
    this.ctx.moveTo(canvasCoodinates.x, canvasCoodinates.y);
    this.ctx.arc(
      canvasCoodinates.x,
      canvasCoodinates.y,
      point.size * 2 * app.workspace.zoomLevel,
      0,
      2 * Math.PI,
      0,
    );
    this.ctx.closePath();
    this.ctx.fill();

    if (doSave) this.ctx.restore();
  }

  drawText(
    text,
    doSave = true,
  ) {
    if (doSave) this.ctx.save();

    const fontSize = 20;
    let position = text.coordinates.add({
      x: (((-3 * fontSize) / 13) * text.message.length) / app.workspace.zoomLevel,
      y: fontSize / 2 / app.workspace.zoomLevel,
    });
    position = position.toCanvasCoordinates();

    this.ctx.fillStyle = text.color;
    this.ctx.font = fontSize + 'px Arial';
    this.ctx.fillText(text.message, position.x, position.y);

    if (doSave) this.ctx.restore();
  }

  // drawSegment(segment, color = '#000', size = 1, doSave = true) {
  //   if (doSave) this.ctx.save();

  //   this.ctx.strokeStyle = color;
  //   this.ctx.globalAlpha = 1;
  //   this.ctx.lineWidth = size * app.workspace.zoomLevel;

  //   const firstCoordinates = this.vertexes[0].coordinates.toCanvasCoordinates();

  //   const path = new Path2D(
  //     ['M', firstCoordinates.x, firstCoordinates.y, segment.getSVGPath()].join(' ')
  //   );

  //   this.ctx.stroke(path);

  //   if (doSave) this.ctx.restore();
  // }

  // drawLine(segment, color = '#000', size = 1, doSave = true) {
  //   if (doSave) this.ctx.save();

  //   this.ctx.strokeStyle = color;
  //   this.ctx.globalAlpha = 1;
  //   this.ctx.lineWidth = size * app.workspace.zoomLevel;

  //   let angle = segment.getAngleWithHorizontal();
  //   let transformSegment = new Segment(
  //     segment.vertexes[0].subCoordinates(
  //       1000000 * Math.cos(angle),
  //       1000000 * Math.sin(angle),
  //     ),
  //     segment.vertexes[1].addCoordinates(
  //       1000000 * Math.cos(angle),
  //       1000000 * Math.sin(angle),
  //     ),
  //   );

  //   const v0Copy = new Point(transformSegment.vertexes[0]);
  //   v0Copy.setToCanvasCoordinates();

  //   const path = new Path2D(
  //     ['M', v0Copy.x, v0Copy.y, transformSegment.getSVGPath()].join(' '),
  //   );

  //   this.ctx.stroke(path);

  //   if (doSave) this.ctx.restore();
  // }

  // // Ajout d'un fond d'écran fixé à droite
  // set background(touch) {
  //   this.style.display = 'block';
  //   this.style.background = `url('${touch}') no-repeat right`;
  // }
}
customElements.define('canvas-layer', CanvasLayer);
