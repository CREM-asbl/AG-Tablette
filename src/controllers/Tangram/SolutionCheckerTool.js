import { html } from 'lit';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Bounds } from '../Core/Objects/Bounds';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Segment } from '../Core/Objects/Segment';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { Silhouette } from './Silhouette';
import { TangramManager } from './TangramManager';

export class SolutionCheckerTool extends Tool {
  constructor() {
    super('solveChecker', 'Vérifier la solution d\'un Tangram', '');
    window.addEventListener('file-parsed', this.handler)
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Vous pouvez réaliser le puzzle et vérifier votre solution en appuyant
        sur le bouton "Vérifier la solution".<br />
        Le contour de la silhouette apparait et peut se superposer avec les figures.
      </p>
    `;
  }

  showMenu() {
    this.stateMenu = app.left_menu.querySelector('state-menu')
    if (!this.stateMenu) {
      import('./state-menu');
      this.stateMenu = document.createElement('state-menu');
      app.left_menu.appendChild(this.stateMenu)
    }
  }

  async initData() {
    const level = this.data.tangramLevelSelected ? this.data.tangramLevelSelected : await TangramManager.selectLevel();
    if (this.data.fileExtension == 'ags') await TangramManager.initShapes();
    const backObjects = this.data.wsdata.backObjects
    let isSilhouetteShown = false;
    if (backObjects) {
      if (level == 3 || level == 4) {
        app.workspace.limited = true;
        app.tangramCanvasLayer.style = `left:50%; background-color: rgba(255, 0, 0, 0.2); z-index: 10;`
      }
      const silhouette = new Silhouette(backObjects.shapesData, true, level)
      console.log(Math.ceil(silhouette.minX), Math.ceil(silhouette.maxX), Math.ceil(silhouette.minY), Math.ceil(silhouette.maxY))
      console.log(silhouette.maxX - silhouette.minX, silhouette.maxY - silhouette.minY)
      console.log(silhouette.largeur, silhouette.hauteur)
      app.workspace.setZoomLevel(.5)
      app.tangramCanvasLayer.draw();
      isSilhouetteShown = true;
    }

    let tool = app.tools.find(tool => tool.name == 'translate');
    tool.isDisable = true;
    tool = app.tools.find(tool => tool.name == 'color');
    tool.isDisable = false;

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
  }

  start() {
    this.initData()
    this.showMenu()
    this.solutionShapes = null
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.addEventListener('tangram-changed', this.handler);
    window.addEventListener('new-window', this.handler);
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

  uncheck() {
    this.eraseSolution();
  }

  end() {
    if (this.stateMenu) this.stateMenu.close()
    closeForbiddenCanvas();
    this.removeListeners();
  }

  eventHandler(event) {
    if (this.stateMenu)
      this.stateMenu.check = app.tangram.currentStep === 'check'

    if (event.type == 'tool-updated') {
      if (app.tool?.name == this.name) { this[app.tool.currentStep](); }
      else if (app.tool?.currentStep == 'start') {
        if (app.tool.name == 'createSilhouette') {
          this.end();
        } else if (
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

    if (event.type == 'tangram-changed') {
      if (['check', 'uncheck'].includes(app.tangram.currentStep)) {
        this[app.tangram.currentStep]();
      }
    }

    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    }

    if (event.type == 'new-window') this.end();

    if (event.type == 'file-parsed') {
      const data = event.detail;
      closeForbiddenCanvas();
      app.tangramCanvasLayer.removeAllObjects();
      if (data.envName != 'Tangram') return
      this.data = data;
      this.start();
    }
  }

  removeListeners() {
    app.removeListener('objectSelected', this.objectSelectedId);
    window.removeEventListener('tangram-changed', this.handler);
    window.removeEventListener('new-window', this.handler);
  }

  objectSelected(object) {
    let solutionShapes = app.mainCanvasLayer.shapes.filter(shape => shape.name == "tangramChecker");
    let index = solutionShapes.findIndex((s) => object.id == s.id);
    if (index == -1) {
      setState({ tangram: { ...app.tangram, currentStep: 'uncheck' } })
    }
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
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  get solution() {
    let segmentsList = this.checkGroupMerge(app.tangramCanvasLayer.shapes);
    let paths = this.linkNewSegments(segmentsList);
    const shapes = [];

    paths.forEach((path) => {
      let shape = new RegularShape({
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
      // let translateOffset = new Coordinates({
      //   x: -app.canvasWidth / 2,
      //   y: -app.canvasHeight / 4,
      // }).multiply(1 / app.workspace.zoomLevel);
      // shape.translate(translateOffset);
      shapes.push(shape);
    });

    let areShapeScaled = app.tangramCanvasLayer.shapes[0].size == 0.6;
    if (areShapeScaled) {
      let silhouetteBounds = Bounds.getOuterBounds(
        ...shapes.map((s) => s.bounds),
      );
      let center = new Coordinates({
        x: (silhouetteBounds.maxX + silhouetteBounds.minX) / 2,
        y: (silhouetteBounds.maxY + silhouetteBounds.minY) / 2,
      });
      shapes.forEach((s) => s.homothety(10 / 6, center));
    }

    if (shapes.length > 1) {
      let userGroup = new ShapeGroup(0, 1);
      userGroup.shapesIds = shapes.map(s => s.id);
      GroupManager.addGroup(userGroup);
    }

    // shapes.forEach(shape => shape.scale(.5))
    return shapes
  }

  checkGroupMerge(shapes) {
    let oldSegments = shapes
      .flatMap((s) =>
        s.segments.map((seg) => {
          return new Segment({
            layer: 'invisible',
            createFromNothing: true,
            vertexCoordinates: seg.points.map((vx) => vx.coordinates),
          });
        }),
      );

    let cutSegments = oldSegments
      .flatMap((segment, idx, segments) => {
        let vertexesInside = segments
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
    let newSegments = [];
    cutSegments.forEach((seg, i, segments) => {
      if (seg.used) return;
      let segs = segments
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
    let numberOfSegments = segmentsList.length;
    let numberOfPathCreated = 0;

    while (segmentUsed != numberOfSegments) {
      let startCoordinates = segmentsList[0].vertexes[0].coordinates;
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
        let nextSegment = segmentsList[nextSegmentIndex];
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
      let centerCoordinates = segment.arcCenter.coordinates;
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

export const closeForbiddenCanvas = () => {
  app.workspace.limited = true
  // app.forbiddenCanvasLeft = null
  app.tangramCanvasLayer.style.backgroundColor = 'transparent'
  app.tangramCanvasLayer.style.zIndex = 0
}