import { html } from 'lit';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Bounds } from '../Core/Objects/Bounds';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Segment } from '../Core/Objects/Segment';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Silhouette } from '../Core/Objects/Silhouette';
import { Tool } from '../Core/States/Tool';
import { findObjectsByName, removeObjectById } from '../Core/Tools/general';
import { TangramManager } from './TangramManager';

export class SolutionCheckerTool extends Tool {
  constructor() {
    super('solveChecker', 'Vérifier la solution d\'un Tangram', '');

    this.solutionShapeIds = [];

    window.addEventListener('file-parsed', async (e) => {
      TangramManager.closeForbiddenCanvas();
      app.tangramCanvasLayer.removeAllObjects();
      const data = e.detail;
      const level = await TangramManager.selectLevel(data.tangramLevelSelected);
      if (data.fileExtension == 'ags')
        await TangramManager.initShapes();
      if (level == 3 || level == 4) {
        await TangramManager.openForbiddenCanvas();
      }
      let backObjects = data.wsdata.backObjects,
        isSilhouetteShown = false;
      if (backObjects) {
        Silhouette.initFromObject(backObjects, level);
        app.tangramCanvasLayer.redraw();
        isSilhouetteShown = true;
      }
      setState({
        history: {
          ...app.history,
          startSituation: {
            ...app.history.startSituation,
            objects: app.mainCanvasLayer.saveData(),
            backObjects: app.tangramCanvasLayer.saveData(),
          },
        },
        tangram: {...app.defaultState.tangram, isSilhouetteShown, level },
        tool: { name: this.name, currentStep: 'start' }
      });
      let solutionShapes = findObjectsByName(
        'tangramChecker',
        'main'
      );
      if (solutionShapes.length > 1) {
        this.solutionShapeIds = solutionShapes.map(s => s.id);
        setState({ tangram: {
          ...app.tangram,
          buttonText: 'Annuler la vérification',
          buttonValue: 'uncheck',
        }})
      }
    });
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

  start() {
    this.showStateMenu();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.addEventListener('tangram-changed', this.handler);
    window.addEventListener('new-window', this.handler);
  }

  check() {
    this.checkSolution();
    setState({
      tangram: {
        buttonText: 'Annuler la vérification',
        buttonValue: 'uncheck',
      },
      tool: { name: 'verifySolution', title: 'Vérifier la solution', currentStep: 'start' }
    });
    window.dispatchEvent(
      new CustomEvent('actions-executed', {
        detail: { name: 'Vérifier la solution' },
      }),
    );
  }

  uncheck() {
    this.eraseSolution();
    setState({
      tangram: {
        buttonText: 'Vérifier la solution',
        buttonValue: 'check',
      }
    });
  }

  end() {
    TangramManager.closeForbiddenCanvas();
    this.removeListeners();
  }

  eventHandler(event) {
    if (event.type == 'tool-changed') {
      if (app.tool?.name == this.name) {
        this[app.tool.currentStep]();
      } else if (app.tool?.currentStep == 'start') {
        if (app.tool.name == 'createSilhouette') {
          this.end();
        } else if (
          app.tool.name != 'rotate' &&
          app.tool.name != 'rotate45' &&
          app.tool.name != 'move' &&
          app.tool.name != 'solveChecker' &&
          app.tool.name != 'verifySolution'
        ) {
          setState({ tangram: { ...app.tangram, currentStep: 'uncheck' }});
        }
      }
    } else if (event.type == 'tangram-changed') {
      if (['check', 'uncheck'].includes(app.tangram.currentStep)) {
        this[app.tangram.currentStep]();
      }
      if (app.tangram.buttonValue == "check" || app.tangram.buttonValue == "uncheck") {
        if (!document.querySelector('state-menu')) {
          import('./state-menu');
          const stateMenu = document.createElement('state-menu');
          document.querySelector('body').appendChild(stateMenu);
        }
      }
    } else if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'new-window') {
      this.end();
    }
  }

  removeListeners() {
    app.removeListener('objectSelected', this.objectSelectedId);
    window.removeEventListener('tangram-changed', this.handler);
    window.removeEventListener('new-window', this.handler);
  }

  objectSelected(object) {
    let index = this.solutionShapeIds.findIndex((id) => object.id == id);
    if (index == -1) {
      setState({ tangram: { ...app.tangram, currentStep: 'uncheck' }})
    }
  }

  showStateMenu() {
    setState({
      tangram: {
        ...app.tangram,
        buttonText: 'Vérifier la solution',
        buttonValue: 'check',
      }
    });
  }

  eraseSolution() {
    let solutionShapes = findObjectsByName(
      'tangramChecker',
      'main'
    );

    if (solutionShapes.length > 1) {
      let group = GroupManager.getShapeGroup(solutionShapes[0]);
      GroupManager.deleteGroup(group);
    }
    solutionShapes.forEach((s) =>
      removeObjectById(s.id),
    );
    this.solutionShapeIds = [];
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  checkSolution() {
    this.solutionShapeIds = [];

    let segmentsList = this.checkGroupMerge(
      app.tangramCanvasLayer.shapes,
    );

    let paths = this.linkNewSegments(segmentsList);

    let shapes = [];

    paths.forEach((path) => {
      let shape = new RegularShape({
        layer: 'main',
        path: path,
        color: '#000',
        fillOpacity: 0,
        strokeColor: '#00D084',
        strokeSize: 2,
        isPointed: false,
        name: 'tangramChecker',
      });
      // shape.cleanSameDirectionSegment();
      let translateOffset = new Coordinates({
        x: -app.canvasWidth / 2,
        y: 0,
      }).multiply(1 / app.workspace.zoomLevel);
      shape.translate(translateOffset);
      this.solutionShapeIds.push(shape.id);
      shapes.push(shape);
    });

    let areShapeScaled =
      app.tangramCanvasLayer.shapes[0].size == 0.6;
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

    if (this.solutionShapeIds.length > 1) {
      let userGroup = new ShapeGroup(0, 1);
      userGroup.shapesIds = [...this.solutionShapeIds];
      GroupManager.addGroup(userGroup);
    }

    window.dispatchEvent(new CustomEvent('refresh'));
  }

  checkGroupMerge(shapes) {
    let oldSegments = shapes
      .map((s) =>
        s.segments.map((seg) => {
          return new Segment({
            layer: 'invisible',
            createFromNothing: true,
            vertexCoordinates: seg.vertexes.map((vx) => vx.coordinates),
          });
        }),
      )
      .flat();

    let cutSegments = oldSegments
      .map((segment, idx, segments) => {
        let vertexesInside = segments
          .filter((seg, i) => i != idx)
          .map((seg) =>
            seg.vertexes.filter(
              (vertex) =>
                segment.isCoordinatesOnSegment(vertex.coordinates) &&
                !segment.vertexes.some((vert) =>
                  vert.coordinates.equal(vertex.coordinates),
                ),
            ),
          )
          .flat()
          .filter(
            (vertex, idx, vertexes) =>
              vertexes.findIndex((v) =>
                v.coordinates.equal(vertex.coordinates),
              ) == idx,
          );
        if (vertexesInside.length) return segment.divideWith(vertexesInside);
        else return segment;
      })
      .flat();

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
      paths[numberOfPathCreated].push(
        'M',
        startCoordinates.x,
        startCoordinates.y,
      );

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
