import { html } from 'lit';
import { app, setState } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Tool } from '../Core/States/Tool';
import { findObjectById } from '../Core/Tools/general';

/**
 * Découper une figure
 */
export class CutTool extends Tool {
  constructor() {
    super('cut', 'Découper', 'operation');

    // listen-canvas-click -> select-second-point -> select-third-point -> showing-points
    this.currentStep = null;

    this.timeoutRef = null;

    this.drawColor = '#E90CC8';
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
        Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil permet de
        découper une figure en deux nouvelles figures, tout en laissant la figure
        d'origine intacte.<br /><br />

        Pour découper une figure, touchez un premier sommet de la figure, puis
        éventuellement le centre de la figure (non obligatoire), et enfin un
        second sommet de la figure.<br /><br />

        <b>Note:</b> il n'est pas toujours possible de découper une figure en
        sélectionnant deux sommets quelconques. La ligne de découpe doit en
        effet rester à l'intérieur de la figure, sans quoi la découpe ne sera pas
        réalisée.
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    this.removeListeners();
    app.upperCanvasLayer.removeAllObjects();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectSecondPoint() {
    this.removeListeners();
    app.upperCanvasLayer.removeAllObjects();

    new Point({
      coordinates: findObjectById(
        app.tool.firstPointIds[0]
      ).coordinates,
      layer: 'upper',
      color: this.drawColor,
      size: 2,
    });

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectThirdPoint() {
    this.removeListeners();
    app.upperCanvasLayer.removeAllObjects();

    let firstPoint = this.firstPoint;
    let centerPoint = this.centerPoint;
    new Point({
      coordinates: firstPoint.coordinates,
      layer: 'upper',
      color: this.drawColor,
      size: 2,
    });
    new Point({
      coordinates: centerPoint.coordinates,
      layer: 'upper',
      color: this.drawColor,
      size: 2,
    });

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  cut() {
    this.removeListeners();
    app.upperCanvasLayer.removeAllObjects();

    let firstPoint = this.firstPoint;
    let centerPoint = this.centerPoint;
    let secondPoint = this.secondPoint;
    new Point({
      coordinates: firstPoint.coordinates,
      layer: 'upper',
      color: this.drawColor,
      size: 2,
    });
    if (centerPoint != undefined) {
      new Point({
        coordinates: centerPoint.coordinates,
        layer: 'upper',
        color: this.drawColor,
        size: 2,
      });
    }
    if (secondPoint != undefined) {
      new Point({
        coordinates: secondPoint.coordinates,
        layer: 'upper',
        color: this.drawColor,
        size: 2,
      });
    }

  }

  end() {
    this.removeListeners();
    app.upperCanvasLayer.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
  }

  get firstPoint() {
    let firstPoint = findObjectById(
      app.tool.firstPointId
    );
    return firstPoint;
  }

  get centerPoint() {
    let centerPoint = findObjectById(
      app.tool.centerPointId
    );
    return centerPoint;
  }

  get secondPoint() {
    let secondPoint = findObjectById(
      app.tool.secondPointId
    );
    return secondPoint;
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un point a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (app.tool.currentStep == 'listen') {
      // On a sélectionné le premier point
      let segmentCut = false;
      for (let i = 0; i < object.length; i++) {
        let shape = object[i].shape;
        if (shape.isSegment() && object[0].type == 'divisionPoint' && app.environment.name != 'Geometrie') {
          segmentCut = true;
          setState({
            tool: { ...app.tool, currentStep: 'cut', firstPointId: object[0].id, centerPointId: undefined, secondPointId: undefined, shapeId: shape.id },
          });
          break;
        }
      }
      if (!segmentCut) {
        for (let i = 0; i < object.length; i++) {
          let shape = object[i].shape;
          if (shape.name == 'PointOnLine') {
            shape = findObjectById(shape.geometryObject.geometryParentObjectId1).shape;
          } else if (shape.name.startsWith('PointOnIntersection')) {
            shape = findObjectById(shape.geometryObject.geometryParentObjectId1).shape;
            if (shape.isSegment()) {
              shape = findObjectById(object[i].shape.geometryObject.geometryParentObjectId2).shape;
            }
          }
          if (shape.isSegment() || (app.environment.name == 'Geometrie' && shape.geometryObject.geometryPointOnTheFlyChildId)) {
            object.splice(i, 1);
            i--;
          }
        }
        if (object.length) {
          setState({
            tool: {
              ...app.tool,
              currentStep: 'selectSecondPoint',
              firstPointIds: object.map(pt => pt.id),
            },
          });
        }
      }
    } else if (app.tool.currentStep == 'selectSecondPoint') {
      let firstPoints = app.tool.firstPointIds.map(ptId => findObjectById(
        ptId
      ));
      let newObjects = [...object];
      let cutPoints = [];
      for (let i = 0; i < firstPoints.length; i++) {
        for (let j = 0; j < newObjects.length; j++) {
          let firstShapeIds = [firstPoints[i].shapeId];
          if (firstPoints[i].shape.name == 'PointOnLine' || firstPoints[i].shape.name.startsWith('PointOnIntersection')) {
            firstShapeIds = [findObjectById(firstPoints[i].shape.geometryObject.geometryParentObjectId1).shapeId];
          }
          if (firstPoints[i].shape.name.startsWith('PointOnIntersection')) {
            firstShapeIds.push(findObjectById(firstPoints[i].shape.geometryObject.geometryParentObjectId2).shapeId);
          }
          let secondShapeIds = [newObjects[j].shapeId];
          if (newObjects[j].shape.name == 'PointOnLine' || newObjects[j].shape.name.startsWith('PointOnIntersection')) {
            secondShapeIds = [findObjectById(newObjects[j].shape.geometryObject.geometryParentObjectId1).shapeId];
          }
          if (newObjects[j].shape.name.startsWith('PointOnIntersection')) {
            secondShapeIds.push(findObjectById(newObjects[j].shape.geometryObject.geometryParentObjectId2).shapeId);
          }
          for (let k = 0; k < firstShapeIds.length; k++) {
            for (let l = 0; l < secondShapeIds.length; l++) {
              if (firstShapeIds[k] == secondShapeIds[l]) {
                if (findObjectById(firstShapeIds[k]).familyName == 'Line')
                  break;
                firstPoints[i].cutSeg = k;
                newObjects[j].cutSeg = l;
                cutPoints.push([firstPoints[i], newObjects[j], firstShapeIds[k]]);
                firstPoints.splice(i, 1);
                newObjects.splice(j, 1);
                this.shapeId = firstShapeIds[k];
                i = -1;
              }
              if (i == -1)
                break;
            }
            if (i == -1)
              break;
          }
          if (i == -1)
            break;
        }
      }

      if (cutPoints.length == 0) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les points de découpe doivent appartenir à la même figure.' } }));
        return;
      }

      let pt1 = cutPoints[0][0];
      let pt2 = cutPoints[0][1];

      if (pt1.id == pt2.id) {
        // Désélectionner le premier point
        setState({
          tool: { ...app.tool, currentStep: 'listen', firstPointId: undefined },
        });
      } else {
        for (let i = 0; i < cutPoints.length; i++) {
          let shape = findObjectById(cutPoints[0][2]);
          if (!this.isLineValid(shape, cutPoints[i][0], cutPoints[i][1])) {
            cutPoints.splice(i, 1);
            i = -1;
          }
        }
        if (cutPoints.length == 0) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les points de découpe doivent pouvoir être reliés.' } }));
          return;
        }
        if (pt2.type == 'shapeCenter') {
          // On a sélectionné le second point: le centre
          setState({
            tool: {
              ...app.tool,
              currentStep: 'selectThirdPoint',
              firstPointId: pt1.id,
              centerPointId: pt2.id,
              shapeId: pt2.shape.id,
            },
          });
        } else {
          // On a sélectionné le second point: un autre point
          setState({
            tool: { ...app.tool, currentStep: 'cut', firstPointId: cutPoints[0][0].id, secondPointId: cutPoints[0][1].id, shapeId: cutPoints[0][2] },
          });
        }
      }
    } else if (app.tool.currentStep == 'selectThirdPoint') {
      let pt1 = this.firstPoint,
        pt2,
        shape = this.centerPoint.shape;
      object.forEach(pt => {
        let pt2Shape = pt.shape;
        if (pt2Shape.name == 'PointOnLine' || pt2Shape.name.startsWith('PointOnIntersection')) {
          let tmpShape = findObjectById(pt.shape.geometryObject['geometryParentObjectId1']).shape;
          if (shape.id == tmpShape.id) {
            pt2Shape = tmpShape;
            pt.cutSeg = 0;
          } else if (pt2Shape.name.startsWith('PointOnIntersection')) {
            pt2Shape = findObjectById(pt.shape.geometryObject['geometryParentObjectId2']).shape;
            pt.cutSeg = 1;
          }
        }
        if (shape.id == pt2Shape.id) {
          pt2 = pt;
        }
      });
      if (!pt2) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les points de découpe doivent appartenir à la même figure.' } }));
      } else if (pt2.type == 'shapeCenter') {
        // Désélectionner le centre
        setState({
          tool: {
            ...app.tool,
            currentStep: 'selectSecondPoint',
            centerPointId: undefined,
          },
        });
      } else if (pt1.id == pt2.id) {
        // Désélectionner le premier point et le centre
        setState({
          tool: {
            ...app.tool,
            currentStep: 'listen',
            firstPointId: undefined,
            centerPointId: undefined,
          },
        });
      } else {
        if (this.isLineValid(shape, this.centerPoint, pt2)) {
          setState({
            tool: { ...app.tool, currentStep: 'cut', secondPointId: pt2.id },
          });
        } else {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les points de découpe doivent pouvoir être reliés.' } }));
        }
      }
    }

    if (app.tool.currentStep == 'cut') {
      this.executeAnimation();
    }
    // window.dispatchEvent(new CustomEvent('refresh'));

  }

