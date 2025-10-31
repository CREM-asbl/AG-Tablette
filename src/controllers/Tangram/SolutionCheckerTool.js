import { html, LitElement } from 'lit';
import { tools } from '../../store/tools';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Bounds } from '../Core/Objects/Bounds';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Segment } from '../Core/Objects/Segment';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { createElem } from '../Core/Tools/general.js';
import { Silhouette } from './Silhouette';
import { TangramManager } from './TangramManager';

export const closeForbiddenCanvas = () => {
  app.workspace.limited = false
  app.tangramCanvasLayer.style.backgroundColor = 'transparent'
  app.tangramCanvasLayer.style.zIndex = 0
}

export class SolutionCheckerTool extends LitElement {

  static properties = {
    data: { type: Object }
  }

  render() {
    
    if (!this.data) return this.renderOpenPopup();
    closeForbiddenCanvas()
    app.tangramCanvasLayer.removeAllObjects();
    this.eraseSolution()
    this.solutionShapes = null
    this.initData(this.data)
  }

  renderOpenPopup() {
    import('@components/popups/open-popup');
    return html`<open-popup></open-popup>`
  }

  showMenu() {
    this.stateMenu = app.left_menu.querySelector('state-menu');
    if (!this.stateMenu) {
      import('./state-menu');
      this.stateMenu = document.createElement('state-menu');
      app.left_menu.appendChild(this.stateMenu)
    }
  }

  static async selectLevel() {
    await import('./level-popup.js');
    const popup = createElem('level-popup');
    return new Promise((resolve) => popup.onselect = e => resolve(e.detail))
  }

  async initData(data) {
    const level = data.tangramLevelSelected || await SolutionCheckerTool.selectLevel();
    if (data.fileExtension == 'ags') await TangramManager.initShapes();

    // Chercher les backObjects dans différents emplacements possibles
    const backObjects = data.wsdata?.backObjects ||
      data.workspaceData?.backObjects ||
      app.workspace?.data?.backObjects;

    if (!backObjects) {
      console.warn('⚠️ SolutionCheckerTool: Aucun backObjects trouvé dans les données');
    }

    let isSilhouetteShown = false;

    if (backObjects) {
      isSilhouetteShown = true;

      if (level == 3 || level == 4) {
        app.workspace.limited = true;
        app.tangramCanvasLayer.style = `left:50%; background-color: rgba(255, 0, 0, 0.2); z-index: 10;`;
      }

      const silhouette = new Silhouette(backObjects.shapesData, true, level);

      if (data.fileExtension != 'agt') {
        if (level > 4) { silhouette.scale(0.6); }
        silhouette.translate({ x: -silhouette.bounds.minX, y: (app.canvasHeight / 2) - silhouette.center.y });
        const tangramCanvasLayerWidth = app.canvasWidth / 2;
        if (silhouette.largeur > tangramCanvasLayerWidth) {
          silhouette.translate({ x: 16, y: 0 });
          app.workspace.setZoomLevel(app.workspace.zoomLevel * (app.canvasWidth / (2 * (silhouette.largeur + 32))));
        }
        else {
          const diff = (tangramCanvasLayerWidth - silhouette.largeur) / 2;
          silhouette.translate({ x: diff / app.workspace.zoomLevel, y: 0 });
        }
      }
      app.tangramCanvasLayer.draw();
    }
    const currentTools = tools.get()
    currentTools.find(tool => tool.name == 'translate').isDisable = true;
    currentTools.find(tool => tool.name == 'color').isDisable = false;
    tools.set([...currentTools]);
    setState({
      tangram: { ...app.defaultState.tangram, isSilhouetteShown, level },
    });

    if (app.history.startSituation == null) {
      setState({
        history: {
          ...app.defaultState.history,
          startSituation: {
            ...app.workspace.data,
            tangram: {
              isSilhouetteShown: true,
              currentStep: 'start'
            }
          },
          startSettings: { ...app.settings },
        },
      });
    }
    this.showMenu();
  }

