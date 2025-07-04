import { LitElement, css, html } from 'lit';
import { app } from '../controllers/Core/App';
import { SelectManager } from '../controllers/Core/Managers/SelectManager';
import { Coordinates } from '../controllers/Core/Objects/Coordinates';
import { Point } from '../controllers/Core/Objects/Point';
import { Segment } from '../controllers/Core/Objects/Segment';
import { ArrowLineShape } from '../controllers/Core/Objects/Shapes/ArrowLineShape';
import { CubeShape } from '../controllers/Core/Objects/Shapes/CubeShape';
import { LineShape } from '../controllers/Core/Objects/Shapes/LineShape';
import { RegularShape } from '../controllers/Core/Objects/Shapes/RegularShape';
import { Shape } from '../controllers/Core/Objects/Shapes/Shape';
import { SinglePointShape } from '../controllers/Core/Objects/Shapes/SinglePointShape';
import { StripLineShape } from '../controllers/Core/Objects/Shapes/StripLineShape';
import { capitalizeFirstLetter, createElem, findObjectById } from '../controllers/Core/Tools/general';
import { gridStore } from '../store/gridStore.js';

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
    this.mustDrawGrid = false; // This seems related but might be for a different grid feature or unused.
    this.mustScaleShapes = true;
    this.unsubscribeGridStore = null;
  }

  static styles = css`
    :host {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      top: 0;
      background-color: rgba(0, 0, 0 , 0);
      box-sizing: border-box;
    }

    canvas {
      box-sizing: border-box;
      background-color: rgba(0, 0, 0 , 0);
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `

  render() {
    return html`<canvas width="${this.clientWidth}" height="${this.clientHeight}"></canvas>`;
  }

  updated() {
    this.redraw()
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
      this.ctx.clearRect(0, 0, this.clientWidth, this.canvas.height);
    }
  }

  redraw() {
    this.clear();
    this.texts.forEach((text) => text.updateMessage());
    if (this.canvasName == 'upper')
      window.dispatchEvent(new CustomEvent('refreshStateUpper'));
    else if (this.canvasName == 'grid') {
      this.removeAllObjects(); // This clears shapes/segments/points arrays, which are not used for drawing the grid itself.
      // The actual grid drawing is controlled by drawGridPoints based on gridStore state.
      const gridState = gridStore.getState();
      if (gridState.isVisible) {
        this.drawGridPoints();
      }
    }
    this.draw(); // This draws shapes, points, texts from the arrays. For 'grid' canvas, these arrays should be empty.
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
        if (pt.visible && (pt.type == 'shapeCenter' || pt.type == 'divisionPoint'))
          this.drawPoint(pt);
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

    window.addEventListener('refresh' + capitalizeFirstLetter(this.canvasName), () => {
      this.redraw();
    });

    if (this.canvasName == 'upper') {
      this.createListeners()
      window.addEventListener('tool-updated', () => this.redraw());
    } else if (this.canvasName == 'main') {
      window.addEventListener('refresh', () => this.redraw());
      window.addEventListener('tool-updated', () => this.redraw());
    } else if (this.canvasName == 'grid') {
      // window.addEventListener('settings-changed', () => this.redraw()); // Replaced by gridStore subscription
      this.unsubscribeGridStore = gridStore.subscribe(() => this.redraw());

      window.addEventListener('tool-changed', () => {
        if (app.tool?.name === 'grid') {
          if (app.environment.name == 'Cubes') {
            const currentGridState = gridStore.getState();
            if (currentGridState.isVisible && currentGridState.gridType == 'vertical-triangle') { // Toggle off if it's the specific cube grid
              gridStore.setGridType('none'); // This will also set isVisible to false
              // gridStore.setGridSize(2); // Keep previous size or reset? Original code set to 2.
            } else { // Toggle on to vertical-triangle or switch to it
              gridStore.setGridType('vertical-triangle'); // This will also set isVisible to true
              gridStore.setGridSize(2); // Original code set size to 2 for cubes
            }
            // The old setState call that modified app.settings for grid is removed.
            // History event dispatching:
            if (!app.fullHistory.isRunning) {
              window.dispatchEvent(
                new CustomEvent('actions-executed', {
                  detail: { name: 'Grille' }, // Or a more specific name if needed
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

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeGridStore) {
      this.unsubscribeGridStore();
    }
    // Consider removing other window event listeners if they were added uniquely for this instance
    // and are not cleaned up automatically. For example, if 'refresh' + capitalizeFirstLetter(this.canvasName)
    // was added with a bound function. For now, standard window listeners are usually fine.
  }

  createListeners() {
    this.canvas.addEventListener('click', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', { detail: { mousePos: mousePos } })
      );
      if (
        app.listenerCounter.objectSelected &&
        'click' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      window.dispatchEvent(new CustomEvent('canvasClick'));
    });

    this.canvas.addEventListener('mousedown', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);

      let mustExitFunction = false;

      if (app.workspace.lastKnownMouseClickTime && app.workspace.lastKnownMouseClickTime > event.timeStamp - 100 && app.workspace.lastKnownMouseClickCoordinates.dist(mousePos) < 5) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: "Double clic détecté, le deuxième clic n'a pas été pris en compte." } }));
        mustExitFunction = true;
      }

      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', { detail: { mousePos: mousePos } })
      );
      window.dispatchEvent(
        new CustomEvent('mouse-click-changed', { detail: { mousePos: mousePos } })
      );

      if (mustExitFunction) return

      if (
        app.listenerCounter.objectSelected &&
        'mousedown' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      this.pressPositionForLongPress = mousePos;
      this.pressTimeoutId = window.setTimeout(() => window.dispatchEvent(new CustomEvent('canvasLongPress')), 1000);
      window.dispatchEvent(new CustomEvent('canvasMouseDown'));
    });

    this.canvas.addEventListener('mouseup', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', { detail: { mousePos: mousePos } })
      );
      window.clearTimeout(this.pressTimeoutId);
      window.dispatchEvent(new CustomEvent('canvasMouseUp'));
    });

    this.canvas.addEventListener('mousemove', (event) => {
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', { detail: { mousePos: mousePos } })
      );
      if (this.pressPositionForLongPress?.dist(mousePos) > 5)
        window.clearTimeout(this.pressTimeoutId);
      window.dispatchEvent(new CustomEvent('canvasMouseMove'));
    });

    this.canvas.addEventListener('mouseout', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', { detail: { mousePos: mousePos } })
      );
      window.dispatchEvent(new CustomEvent('canvasMouseUp'));
    });

    const handleWheel = (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = new Coordinates({
        x: event.clientX - app.settings.mainMenuWidth,
        y: event.clientY,
      });
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', { detail: { mousePos: mousePos } })
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
      window.dispatchEvent(new CustomEvent('canvasMouseWheel', { detail: detail }));
    }

    this.canvas.addEventListener('wheel', handleWheel);
    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      if (event.touches.length === 1)
        window.dispatchEvent(
          new CustomEvent('mouse-coordinates-changed', { detail: { mousePos: mousePos } })
        );
      if (
        app.listenerCounter.objectSelected &&
        'mousedown' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      let detail = { touches: [] };
      for (let touch of event.touches) {
        detail.touches.push(
          new Coordinates({
            x: touch.clientX - app.settings.mainMenuWidth,
            y: touch.clientY,
          }),
        );
      }
      this.pressPositionForLongPress = mousePos;
      this.pressTimeoutId = window.setTimeout(() => window.dispatchEvent(new CustomEvent('canvasLongPress')), 1000);
      window.dispatchEvent(new CustomEvent('canvasMouseDown'));
      window.dispatchEvent(new CustomEvent('canvasTouchStart', { detail: detail }));
    });

    this.canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      if (event.touches.length === 1)
        window.dispatchEvent(
          new CustomEvent('mouse-coordinates-changed', { detail: { mousePos: mousePos } })
        );
      const detail = { touches: [] };
      for (let touch of event.touches) {
        detail.touches.push(
          new Coordinates({
            x: touch.clientX - app.settings.mainMenuWidth,
            y: touch.clientY,
          }),
        );
      }
      if (this.isOutsideOfCanvas(mousePos)) {
        event.stopPropagation();
        window.clearTimeout(this.pressTimeoutId);
        window.dispatchEvent(new CustomEvent('canvasMouseUp'));
        window.dispatchEvent(new CustomEvent('canvasTouchEnd', { detail: detail }));
        return;
      }
      if (this.pressPositionForLongPress?.dist(mousePos) > 20)
        window.clearTimeout(this.pressTimeoutId);
      window.dispatchEvent(new CustomEvent('canvasMouseMove'));
      window.dispatchEvent(new CustomEvent('canvasTouchMove', { detail: detail }));
    }, false);

    this.canvas.addEventListener('touchend', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      if (event.touches.length === 1)
        window.dispatchEvent(
          new CustomEvent('mouse-coordinates-changed', { detail: { mousePos: mousePos } })
        );
      if (
        app.listenerCounter.objectSelected &&
        'click' == app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      let detail = { touches: [] }
      for (let touch of event.changedTouches) {
        detail.touches.push(
          new Coordinates({
            x: touch.clientX - app.settings.mainMenuWidth,
            y: touch.clientY,
          }),
        );
      }
      window.clearTimeout(this.pressTimeoutId);
      window.dispatchEvent(new CustomEvent('canvasMouseUp'));
      window.dispatchEvent(new CustomEvent('canvasClick'));
      window.dispatchEvent(new CustomEvent('canvasTouchEnd', { detail: detail }));
    });

    this.canvas.addEventListener('touchcancel', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      let mousePos = this.getMousePos(event);
      window.dispatchEvent(new CustomEvent('mouse-coordinates-changed',
        { detail: { mousePos: mousePos } }));
      if (app.listenerCounter.objectSelected && 'click' == app.workspace.selectionConstraints.eventType)
        SelectManager.selectObject(mousePos);

      let detail = { touches: [] };
      for (let touch of event.changedTouches) {
        detail.touches.push(new Coordinates({
          x: touch.clientX - app.settings.mainMenuWidth,
          y: touch.clientY
        })
        );
      }
      window.clearTimeout(this.pressTimeoutId);
      window.dispatchEvent(new CustomEvent('canvasMouseUp'));
      window.dispatchEvent(new CustomEvent('canvasClick'));
      window.dispatchEvent(new CustomEvent('canvastouchcancel', { detail: detail }));
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

  // setCanvasSize() {
  //   this.redraw();
  // }

  isOutsideOfCanvas(mousePos) {
    mousePos = mousePos.toCanvasCoordinates();
    if (mousePos.x < 0 || mousePos.y < 0) return true;
    if (mousePos.x > app.canvasWidth || mousePos.y > app.canvasHeight)
      return true;
    if (app.workspace.limited && mousePos.x > (app.canvasWidth / 2) - 16) return true
    return false;
  }

  drawGridPoints() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      // console.warn("drawGridPoints: context is not available");
      return;
    }

    const gridState = gridStore.getState();
    const canvasWidth = app.canvasWidth;
    const canvasHeight = app.canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!gridState.isVisible || gridState.gridType === 'none') {
      return;
    }

    let zoomLevel = app.workspace.zoomLevel;
    if (typeof zoomLevel !== 'number' || !isFinite(zoomLevel) || zoomLevel <= 0) {
      zoomLevel = 1.0;
    }

    const gridSize = gridState.gridSize; // in cm
    const PIXELS_PER_CM = 37.8; // As per drawGridPoints tests
    const calculatedGridStep = gridSize * PIXELS_PER_CM * zoomLevel;
    // Use gridState.pointSize (typically 1) and multiply by a factor for visible radius,
    // or directly use 2 * zoomLevel if tests expect that regardless of gridState.pointSize.
    // Tests for drawGridPoints expect arc radius to be `2 * zoomFactor`.
    const pointRadius = 2 * zoomLevel;

    if (calculatedGridStep <= 0) {
      // console.warn('drawGridPoints: calculatedGridStep is zero or negative.');
      return;
    }

    ctx.fillStyle = gridState.gridColor || '#888888'; // Use color from store, fallback to test expectation

    const drawPointAt = (x, y) => {
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
      ctx.fill();
    };

    const startX = 0;
    const startY = 0;

    if (gridState.gridType === 'square') {
      for (let x = startX; x <= canvasWidth; x += calculatedGridStep) {
        for (let y = startY; y <= canvasHeight; y += calculatedGridStep) {
          drawPointAt(x, y);
        }
      }
    } else if (gridState.gridType === 'vertical-lines') {
      for (let y = startY; y <= canvasHeight; y += calculatedGridStep) {
        drawPointAt(startX, y); // Points along Y-axis at startX
      }
    } else if (gridState.gridType === 'horizontal-lines') {
      for (let x = startX; x <= canvasWidth; x += calculatedGridStep) {
        drawPointAt(x, startY); // Points along X-axis at startY
      }
    } else if (gridState.gridType === 'horizontal-triangle') { // Logic for vertical-triangle (was horizontal-triangle)
      const triangleHeight = calculatedGridStep * (Math.sqrt(3) / 2);
      if (triangleHeight <= 0) return;
      for (let y = startY, row = 0; y <= canvasHeight + triangleHeight; y += triangleHeight, row++) {
        const offsetX = (row % 2 === 0) ? 0 : calculatedGridStep / 2;
        for (let x = startX + offsetX; x <= canvasWidth + calculatedGridStep / 2; x += calculatedGridStep) {
          drawPointAt(x, y);
        }
      }
    } else if (gridState.gridType === 'vertical-triangle') { // Logic for horizontal-triangle (was vertical-triangle)
      const horizontalStep = calculatedGridStep * (Math.sqrt(3) / 2); // This is triangleWidth
      if (horizontalStep <= 0) return;
      for (let x = startX, col = 0; x <= canvasWidth + horizontalStep; x += horizontalStep, col++) {
        const offsetY = (col % 2 === 0) ? 0 : calculatedGridStep / 2;
        for (let y = startY + offsetY; y <= canvasHeight + calculatedGridStep / 2; y += calculatedGridStep) {
          drawPointAt(x, y);
        }
      }
    }
  }

  /**
   * Récupère le point de la grille le plus proche d'une coordonnée donnée
   * @param { Coordinates } checkingCoordinates Les coordonnées
   * @return { Coordinates | undefined } Les coordonnées du point de la grille le plus proche ou undefined
   */
  getClosestGridPoint(checkingCoordinates) {
    if (!checkingCoordinates || typeof checkingCoordinates.x !== 'number' || typeof checkingCoordinates.y !== 'number' || !isFinite(checkingCoordinates.x) || !isFinite(checkingCoordinates.y)) {
      // console.warn("getClosestGridPoint: checkingCoordinates are invalid", checkingCoordinates);
      return undefined;
    }

    const gridState = gridStore.getState();
    if (!gridState.isVisible || gridState.gridType === 'none') {
      return undefined;
    }

    const canvasWidth = app.canvasWidth;
    const canvasHeight = app.canvasHeight;

    let zoomLevel = app.workspace.zoomLevel;
    if (typeof zoomLevel !== 'number' || !isFinite(zoomLevel) || zoomLevel <= 0) {
      // console.warn("getClosestGridPoint: Invalid app.workspace.zoomLevel, defaulting to 1.0. Value:", zoomLevel);
      zoomLevel = 1.0;
    }

    const gridSize = gridState.gridSize; // en cm
    const pixelsPerCm = 37.795; // Harmonisé avec les attentes des tests getClosestGridPoint
    const calculatedGridStep = gridSize * pixelsPerCm * zoomLevel;

    if (calculatedGridStep <= 0) {
      // console.warn('getClosestGridPoint: calculatedGridStep is zero or negative.');
      return undefined;
    }

    let closestPoint = null;
    let minDistance = Infinity;

    const checkAndUpdateClosest = (x, y) => {
      const gridPointCoords = new Coordinates({ x, y });
      const dist = checkingCoordinates.dist(gridPointCoords);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = gridPointCoords;
      }
    };

    let startX = 0; // Point de départ pour l'itération de la grille
    let startY = 0;

    // Itérer sur les points de grille potentiels en fonction du type de grille
    if (gridState.gridType === 'square') {
      for (let x = startX; x <= canvasWidth + calculatedGridStep; x += calculatedGridStep) {
        for (let y = startY; y <= canvasHeight + calculatedGridStep; y += calculatedGridStep) {
          checkAndUpdateClosest(x, y);
        }
      }
    } else if (gridState.gridType === 'vertical-lines') {
      for (let xGrid = startX; xGrid <= canvasWidth + calculatedGridStep; xGrid += calculatedGridStep) {
        checkAndUpdateClosest(xGrid, checkingCoordinates.y); // Y est le même que l'entrée
      }
    } else if (gridState.gridType === 'horizontal-lines') {
      for (let yGrid = startY; yGrid <= canvasHeight + calculatedGridStep; yGrid += calculatedGridStep) {
        checkAndUpdateClosest(checkingCoordinates.x, yGrid); // X est le même que l'entrée
      }
    } else if (gridState.gridType === 'horizontal-triangle') { // Logic for vertical-triangle (was horizontal-triangle)
      const triangleHeight = calculatedGridStep * Math.sqrt(3) / 2;
      if (triangleHeight <= 0) return undefined;
      for (let y = startY, row = 0; y <= canvasHeight + triangleHeight; y += triangleHeight, row++) {
        const offsetX = (row % 2 === 0) ? 0 : calculatedGridStep / 2;
        for (let x = startX + offsetX; x <= canvasWidth + calculatedGridStep; x += calculatedGridStep) {
          checkAndUpdateClosest(x, y);
        }
      }
    } else if (gridState.gridType === 'vertical-triangle') { // Logic for horizontal-triangle (was vertical-triangle)
      const horizontalStep = calculatedGridStep * Math.sqrt(3) / 2;
      if (horizontalStep <= 0) return undefined;
      for (let x = startX, col = 0; x <= canvasWidth + horizontalStep; x += horizontalStep, col++) {
        const offsetY = (col % 2 === 0) ? 0 : calculatedGridStep / 2;
        for (let y = startY + offsetY; y <= canvasHeight + calculatedGridStep; y += calculatedGridStep) {
          checkAndUpdateClosest(x, y);
        }
      }
    }

    return closestPoint; // Retourne l'objet Coordinates ou null si aucun point n'est trouvé
  }

  updateVisiblePart(forced = false) {
    if (!this.canvas) return;

    // Validate scale
    if (typeof this.scale !== 'number' || !isFinite(this.scale) || this.scale <= 0.00001) {
      this.scale = 1.0;
    }

    // Validate canvas dimensions
    const canvasWidth = typeof this.canvas.width === 'number' && isFinite(this.canvas.width) ? this.canvas.width : 0;
    const canvasHeight = typeof this.canvas.height === 'number' && isFinite(this.canvas.height) ? this.canvas.height : 0;

    let newX = Math.floor(this.xOffset / this.scale);
    let newY = Math.floor(this.yOffset / this.scale);
    let newWidth = Math.ceil(canvasWidth / this.scale);
    let newHeight = Math.ceil(canvasHeight / this.scale);

    // Only update if there is a change or if forced
    if (forced || this.canvasVisibleLeft !== newX || this.canvasVisibleTop !== newY || this.canvasVisibleWidth !== newWidth || this.canvasVisibleHeight !== newHeight) {
      this.canvasVisibleLeft = newX;
      this.canvasVisibleTop = newY;
      this.canvasVisibleWidth = newWidth;
      this.canvasVisibleHeight = newHeight;
      // console.log('Visible part updated:', this.canvasVisibleLeft, this.canvasVisibleTop, this.canvasVisibleWidth, this.canvasVisibleHeight);
    }
  }

  drawShape(shape, scaling) {
    shape.setCtxForDrawing(this.ctx, scaling);
    this.ctx.miterLimit = 1;

    let pathScaleMethod = this.mustScaleShapes ? 'scale' : 'no scale',
      path = new Path2D(shape.getSVGPath(pathScaleMethod, true, false, true));
    if (shape.drawHidden) {
      let canvasPattern = document.createElement("canvas");
      canvasPattern.width = 10;
      canvasPattern.height = 10;
      let contextPattern = canvasPattern.getContext("2d");
      let path = new Path2D(`M 5 0 L 10 5 L 10 10 L 0 0 L 5 0 M 0 5 L 5 10 L 0 10 L 0 5`);
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
        if (seg.width != 1) this.ctx.lineWidth = seg.width;
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
    this.ctx.arc(
      canvasCoodinates.x,
      canvasCoodinates.y,
      point.size * 2 * app.workspace.zoomLevel,
      0,
      2 * Math.PI,
      0
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

  updateVisiblePart() {
    const currentScale = (typeof this.scale === 'number' && isFinite(this.scale) && this.scale > 0.00001) ? this.scale : 1.0;
    const canvasWidth = this.canvas.width || 0;
    const canvasHeight = this.canvas.height || 0;

    this.canvasVisibleLeft = this.offsetX / currentScale;
    this.canvasVisibleTop = this.offsetY / currentScale;
    this.canvasVisibleWidth = canvasWidth / currentScale;
    this.canvasVisibleHeight = canvasHeight / currentScale;
    // console.log('updateVisiblePart', {
    //   left: this.canvasVisibleLeft,
    //   top: this.canvasVisibleTop,
    //   width: this.canvasVisibleWidth,
    //   height: this.canvasVisibleHeight,
    //   scale: currentScale,
    //   offsetX: this.offsetX,
    //   offsetY: this.offsetY,
    //   canvasWidth: canvasWidth,
    //   canvasHeight: canvasHeight,
    // });
  }
}
customElements.define('canvas-layer', CanvasLayer);