  executeAnimation() {
    window.clearTimeout(this.timeoutRef);
    this.timeoutRef = window.setTimeout(() => {
      this.executeAction();
      setState({
        tool: {
          ...app.tool,
          name: this.name,
          currentStep: 'listen',
          firstPointId: undefined,
          secondPointId: undefined,
          centerPointId: undefined,
        },
      });
    }, 200);
  }

  /**
   * Vérifie si le segment de droite reliant pt1 et pt2 :
   * - reste bien à l'intérieur de la figure ou non,
   * - ne soit pas confondu (ou en partie confondu) avec un autre segment (au moins 1/5 commun),
   * - ne contient pas un autre sommet de la figure,
   * - n'intersecte pas un autre segment de la figure
   * @return {Boolean}     Retourne false s'il sort de la figure.
   */
  isLineValid(shape, pt1, pt2) {
    let length = pt1.coordinates.dist(pt2.coordinates),
      part = pt2.coordinates.substract(pt1.coordinates).multiply(1 / length),
      precision = 1, // px
      amountOfParts = length / precision,
      pointsInBorder = 0;
    for (let i = 1; i < amountOfParts - 1; i++) {
      let coord = pt1.coordinates.add(part.multiply(i));
      if (!shape.isCoordinatesInPath(coord)) {
        return false;
      }
      pointsInBorder += shape.isCoordinatesOnBorder(coord) ? 1 : 0;
    }
    if (pointsInBorder > amountOfParts / 5) {
      return false;
    }
    const junction = new Segment({
      layer: 'invisible',
      vertexCoordinates: [pt1.coordinates, pt2.coordinates],
      createFromNothing: true,
    });
    if (shape.segments.some((seg) => seg.doesIntersect(junction, true))) {
      return false;
    }
    return shape.vertexes.every(
      (vertex) =>
        vertex.coordinates.equal(pt1.coordinates) ||
        vertex.coordinates.equal(pt2.coordinates) ||
        !junction.isCoordinatesOnSegment(vertex.coordinates),
    );
  }