  connectedCallback() {
    super.connectedCallback();
    this.tangramListener = app.addListener('tangram-changed', this.handler.bind(this));
    this.objectSelectedId = app.addListener('objectSelected', this.handler.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stateMenu.close();
    closeForbiddenCanvas();
    app.removeListener('objectSelected', this.objectSelectedId);
    app.removeListener('tangram-changed', this.tangramListener);
  }

  check() {
    this.checkSolution();
    setState({
      tool: { name: 'verifySolution', title: 'Vérifier la solution', currentStep: 'start' }
    });
    window.dispatchEvent(
      new CustomEvent('actions-executed', { detail: { name: 'Vérifier la solution' } })
    );
  }

  uncheck() { this.eraseSolution(); }

  handler(event) {
    if (this.stateMenu)
      this.stateMenu.check = app.tangram.currentStep === 'check'

    if (event.type == 'tool-updated') {
      if (app.tool?.name == this.name) { this[app.tool.currentStep](); }
      else if (app.tool?.currentStep == 'start') {
        if (
          app.tool.name != 'rotate' &&
          app.tool.name != 'rotate45' &&
          app.tool.name != 'move' &&
          app.tool.name != 'solveChecker' &&
          app.tool.name != 'verifySolution'
        ) {
          setState({ tangram: { ...app.tangram, currentStep: 'uncheck' } });
        }
      }
    }

    if (event.type == 'tangram-changed' &&
      ['check', 'uncheck'].includes(app.tangram.currentStep) &&
      !app.fullHistory.isRunning) {
      this[app.tangram.currentStep]();
    }

    if (event.type == 'objectSelected') this.objectSelected(event.detail.object);
  }

  objectSelected(object) {
    const solutionShapes = app.mainCanvasLayer.shapes.filter(shape => shape.name == "tangramChecker");
    const index = solutionShapes.findIndex((s) => object.id == s.id);
    if (index == -1) setState({ tangram: { ...app.tangram, currentStep: 'uncheck' } })
  }

  eraseSolution() {
    app.mainCanvasLayer.shapes = app.mainCanvasLayer.shapes.filter(shape => shape.name != 'tangramChecker')
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  checkSolution() {
    if (this.solutionShapes)
      this.solutionShapes.forEach(shape => app.mainCanvasLayer.shapes.push(shape))
    else
      this.solutionShapes = this.solution
  }

  get solution() {
    const segmentsList = this.checkGroupMerge(app.tangramCanvasLayer.shapes);
    const paths = this.linkNewSegments(segmentsList);
    const shapes = [];

    paths.forEach((path) => {
      const shape = new RegularShape({
        layer: 'main',
        path: path,
        color: '#000',
        fillOpacity: 0,
        strokeColor: '#00D084',
        strokeWidth: 3,
        isPointed: false,
        name: 'tangramChecker',
      });
      shape.cleanSameDirectionSegment();
      shapes.push(shape);
    });

    if (app.tangram.level > 4) {
      const silhouetteBounds = Bounds.getOuterBounds(
        ...shapes.map((s) => s.bounds),
      );
      const center = new Coordinates({
        x: (silhouetteBounds.maxX + silhouetteBounds.minX) / 2,
        y: (silhouetteBounds.maxY + silhouetteBounds.minY) / 2,
      });
      shapes.forEach((s) => s.homothety(10 / 6, center));
    }

    if (shapes.length > 1) {
      const userGroup = new ShapeGroup(0, 1);
      userGroup.shapesIds = shapes.map(s => s.id);
      GroupManager.addGroup(userGroup);
    }
    return shapes
  }

  checkGroupMerge(shapes) {
    const oldSegments = shapes
      .flatMap((s) =>
        s.segments.map((seg) => {
          return new Segment({
            layer: 'invisible',
            createFromNothing: true,
            vertexCoordinates: seg.points.map((vx) => vx.coordinates),
          });
        }),
      );

    const cutSegments = oldSegments
      .flatMap((segment, idx, segments) => {
        const vertexesInside = segments
          .filter((seg, i) => i != idx)
          .flatMap((seg) =>
            seg.vertexes.filter((vertex) =>
              segment.isCoordinatesOnSegment(vertex.coordinates) &&
              !segment.vertexes.some((vert) =>
                vert.coordinates.equal(vertex.coordinates),
              )
            )
          )
          .filter((vertex, idx, vertexes) =>
            vertexes.findIndex((v) =>
              v.coordinates.equal(vertex.coordinates),
            ) == idx,
          );
        if (vertexesInside.length) return segment.divideWith(vertexesInside);
        else return segment;
      })

    // delete common segments
    const newSegments = [];
    cutSegments.forEach((seg, i, segments) => {
      if (seg.used) return;
      const segs = segments
        .map((segment) => (segment.equal(seg) ? segment : undefined))
        .filter(Boolean);
      if (segs.length == 1) newSegments.push(seg);
      else segs.forEach((seg) => (seg.used = true));
    });
    app.invisibleCanvasLayer.shapes = []
    return newSegments;
  }

  linkNewSegments(segmentsList) {
    let paths = [];
    let segmentUsed = 0;
    const numberOfSegments = segmentsList.length;
    let numberOfPathCreated = 0;

    while (segmentUsed != numberOfSegments) {
      const startCoordinates = segmentsList[0].vertexes[0].coordinates;
      paths.push([]);
      paths[numberOfPathCreated].push('M', startCoordinates.x, startCoordinates.y);
      let nextSegmentIndex = 0;
      this.addPathElem(paths[numberOfPathCreated], segmentsList[0]);
      this.lastUsedCoordinates = segmentsList[0].vertexes[1].coordinates;
      segmentsList.splice(nextSegmentIndex, 1);
      segmentUsed++;

      while (!this.lastUsedCoordinates.equal(startCoordinates)) {
        const potentialSegmentIdx = segmentsList
          .map((seg, idx) =>
            seg.contains(this.lastUsedCoordinates, false) ? idx : undefined,
          )
          .filter((seg) => Number.isInteger(seg));
        if (potentialSegmentIdx.length == 0) {
          console.info('shape cannot be closed (dead end)');
          return null;
        }
        nextSegmentIndex = potentialSegmentIdx[0];
        const nextSegment = segmentsList[nextSegmentIndex];
        let mustReverse = false;
        if (
          !nextSegment.vertexes[0].coordinates.equal(this.lastUsedCoordinates)
        ) {
          mustReverse = true;
        }
        this.addPathElem(paths[numberOfPathCreated], nextSegment, mustReverse);
        segmentsList.splice(nextSegmentIndex, 1);
        segmentUsed++;
      }
      numberOfPathCreated++;
    }

    paths = paths.map((path) => path.join(' '));

    return paths;
  }

  addPathElem(path, segment, mustReverse) {
    let firstCoord = segment.vertexes[0].coordinates;
    let secondCoord = segment.vertexes[1].coordinates;
    if (mustReverse) [firstCoord, secondCoord] = [secondCoord, firstCoord];
    this.lastUsedCoordinates = secondCoord;
    if (!segment.isArc()) {
      path.push('L', secondCoord.x, secondCoord.y);
    } else {
      const centerCoordinates = segment.arcCenter.coordinates;
      let radius = centerCoordinates.dist(secondCoord),
        firstAngle = centerCoordinates.angleWith(firstCoord),
        secondAngle = centerCoordinates.angleWith(secondCoord);

      if (secondAngle < firstAngle) secondAngle += 2 * Math.PI;
      let largeArcFlag = secondAngle - firstAngle > Math.PI ? 1 : 0,
        sweepFlag = 1;
      if (segment.counterclockwise) {
        sweepFlag = Math.abs(sweepFlag - 1);
        largeArcFlag = Math.abs(largeArcFlag - 1);
      }
      path.push(
        'A',
        radius,
        radius,
        0,
        largeArcFlag,
        sweepFlag,
        secondCoord.x,
        secondCoord.y,
      );
    }
  }
}
customElements.define('solution-checker-tool', SolutionCheckerTool);