import { LitElement, css, html } from 'lit';
import { app } from '../controllers/Core/App';
import { SelectManager } from '../controllers/Core/Managers/SelectManager';
import { Coordinates } from '../controllers/Core/Objects/Coordinates';
import { Point } from '../controllers/Core/Objects/Point';
import { Segment } from '../controllers/Core/Objects/Segment';
// Shapes imported lazily in loadFromData
import {
  capitalizeFirstLetter,
  createElem,
  findObjectById,
} from '../controllers/Core/Tools/general';
import { gridStore } from '../store/gridStore.js';

// Constantes pour le rendu de la grille
const GRID_CONSTANTS = {
  PIXELS_PER_CM: 37.8,
  LONG_PRESS_DELAY: 1000,
  DOUBLE_CLICK_THRESHOLD: 100,
  MOVEMENT_THRESHOLD_MOUSE: 5,
  MOVEMENT_THRESHOLD_TOUCH: 20,
};

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
    this.mustScaleShapes = true;
    this.unsubscribeGridStore = null;

    // Optimisation des performances
    this._lastRedrawTime = 0;
    this._redrawThrottle = 16; // ~60fps
    this._pendingRedraw = false;
    this._redrawRequestId = null;
  }

  static styles = css`
    :host {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      top: 0;
      background-color: rgba(0, 0, 0, 0);
      box-sizing: border-box;
    }

    canvas {
      box-sizing: border-box;
      background-color: rgba(0, 0, 0, 0);
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `;

  render() {
    return html`<canvas
      width="${this.clientWidth}"
      height="${this.clientHeight}"
    ></canvas>`;
  }

  updated() {
    this.throttledRedraw();
  }

  /**
   * Redraw avec throttling pour améliorer les performances
   */
  throttledRedraw() {
    const now = performance.now();

    // Si un redraw est déjà en attente, l'annuler
    if (this._redrawRequestId) {
      cancelAnimationFrame(this._redrawRequestId);
    }

    // Si assez de temps s'est écoulé depuis le dernier redraw
    if (now - this._lastRedrawTime >= this._redrawThrottle) {
      this.redraw();
      this._lastRedrawTime = now;
    } else {
      // Programmer le redraw pour plus tard
      this._redrawRequestId = requestAnimationFrame(() => {
        this.redraw();
        this._lastRedrawTime = performance.now();
        this._redrawRequestId = null;
      });
    }
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
      // Optimisation: utiliser la largeur réelle du canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  redraw() {
    // Éviter les redraws inutiles
    if (this._pendingRedraw) return;
    this._pendingRedraw = true;

    try {
      this.clear();
      this.texts.forEach((text) => text.updateMessage());

      if (this.canvasName === 'upper') {
        window.dispatchEvent(new CustomEvent('refreshStateUpper'));
      } else if (this.canvasName === 'grid') {
        this.removeAllObjects();
        const gridState = gridStore.getState();
        if (gridState.isVisible) {
          this.drawGridPoints();
        }
      }

      this.draw();
    } finally {
      this._pendingRedraw = false;
    }
  }

  draw(scaling = 'scale') {
    if (this.mustDrawShapes) {
      this.shapes.forEach((s) => {
        if (this.editingShapeIds.findIndex((id) => s.id === id) === -1) {
          if (
            s.geometryObject &&
            (s.geometryObject.geometryIsVisible === false ||
              s.geometryObject.geometryIsHidden === true ||
              s.geometryObject.geometryIsConstaintDraw === true)
          )
            return;
          this.drawShape(s, scaling);
          if (this.mustDrawPoints) {
            if (app.environment.name === 'Geometrie') {
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
          (pt.type === 'shapeCenter' || pt.type === 'divisionPoint')
        )
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
          (pt.type === 'shapeCenter' ||
            pt.type === 'divisionPoint' ||
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
        if (this.editingShapeIds.findIndex((id) => s.id === id) === -1) {
          if (
            s.geometryObject &&
            (s.geometryObject.geometryIsVisible === false ||
              s.geometryObject.geometryIsHidden === true ||
              s.geometryObject.geometryIsConstaintDraw === true)
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
    const pt1 = findObjectById(pt1Id);
    const pt2 = findObjectById(pt2Id);
    if (pt1.shape.name === 'PointOnLine' || pt2.shape.name === 'PointOnLine') {
      let segId;
      if (pt1.shape.name === 'PointOnLine')
        segId = pt1.shape.geometryObject.geometryParentObjectId1;
      else segId = pt2.shape.geometryObject.geometryParentObjectId1;
      return findObjectById(segId);
    }
    const segmentIds1 = pt1.segmentIds;
    const segmentIds2 = pt2.segmentIds;
    const commonSegmentIds = segmentIds1.filter(
      (id1) => segmentIds2.findIndex((id2) => id2 === id1) !== -1,
    );
    const commonSegments = commonSegmentIds.map((id) =>
      this.segments.find((seg) => seg.id == id),
    );
    commonSegments.sort((seg1, seg2) => seg2.idx - seg1.idx);
    return commonSegments[0];
  }

  saveData() {
    const data = {
      shapesData: this.shapes.map((shape) => shape.saveData()),
      segmentsData: this.segments.map((segment) => segment.saveData()),
      pointsData: this.points.map((point) => point.saveData()),
    };
    return data;
  }

  async loadFromData(data) {
    this.removeAllObjects();
    // Tolérer null/undefined et données partielles sans lever d'erreur
    if (!data) {
      // Rien à charger, simplement rafraîchir pour effacer le canvas
      this.redraw();
      return;
    }

    const shapesData = Array.isArray(data.shapesData) ? data.shapesData : [];
    const segmentsData = Array.isArray(data.segmentsData)
      ? data.segmentsData
      : [];
    const pointsData = Array.isArray(data.pointsData) ? data.pointsData : [];

    if (shapesData.length || segmentsData.length || pointsData.length) {
      for (const shapeData of shapesData) {
        let currentShapeData = shapeData;
        if (isFinite(shapeData.indexOfReference)) {
          currentShapeData = app.history.steps[
            shapeData.indexOfReference
          ].objects.shapesData.find((s) => s.id === shapeData.id);
        }
        if (currentShapeData.type === 'Shape') {
          const { Shape } = await import(
            '../controllers/Core/Objects/Shapes/Shape'
          );
          Shape.loadFromData(currentShapeData);
        } else if (currentShapeData.type === 'RegularShape') {
          const { RegularShape } = await import(
            '../controllers/Core/Objects/Shapes/RegularShape'
          );
          RegularShape.loadFromData(currentShapeData);
        } else if (currentShapeData.type === 'CubeShape') {
          const { CubeShape } = await import(
            '../controllers/Core/Objects/Shapes/CubeShape'
          );
          CubeShape.loadFromData(currentShapeData);
        } else if (currentShapeData.type === 'LineShape') {
          const { LineShape } = await import(
            '../controllers/Core/Objects/Shapes/LineShape'
          );
          LineShape.loadFromData(currentShapeData);
        } else if (currentShapeData.type === 'SinglePointShape') {
          const { SinglePointShape } = await import(
            '../controllers/Core/Objects/Shapes/SinglePointShape'
          );
          SinglePointShape.loadFromData(currentShapeData);
        } else if (currentShapeData.type === 'ArrowLineShape') {
          const { ArrowLineShape } = await import(
            '../controllers/Core/Objects/Shapes/ArrowLineShape'
          );
          ArrowLineShape.loadFromData(currentShapeData);
        } else if (currentShapeData.type === 'StripLineShape') {
          const { StripLineShape } = await import(
            '../controllers/Core/Objects/Shapes/StripLineShape'
          );
          StripLineShape.loadFromData(currentShapeData);
        } else {
          currentShapeData.fillColor = currentShapeData.color;
          currentShapeData.fillOpacity = parseFloat(currentShapeData.opacity);
          currentShapeData.strokeColor = currentShapeData.borderColor;
          currentShapeData.strokeWidth = currentShapeData.borderSize;
          if (
            currentShapeData.segmentIds.length === 1 &&
            !currentShapeData.name.startsWith('Disque')
          ) {
            const { LineShape } = await import(
              '../controllers/Core/Objects/Shapes/LineShape'
            );
            LineShape.loadFromData(currentShapeData);
          } else {
            const { RegularShape } = await import(
              '../controllers/Core/Objects/Shapes/RegularShape'
            );
            RegularShape.loadFromData(currentShapeData);
          }
        }
      }
      segmentsData.forEach((segmentData) => {
        if (isFinite(segmentData.indexOfReference)) {
          segmentData = app.history.steps[
            segmentData.indexOfReference
          ].objects.segmentsData.find((seg) => seg.id === segmentData.id);
        }
        Segment.loadFromData(segmentData);
      });
      pointsData.forEach((pointData) => {
        if (isFinite(pointData.indexOfReference)) {
          pointData = app.history.steps[
            pointData.indexOfReference
          ].objects.pointsData.find((pt) => pt.id === pointData.id);
        }
        Point.loadFromData(pointData);
      });
      this.redraw();
    } else {
      // Données présentes mais vides/partielles
      this.redraw();
    }
  }

  firstUpdated() {
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.canvasName = this.id.substring(0, this.id.lastIndexOf('C'));
    this.ctx = this.canvas.getContext('2d');
    app[this.canvasName + 'CanvasLayer'] = this;

    // Émettre un événement quand le tangramCanvasLayer est prêt
    if (this.canvasName === 'tangram') {
      window.dispatchEvent(new CustomEvent('tangram-canvas-ready'));
    }

    window.addEventListener(
      'refresh' + capitalizeFirstLetter(this.canvasName),
      () => {
        this.redraw();
      },
    );

    if (this.canvasName === 'upper') {
      this.createListeners();
      window.addEventListener('tool-updated', () => this.redraw());
    } else if (this.canvasName === 'main') {
      window.addEventListener('refresh', () => this.redraw());
      window.addEventListener('tool-updated', () => this.redraw());
    } else if (this.canvasName === 'grid') {
      // window.addEventListener('settings-changed', () => this.redraw()); // Replaced by gridStore subscription
      this.unsubscribeGridStore = gridStore.subscribe(() => this.redraw());

      window.addEventListener('tool-changed', () => {
        if (app.tool?.name === 'grid') {
          if (app.environment.name === 'Cubes') {
            const currentGridState = gridStore.getState();
            if (
              currentGridState.isVisible &&
              currentGridState.gridType === 'vertical-triangle'
            ) {
              // Toggle off if it's the specific cube grid
              gridStore.setGridType('none'); // This will also set isVisible to false
              // gridStore.setGridSize(2); // Keep previous size or reset? Original code set to 2.
            } else {
              // Toggle on to vertical-triangle or switch to it
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

    // Nettoyage des ressources et listeners
    this.cleanupResources();

    if (this.unsubscribeGridStore) {
      this.unsubscribeGridStore();
      this.unsubscribeGridStore = null;
    }
    // Consider removing other window event listeners if they were added uniquely for this instance
    // and are not cleaned up automatically. For example, if 'refresh' + capitalizeFirstLetter(this.canvasName)
    // was added with a bound function. For now, standard window listeners are usually fine.
  }

  /**
   * Nettoyage complet des ressources pour éviter les fuites mémoire
   */
  cleanupResources() {
    // Annuler les requêtes d'animation en attente
    if (this._redrawRequestId) {
      cancelAnimationFrame(this._redrawRequestId);
      this._redrawRequestId = null;
    }

    // Nettoyer les tableaux d'objets
    this.shapes = [];
    this.segments = [];
    this.points = [];
    this.texts = [];
    this.editingShapeIds = [];

    // Nettoyer le contexte canvas si nécessaire
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Réinitialiser les flags de performance
    this._lastRedrawTime = 0;
    this._pendingRedraw = false;
  }

  createListeners() {
    this.canvas.addEventListener('click', (event) => {
      if (app.fullHistory.isRunning) return;
      const mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      if (
        app.listenerCounter.objectSelected &&
        'click' === app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      window.dispatchEvent(new CustomEvent('canvasClick'));
    });

    this.canvas.addEventListener('mousedown', (event) => {
      if (app.fullHistory.isRunning) return;
      const mousePos = this.getMousePos(event);

      let mustExitFunction = false;

      if (
        app.workspace.lastKnownMouseClickTime &&
        app.workspace.lastKnownMouseClickTime >
          event.timeStamp - GRID_CONSTANTS.DOUBLE_CLICK_THRESHOLD &&
        app.workspace.lastKnownMouseClickCoordinates.dist(mousePos) <
          GRID_CONSTANTS.MOVEMENT_THRESHOLD_MOUSE
      ) {
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: {
              message:
                "Double clic détecté, le deuxième clic n'a pas été pris en compte.",
            },
          }),
        );
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

      if (mustExitFunction) return;

      if (
        app.listenerCounter.objectSelected &&
        'mousedown' === app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      this.pressPositionForLongPress = mousePos;
      this.pressTimeoutId = window.setTimeout(
        () => window.dispatchEvent(new CustomEvent('canvasLongPress')),
        GRID_CONSTANTS.LONG_PRESS_DELAY,
      );
      window.dispatchEvent(new CustomEvent('canvasMouseDown'));
    });

    this.canvas.addEventListener('mouseup', (event) => {
      if (app.fullHistory.isRunning) return;
      const mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      window.clearTimeout(this.pressTimeoutId);
      window.dispatchEvent(new CustomEvent('canvasMouseUp'));
    });

    this.canvas.addEventListener('mousemove', (event) => {
      if (app.fullHistory.isRunning) return;
      const mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      if (
        this.pressPositionForLongPress?.dist(mousePos) >
        GRID_CONSTANTS.MOVEMENT_THRESHOLD_MOUSE
      )
        window.clearTimeout(this.pressTimeoutId);
      window.dispatchEvent(new CustomEvent('canvasMouseMove'));
    });

    this.canvas.addEventListener('mouseout', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      const mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      window.dispatchEvent(new CustomEvent('canvasMouseUp'));
    });

    const handleWheel = (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      const mousePos = new Coordinates({
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
      const detail = {
        deltaY: correctedDeltaY,
      };
      window.dispatchEvent(
        new CustomEvent('canvasMouseWheel', { detail: detail }),
      );
    };

    this.canvas.addEventListener('wheel', handleWheel);
    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      const mousePos = this.getMousePos(event);
      if (event.touches.length === 1)
        window.dispatchEvent(
          new CustomEvent('mouse-coordinates-changed', {
            detail: { mousePos: mousePos },
          }),
        );
      if (
        app.listenerCounter.objectSelected &&
        'mousedown' === app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      const detail = { touches: [] };
      for (const touch of event.touches) {
        detail.touches.push(
          new Coordinates({
            x: touch.clientX - app.settings.mainMenuWidth,
            y: touch.clientY,
          }),
        );
      }
      this.pressPositionForLongPress = mousePos;
      this.pressTimeoutId = window.setTimeout(
        () => window.dispatchEvent(new CustomEvent('canvasLongPress')),
        GRID_CONSTANTS.LONG_PRESS_DELAY,
      );
      window.dispatchEvent(new CustomEvent('canvasMouseDown'));
      window.dispatchEvent(
        new CustomEvent('canvasTouchStart', { detail: detail }),
      );
    });

    this.canvas.addEventListener(
      'touchmove',
      (event) => {
        event.preventDefault();
        if (app.fullHistory.isRunning) return;
        const mousePos = this.getMousePos(event);
        if (event.touches.length === 1)
          window.dispatchEvent(
            new CustomEvent('mouse-coordinates-changed', {
              detail: { mousePos: mousePos },
            }),
          );
        const detail = { touches: [] };
        for (const touch of event.touches) {
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
          window.dispatchEvent(
            new CustomEvent('canvasTouchEnd', { detail: detail }),
          );
          return;
        }
        if (
          this.pressPositionForLongPress?.dist(mousePos) >
          GRID_CONSTANTS.MOVEMENT_THRESHOLD_TOUCH
        )
          window.clearTimeout(this.pressTimeoutId);
        window.dispatchEvent(new CustomEvent('canvasMouseMove'));
        window.dispatchEvent(
          new CustomEvent('canvasTouchMove', { detail: detail }),
        );
      },
      false,
    );

    this.canvas.addEventListener('touchend', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      const mousePos = this.getMousePos(event);
      if (event.touches.length === 1)
        window.dispatchEvent(
          new CustomEvent('mouse-coordinates-changed', {
            detail: { mousePos: mousePos },
          }),
        );
      if (
        app.listenerCounter.objectSelected &&
        'click' === app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);
      const detail = { touches: [] };
      for (const touch of event.changedTouches) {
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
      window.dispatchEvent(
        new CustomEvent('canvasTouchEnd', { detail: detail }),
      );
    });

    this.canvas.addEventListener('touchcancel', (event) => {
      event.preventDefault();
      if (app.fullHistory.isRunning) return;
      const mousePos = this.getMousePos(event);
      window.dispatchEvent(
        new CustomEvent('mouse-coordinates-changed', {
          detail: { mousePos: mousePos },
        }),
      );
      if (
        app.listenerCounter.objectSelected &&
        'click' === app.workspace.selectionConstraints.eventType
      )
        SelectManager.selectObject(mousePos);

      const detail = { touches: [] };
      for (const touch of event.changedTouches) {
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
      window.dispatchEvent(
        new CustomEvent('canvastouchcancel', { detail: detail }),
      );
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
      console.error('Navigator not compatible - unable to get mouse position');
      let str = event.type;
      for (const property1 in event) {
        str += ' | ' + property1 + ' : ' + event[property1];
      }
      console.error('Event details:', str);

      if (event.touches) {
        str = 'touches: ' + event.touches.length + '';
        for (const property1 in event['touches'][0]) {
          str += ' | ' + property1 + ' : ' + ['touches'][0][property1];
        }
        console.error('Touch details:', str);
      }
      return null;
    }

    response = response.fromCanvasCoordinates();
    return response;
  }

  isOutsideOfCanvas(mousePos) {
    mousePos = mousePos.toCanvasCoordinates();
    if (mousePos.x < 0 || mousePos.y < 0) return true;
    if (mousePos.x > app.canvasWidth || mousePos.y > app.canvasHeight)
      return true;
    if (app.workspace.limited && mousePos.x > app.canvasWidth / 2 - 16)
      return true;
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
    if (
      typeof zoomLevel !== 'number' ||
      !isFinite(zoomLevel) ||
      zoomLevel <= 0
    ) {
      zoomLevel = 1.0;
    }

    const gridSize = gridState.gridSize; // in cm
    const baseGridStep = gridSize * GRID_CONSTANTS.PIXELS_PER_CM; // Pas de grille en espace monde

    // Utiliser la même transformation que toCanvasCoordinates pour la cohérence
    const translateOffset =
      app.workspace.translateOffset || new Coordinates({ x: 0, y: 0 });
    const offsetX =
      translateOffset && typeof translateOffset.x === 'number'
        ? translateOffset.x
        : 0;
    const offsetY =
      translateOffset && typeof translateOffset.y === 'number'
        ? translateOffset.y
        : 0;

    const pointRadius = 2 * zoomLevel;

    ctx.fillStyle = gridState.gridColor || '#888888';

    const drawPointAt = (worldX, worldY) => {
      // Appliquer la même transformation que toCanvasCoordinates()
      const canvasX = worldX * zoomLevel + offsetX;
      const canvasY = worldY * zoomLevel + offsetY;

      // Vérifier que le point est visible sur le canvas
      if (
        canvasX >= -pointRadius &&
        canvasX <= canvasWidth + pointRadius &&
        canvasY >= -pointRadius &&
        canvasY <= canvasHeight + pointRadius
      ) {
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, pointRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    // Calculer la zone visible en espace monde pour optimiser le rendu
    const worldVisibleLeft = -offsetX / zoomLevel;
    const worldVisibleTop = -offsetY / zoomLevel;
    const worldVisibleRight = (canvasWidth - offsetX) / zoomLevel;
    const worldVisibleBottom = (canvasHeight - offsetY) / zoomLevel;

    if (gridState.gridType === 'square') {
      const startX = Math.floor(worldVisibleLeft / baseGridStep) * baseGridStep;
      const startY = Math.floor(worldVisibleTop / baseGridStep) * baseGridStep;

      for (
        let x = startX;
        x <= worldVisibleRight + baseGridStep;
        x += baseGridStep
      ) {
        for (
          let y = startY;
          y <= worldVisibleBottom + baseGridStep;
          y += baseGridStep
        ) {
          drawPointAt(x, y);
        }
      }
    } else if (gridState.gridType === 'vertical-lines') {
      const startX = Math.floor(worldVisibleLeft / baseGridStep) * baseGridStep;
      const startY = Math.floor(worldVisibleTop / baseGridStep) * baseGridStep;

      for (
        let y = startY;
        y <= worldVisibleBottom + baseGridStep;
        y += baseGridStep
      ) {
        drawPointAt(startX, y);
      }
    } else if (gridState.gridType === 'horizontal-lines') {
      const startX = Math.floor(worldVisibleLeft / baseGridStep) * baseGridStep;
      const startY = Math.floor(worldVisibleTop / baseGridStep) * baseGridStep;

      for (
        let x = startX;
        x <= worldVisibleRight + baseGridStep;
        x += baseGridStep
      ) {
        drawPointAt(x, startY);
      }
    } else if (gridState.gridType === 'horizontal-triangle') {
      const triangleHeight = baseGridStep * (Math.sqrt(3) / 2);
      const startY =
        Math.floor(worldVisibleTop / triangleHeight) * triangleHeight;

      for (
        let y = startY, row = Math.floor(startY / triangleHeight);
        y <= worldVisibleBottom + triangleHeight;
        y += triangleHeight, row++
      ) {
        const offsetX = row % 2 === 0 ? 0 : baseGridStep / 2;
        const startX =
          Math.floor((worldVisibleLeft - offsetX) / baseGridStep) *
            baseGridStep +
          offsetX;

        for (
          let x = startX;
          x <= worldVisibleRight + baseGridStep;
          x += baseGridStep
        ) {
          drawPointAt(x, y);
        }
      }
    } else if (gridState.gridType === 'vertical-triangle') {
      const horizontalStep = baseGridStep * (Math.sqrt(3) / 2);
      const startX =
        Math.floor(worldVisibleLeft / horizontalStep) * horizontalStep;

      for (
        let x = startX, col = Math.floor(startX / horizontalStep);
        x <= worldVisibleRight + horizontalStep;
        x += horizontalStep, col++
      ) {
        const offsetY = col % 2 === 0 ? 0 : baseGridStep / 2;
        const startY =
          Math.floor((worldVisibleTop - offsetY) / baseGridStep) *
            baseGridStep +
          offsetY;

        for (
          let y = startY;
          y <= worldVisibleBottom + baseGridStep;
          y += baseGridStep
        ) {
          drawPointAt(x, y);
        }
      }
    }
  }

  /**
   * Récupère le point de la grille le plus proche d'une coordonnée donnée
   * @param { Coordinates } checkingCoordinates Les coordonnées en espace canvas
   * @return { Coordinates | undefined } Les coordonnées du point de la grille le plus proche en espace canvas ou undefined
   * @example
   * const closestPoint = canvas.getClosestGridPoint(new Coordinates({ x: 100, y: 200 }));
   * if (closestPoint) {
   *   // Utiliser le point pour snapper
   * }
   */
  getClosestGridPoint(checkingCoordinates) {
    if (
      !checkingCoordinates ||
      typeof checkingCoordinates.x !== 'number' ||
      typeof checkingCoordinates.y !== 'number' ||
      !isFinite(checkingCoordinates.x) ||
      !isFinite(checkingCoordinates.y)
    ) {
      // console.warn("getClosestGridPoint: checkingCoordinates are invalid", checkingCoordinates);
      return undefined;
    }

    const gridState = gridStore.getState();
    if (!gridState.isVisible || gridState.gridType === 'none') {
      return undefined;
    }

    let zoomLevel = app.workspace.zoomLevel;
    if (
      typeof zoomLevel !== 'number' ||
      !isFinite(zoomLevel) ||
      zoomLevel <= 0
    ) {
      // console.warn("getClosestGridPoint: Invalid app.workspace.zoomLevel, defaulting to 1.0. Value:", zoomLevel);
      zoomLevel = 1.0;
    }

    const gridSize = gridState.gridSize; // en cm
    const baseGridStep = gridSize * GRID_CONSTANTS.PIXELS_PER_CM; // Pas de grille en espace monde

    // Convertir les coordonnées canvas en coordonnées monde (inverse de toCanvasCoordinates)
    const translateOffset =
      app.workspace.translateOffset || new Coordinates({ x: 0, y: 0 });
    const offsetX =
      translateOffset && typeof translateOffset.x === 'number'
        ? translateOffset.x
        : 0;
    const offsetY =
      translateOffset && typeof translateOffset.y === 'number'
        ? translateOffset.y
        : 0;

    const worldX = (checkingCoordinates.x - offsetX) / zoomLevel;
    const worldY = (checkingCoordinates.y - offsetY) / zoomLevel;

    // Calcul direct du point de grille le plus proche en espace monde
    let gridWorldX, gridWorldY;

    if (gridState.gridType === 'square') {
      gridWorldX = Math.round(worldX / baseGridStep) * baseGridStep;
      gridWorldY = Math.round(worldY / baseGridStep) * baseGridStep;
    } else if (gridState.gridType === 'vertical-lines') {
      gridWorldX = Math.round(worldX / baseGridStep) * baseGridStep;
      gridWorldY = worldY; // Pas de contrainte sur Y
    } else if (gridState.gridType === 'horizontal-lines') {
      gridWorldX = worldX; // Pas de contrainte sur X
      gridWorldY = Math.round(worldY / baseGridStep) * baseGridStep;
    } else if (gridState.gridType === 'horizontal-triangle') {
      // Grille triangulaire verticale
      const triangleHeight = baseGridStep * (Math.sqrt(3) / 2);

      // Trouver la rangée la plus proche
      const row = Math.round(worldY / triangleHeight);
      gridWorldY = row * triangleHeight;

      // Calculer le décalage X pour cette rangée
      const offsetX = row % 2 === 0 ? 0 : baseGridStep / 2;

      // Trouver la colonne la plus proche en tenant compte du décalage
      const adjustedX = worldX - offsetX;
      const col = Math.round(adjustedX / baseGridStep);
      gridWorldX = col * baseGridStep + offsetX;
    } else if (gridState.gridType === 'vertical-triangle') {
      // Grille triangulaire horizontale
      const horizontalStep = baseGridStep * (Math.sqrt(3) / 2);

      // Trouver la colonne la plus proche
      const col = Math.round(worldX / horizontalStep);
      gridWorldX = col * horizontalStep;

      // Calculer le décalage Y pour cette colonne
      const offsetY = col % 2 === 0 ? 0 : baseGridStep / 2;

      // Trouver la rangée la plus proche en tenant compte du décalage
      const adjustedY = worldY - offsetY;
      const row = Math.round(adjustedY / baseGridStep);
      gridWorldY = row * baseGridStep + offsetY;
    } else {
      return undefined; // Type de grille non supporté
    }

    // Convertir le résultat de l'espace monde vers l'espace canvas (comme toCanvasCoordinates)
    const canvasX = gridWorldX * zoomLevel + offsetX;
    const canvasY = gridWorldY * zoomLevel + offsetY;

    return new Coordinates({ x: canvasX, y: canvasY });
  }

  updateVisiblePart(forced = false) {
    if (!this.canvas) return;

    // Validate scale
    if (
      typeof this.scale !== 'number' ||
      !isFinite(this.scale) ||
      this.scale <= 0.00001
    ) {
      this.scale = 1.0;
    }

    // Validate canvas dimensions
    const canvasWidth =
      typeof this.canvas.width === 'number' && isFinite(this.canvas.width)
        ? this.canvas.width
        : 0;
    const canvasHeight =
      typeof this.canvas.height === 'number' && isFinite(this.canvas.height)
        ? this.canvas.height
        : 0;

    const newX = Math.floor(this.xOffset / this.scale);
    const newY = Math.floor(this.yOffset / this.scale);
    const newWidth = Math.ceil(canvasWidth / this.scale);
    const newHeight = Math.ceil(canvasHeight / this.scale);

    // Only update if there is a change or if forced
    if (
      forced ||
      this.canvasVisibleLeft !== newX ||
      this.canvasVisibleTop !== newY ||
      this.canvasVisibleWidth !== newWidth ||
      this.canvasVisibleHeight !== newHeight
    ) {
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
      const canvasPattern = document.createElement('canvas');
      canvasPattern.width = 10;
      canvasPattern.height = 10;
      const contextPattern = canvasPattern.getContext('2d');
      const path = new Path2D(
        `M 5 0 L 10 5 L 10 10 L 0 0 L 5 0 M 0 5 L 5 10 L 0 10 L 0 5`,
      );
      contextPattern.fillStyle = this.ctx.fillStyle;
      contextPattern.fill(path);

      const pattern = this.ctx.createPattern(canvasPattern, 'repeat');
      canvasPattern.remove();

      this.ctx.fillStyle = pattern;
    }
    this.ctx.fill(path, 'nonzero');

    path = new Path2D(shape.getSVGPath(pathScaleMethod, true, true));
    this.ctx.globalAlpha = 1;

    if (shape.drawHidden) {
      this.ctx.setLineDash([5, 15]);
    }
    if (shape.segments.some((seg) => seg.color !== undefined)) {
      shape.segments.forEach((seg) => {
        const path = new Path2D(seg.getSVGPath(pathScaleMethod, true));
        this.ctx.strokeStyle = seg.color ? seg.color : shape.strokeColor;
        if (seg.width !== 1) this.ctx.lineWidth = seg.width;
        this.ctx.stroke(path);
        this.ctx.lineWidth = shape.strokeWidth;
      });
    } else this.ctx.stroke(path);
    this.ctx.setLineDash([]);
  }

  drawPoint(point, justForAgrumentCount, doSave = true) {
    if (point.geometryIsVisible === false || point.geometryIsHidden === true)
      return;
    if (doSave) this.ctx.save();

    this.ctx.fillStyle = point.color;
    this.ctx.globalAlpha = 1;

    const canvasCoordinates = point.coordinates.toCanvasCoordinates();
    this.ctx.beginPath();
    this.ctx.arc(
      canvasCoordinates.x,
      canvasCoordinates.y,
      point.size * 2, // Coordonnées déjà converties par toCanvasCoordinates()
      0,
      2 * Math.PI,
      0,
    );
    this.ctx.closePath();
    this.ctx.fill();

    if (doSave) this.ctx.restore();
  }

  drawText(text, doSave = true) {
    if (doSave) this.ctx.save();

    const fontSize = 20;
    let position = text.coordinates.add({
      x:
        (((-3 * fontSize) / 13) * text.message.length) /
        app.workspace.zoomLevel,
      y: fontSize / 2 / app.workspace.zoomLevel,
    });
    position = position.toCanvasCoordinates();

    this.ctx.fillStyle = text.color;
    this.ctx.font = fontSize + 'px Arial';
    this.ctx.fillText(text.message, position.x, position.y);

    if (doSave) this.ctx.restore();
  }
}
customElements.define('canvas-layer', CanvasLayer);