  setSelectionConstraints() {
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    if (app.tool.currentStep == 'listen') {
      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'divisionPoint',
      ];
      app.workspace.selectionConstraints.points.whitelist = null;
      app.workspace.selectionConstraints.points.blacklist = app.mainCanvasLayer.shapes
        .filter(
          (s) =>
          (s.isStraightLine() ||
            s.isSemiStraightLine())
          // && (app.environment.name != 'Geometrie' || !s.geometryObject.geometryIsConstaintDraw)
        )
        .map((s) => {
          return { shapeId: s.id };
        });
      app.workspace.selectionConstraints.points.numberOfObjects = 'allSuperimposed';
    } else if (app.tool.currentStep == 'selectSecondPoint') {
      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'divisionPoint',
        'shapeCenter',
      ];
      app.workspace.selectionConstraints.points.numberOfObjects = 'allSuperimposed';
    } else if (app.tool.currentStep == 'selectThirdPoint') {
      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'divisionPoint',
        'shapeCenter',
      ];
      app.workspace.selectionConstraints.points.numberOfObjects = 'allSuperimposed';
    }
  }

  _executeAction() {
    let pt1 = this.firstPoint,
      pt2 = this.secondPoint,
      shape = findObjectById(app.tool.shapeId),
      firstPath,
      secondPath;

    if (shape.isSegment()) {
      firstPath = [
        'M',
        shape.segments[0].vertexes[0].x,
        shape.segments[0].vertexes[0].y,
        'L',
        pt1.x,
        pt1.y,
      ];
      secondPath = [
        'M',
        pt1.x,
        pt1.y,
        'L',
        shape.segments[0].vertexes[1].x,
        shape.segments[0].vertexes[1].y,
      ];
    } else {
      if (pt1.coordinates.equal(shape.segments[0].vertexes[0].coordinates)) {
        pt1 = shape.segments[0].vertexes[0];
      }
      if (pt1.coordinates.equal(shape.segments[shape.segments.length - 1].vertexes[1].coordinates)) {
        pt1 = shape.segments[shape.segments.length - 1].vertexes[1];
      }
      if (pt2) {
        if (pt2.coordinates.equal(shape.segments[0].vertexes[0].coordinates)) {
          pt2 = shape.segments[0].vertexes[0];
        }
        if (pt2.coordinates.equal(shape.segments[shape.segments.length - 1].vertexes[1].coordinates)) {
          pt2 = shape.segments[shape.segments.length - 1].vertexes[1];
        }
      }

      // Trier les 2 points:
      if (pt1.type == 'vertex' && pt1.idx === 0 && pt1.shape.name != 'PointOnLine' && !pt1.shape.name.startsWith('PointOnIntersection')) {
        [pt1, pt2] = [pt2, pt1];
      } else if (!(pt2.type == 'vertex' && pt2.idx === 0 && pt2.shape.name != 'PointOnLine' && !pt2.shape.name.startsWith('PointOnIntersection'))) {
        let pt1Idx = pt1.idx || pt1.segments[0]?.idx;
        let pt2Idx = pt2.idx || pt2.segments[0]?.idx;
        if (pt1.shape.name == 'PointOnLine' || pt1.shape.name.startsWith('PointOnIntersection')) {
          pt1Idx = findObjectById(pt1.shape.geometryObject['geometryParentObjectId' + (pt1.cutSeg + 1)]).idx;
        }
        if (pt2.shape.name == 'PointOnLine' || pt2.shape.name.startsWith('PointOnIntersection')) {
          pt2Idx = findObjectById(pt2.shape.geometryObject['geometryParentObjectId' + (pt2.cutSeg + 1)]).idx;
        }
        if (pt1Idx > pt2Idx) {
          [pt1, pt2] = [pt2, pt1];
        } else if (pt1Idx === pt2Idx) {
          if ((pt1.ratio || 0) > (pt2.ratio || 0)) {
            [pt1, pt2] = [pt2, pt1];
          }
          // [pt1, pt2] = [pt2, pt1];
        }
      }

      let nbOfSegments = shape.segmentIds.length;
      this.currentPoint = shape.vertexes[0];

      firstPath = [
        'M',
        this.currentPoint.coordinates.x,
        this.currentPoint.coordinates.y,
      ];
      for (let i = 0; i < nbOfSegments; i++) {
        if (pt1.type === 'divisionPoint' && pt1.segments[0].idx === i) {
          this.addPathElem(firstPath, pt1);
          break;
        } else if ((pt1.shape.name == 'PointOnLine' || pt1.shape.name.startsWith('PointOnIntersection')) && findObjectById(pt1.shape.geometryObject['geometryParentObjectId' + (pt1.cutSeg + 1)]).idx == i) {
          this.addPathElem(firstPath, pt1);
          break;
        } else if (shape.vertexes[i + 1]) {
          this.addPathElem(firstPath, shape.vertexes[i + 1]);
        }
        if (pt1.type === 'vertex' && !pt1.shape.name.startsWith('PointOn') && pt1.idx === i + 1) {
          break;
        }
      }
      if (this.centerPoint) {
        this.addPathElem(firstPath, this.centerPoint, false);
      }
      this.addPathElem(firstPath, pt2, false);
      let endJunctionIndex = pt2.idx || pt2.segments[0]?.idx;
      if (pt2.shape.name == 'PointOnLine' || pt2.shape.name.startsWith('PointOnIntersection')) {
        endJunctionIndex = findObjectById(pt2.shape.geometryObject['geometryParentObjectId' + (pt2.cutSeg + 1)]).idx;
      }
      if (!(pt2.type == 'vertex' && pt2.idx === 0 && pt2.shapeId == app.tool.shapeId)) {
        for (let i = endJunctionIndex + 1; i <= nbOfSegments; i++) {
          this.addPathElem(firstPath, shape.vertexes[i % nbOfSegments]);
        }
      }

      this.currentPoint = pt1;
      secondPath = [
        'M',
        this.currentPoint.coordinates.x,
        this.currentPoint.coordinates.y,
      ];
      endJunctionIndex = pt1.idx || pt1.segments[0]?.idx;
      if (pt1.shape.name == 'PointOnLine' || pt1.shape.name.startsWith('PointOnIntersection')) {
        endJunctionIndex = findObjectById(pt1.shape.geometryObject['geometryParentObjectId' + (pt1.cutSeg + 1)]).idx;
      }
      for (let i = endJunctionIndex; i < nbOfSegments; i++) {
        if (pt2.type === 'divisionPoint' && pt2.segments[0].idx === i) {
          this.addPathElem(secondPath, pt2);
          break;
        } else if ((pt2.shape.name == 'PointOnLine' || pt2.shape.name.startsWith('PointOnIntersection')) && findObjectById(pt2.shape.geometryObject['geometryParentObjectId' + (pt2.cutSeg + 1)]).idx == i) {
          this.addPathElem(secondPath, pt2);
          break;
        } else {
          this.addPathElem(secondPath, shape.vertexes[(i + 1) % nbOfSegments]);
        }
        // je ne sais pas pourquoi mais ça a l'air de marcher
        if (pt2.type === 'vertex' //&& !pt1.shape.name.startsWith('PointOn')
          && pt2.idx === (i + 1) % nbOfSegments) {
          break;
        }
      }
      if (this.centerPoint) {
        this.addPathElem(secondPath, this.centerPoint, false);
      }
      this.addPathElem(secondPath, pt1, false);
    }

    firstPath = firstPath.join(' ');
    secondPath = secondPath.join(' ');

    let shape1 = new shape.constructor({
      layer: 'main',
      path: firstPath,
      fillColor: shape.fillColor,
      fillOpacity: shape.fillOpacity,
      strokeColor: shape.strokeColor,
    });
    let shape2 = new shape.constructor({
      layer: 'main',
      path: secondPath,
      fillColor: shape.fillColor,
      fillOpacity: shape.fillOpacity,
      strokeColor: shape.strokeColor,
    });

    if (app.environment.name == 'Geometrie') {
      shape1.geometryObject = new GeometryObject({});
      shape1.familyName = 'duplicate';
      shape2.geometryObject = new GeometryObject({});
      shape2.familyName = 'duplicate';
    }

    shape1.cleanSameDirectionSegment();
    shape2.cleanSameDirectionSegment();

    if (app.environment.name == 'Geometrie') {
      let allPointsOfParent = shape.geometryObject.geometryChildShapeIds
        .map(childId => findObjectById(childId))
        .filter(child => child.name == 'PointOnLine' || child.name.startsWith('PointOnIntersection'))
        .map(child => child.vertexes[0]);
      allPointsOfParent = [...allPointsOfParent, ...shape.points];

      let shape1Hidden = new shape.constructor({
        layer: 'main',
        familyName: 'Irregular',
        name: 'cut',
        path: shape1.getSVGPath('no scale', false),
        fillColor: shape.fillColor,
        fillOpacity: shape.fillOpacity,
        strokeColor: shape.strokeColor,
        geometryObject: new GeometryObject({
          geometryIsVisibleByChoice: false,
          geometryIsVisible: false,
          geometryDuplicateChildShapeIds: [shape1.id],
        })
      });
      shape1.geometryObject.geometryDuplicateParentShapeId = shape1Hidden.id;
      shape1Hidden.points.forEach(vertex => {
        let parentVertex = allPointsOfParent.find(vx => vx.coordinates.equal(vertex.coordinates));
        if (!parentVertex) {
          console.info('no parent vertex for ', vertex);
        } else {
          vertex.reference = parentVertex.id;
          if (!parentVertex.shape.geometryObject.geometryChildShapeIds.find(childId => childId == shape1Hidden.id)) {
            parentVertex.shape.geometryObject.geometryChildShapeIds.push(shape1Hidden.id);
          }
        }
      });

      let shape2Hidden = new shape.constructor({
        layer: 'main',
        familyName: 'Irregular',
        name: 'cut',
        path: shape2.getSVGPath('no scale', false),
        fillColor: shape.fillColor,
        fillOpacity: shape.fillOpacity,
        strokeColor: shape.strokeColor,
        geometryObject: new GeometryObject({
          geometryIsVisibleByChoice: false,
          geometryIsVisible: false,
          geometryDuplicateChildShapeIds: [shape2.id],
        })
      });
      shape2.geometryObject.geometryDuplicateParentShapeId = shape2Hidden.id;
      shape2Hidden.points.forEach(vertex => {
        let parentVertex = allPointsOfParent.find(vx => vx.coordinates.equal(vertex.coordinates));
        if (!parentVertex) {
          console.info('no parent vertex for ', vertex);
        } else {
          vertex.reference = parentVertex.id;
          if (!parentVertex.shape.geometryObject.geometryChildShapeIds.find(childId => childId == shape2Hidden.id))
            parentVertex.shape.geometryObject.geometryChildShapeIds.push(shape2Hidden.id);
        }
      });
    }

    // Modifier les coordonnées
    let center1 = shape1.fake_center,
      center2 = shape2.fake_center,
      difference = center2.substract(center1),
      distance = center2.dist(center1),
      myOffset = 20, //px
      offset = difference.multiply(myOffset / distance);

    shape1.translate(offset.multiply(-1));
    if (shape.isSegment()) {
      shape1.translate(
        new Coordinates({
          x: -shape.segments[0].direction.y,
          y: shape.segments[0].direction.x,
        }).multiply(myOffset / 2),
      );
    }

    shape2.translate(offset);
    if (shape.isSegment()) {
      shape2.translate(
        new Coordinates({
          x: shape.segments[0].direction.y,
          y: -shape.segments[0].direction.x,
        }).multiply(myOffset / 2),
      );
    }
  }

  addPathElem(path, nextPoint, mustFollowArc) {
    let segment;
    if (mustFollowArc !== false) {
      if (this.currentPoint.shape.name == 'PointOnLine' || this.currentPoint.shape.name.startsWith('PointOnIntersection')) {
        segment = findObjectById(this.currentPoint.shape.geometryObject['geometryParentObjectId' + (this.currentPoint.cutSeg + 1)]);
      } else {
        let segmentIdx = Number.isInteger(this.currentPoint.idx)
          ? this.currentPoint.idx
          : this.currentPoint.segments[0].idx;
        segment = this.currentPoint.shape.segments[segmentIdx];
      }
    }
    if (segment == undefined || !segment.isArc() || mustFollowArc === false) {
      path.push('L', nextPoint.coordinates.x, nextPoint.coordinates.y);
      this.currentPoint = nextPoint;
    } else {
      let firstCoord = this.currentPoint.coordinates;
      let secondCoord = nextPoint.coordinates;

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
      this.currentPoint = nextPoint;
    }
  }
}
