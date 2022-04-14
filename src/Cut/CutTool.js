import { html } from 'lit';
import { app, setState } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Tool } from '../Core/States/Tool';

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

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    this.removeListeners();
    app.upperDrawingEnvironment.removeAllObjects();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectSecondPoint() {
    this.removeListeners();
    app.upperDrawingEnvironment.removeAllObjects();

    new Point({
      coordinates: app.mainDrawingEnvironment.findObjectById(
        app.tool.firstPointIds[0],
        'point',
      ).coordinates,
      drawingEnvironment: app.upperDrawingEnvironment,
      color: this.drawColor,
      size: 2,
    });
    // window.dispatchEvent(new CustomEvent('refreshUpper'));
    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectThirdPoint() {
    this.removeListeners();
    app.upperDrawingEnvironment.removeAllObjects();

    let firstPoint = this.firstPoint;
    let centerPoint = this.centerPoint;
    new Point({
      coordinates: firstPoint.coordinates,
      drawingEnvironment: app.upperDrawingEnvironment,
      color: this.drawColor,
      size: 2,
    });
    new Point({
      coordinates: centerPoint.coordinates,
      drawingEnvironment: app.upperDrawingEnvironment,
      color: this.drawColor,
      size: 2,
    });
    // window.dispatchEvent(new CustomEvent('refreshUpper'));
    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  cut() {
    this.removeListeners();
    app.upperDrawingEnvironment.removeAllObjects();

    let firstPoint = this.firstPoint;
    let centerPoint = this.centerPoint;
    let secondPoint = this.secondPoint;
    new Point({
      coordinates: firstPoint.coordinates,
      drawingEnvironment: app.upperDrawingEnvironment,
      color: this.drawColor,
      size: 2,
    });
    if (centerPoint != undefined) {
      new Point({
        coordinates: centerPoint.coordinates,
        drawingEnvironment: app.upperDrawingEnvironment,
        color: this.drawColor,
        size: 2,
      });
    }
    if (secondPoint != undefined) {
      new Point({
        coordinates: secondPoint.coordinates,
        drawingEnvironment: app.upperDrawingEnvironment,
        color: this.drawColor,
        size: 2,
      });
    }
    // window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
  }

  get firstPoint() {
    let firstPoint = app.mainDrawingEnvironment.findObjectById(
      app.tool.firstPointId,
      'point',
    );
    return firstPoint;
  }

  get centerPoint() {
    let centerPoint = app.mainDrawingEnvironment.findObjectById(
      app.tool.centerPointId,
      'point',
    );
    return centerPoint;
  }

  get secondPoint() {
    let secondPoint = app.mainDrawingEnvironment.findObjectById(
      app.tool.secondPointId,
      'point',
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
      //On a sélectionné le premier point
      if (object[0].shape.isSegment() && object[0].type == 'divisionPoint') {
        setState({
          tool: { ...app.tool, currentStep: 'cut', firstPointId: object[0].id, centerPointId: undefined, secondPointId: undefined },
        });
      } else {
        setState({
          tool: {
            ...app.tool,
            currentStep: 'selectSecondPoint',
            firstPointIds: object.map(pt => pt.id),
          },
        });
      }
    } else if (app.tool.currentStep == 'selectSecondPoint') {
      let firstPoints = app.tool.firstPointIds.map(ptId => app.mainDrawingEnvironment.findObjectById(
        ptId,
        'point',
      ));
      let newObjects = [...object];
      let cutPoints = [];
      for (let i = 0; i < firstPoints.length; i++) {
        for (let j = 0; j < newObjects.length; j++) {
          let firstShapeId = firstPoints[i].shapeId;
          if (firstPoints[i].shape.name == 'PointOnLine') {
            firstShapeId = app.mainDrawingEnvironment.findObjectById(firstPoints[i].shape.geometryObject.geometryParentObjectId1, 'segment').shapeId;
          }
          let secondShapeId = newObjects[j].shapeId;
          if (newObjects[j].shape.name == 'PointOnLine') {
            secondShapeId = app.mainDrawingEnvironment.findObjectById(newObjects[j].shape.geometryObject.geometryParentObjectId1, 'segment').shapeId;
          }
          if (firstShapeId == secondShapeId) {
            cutPoints.push([firstPoints[i], newObjects[j]]);
            firstPoints.splice(i, 1);
            newObjects.splice(j, 1);
            this.shapeId = firstShapeId;
            i = -1;
          }
          if (i == -1)
            break;
        }
      }

      let pt1 = cutPoints[0][0];
      let pt2 = cutPoints[0][1];

      if (cutPoints.length == 0) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail : {message : 'Les points de découpe doivent appartenir à la même figure.' } }));
        return;
      } else if (pt1.id == pt2.id) {
        // Désélectionner le premier point
        setState({
          tool: { ...app.tool, currentStep: 'listen', firstPointId: undefined },
        });
      } else {
        for (let i = 0; i < cutPoints.length; i++) {
          let shape = cutPoints[i][0].shape;
          if (shape.name == 'PointOnLine')
            shape = app.mainDrawingEnvironment.findObjectById(pt1.shape.geometryObject.geometryParentObjectId1, 'segment').shape;
          if (!this.isLineValid(shape, cutPoints[i][0], cutPoints[i][1])) {
            cutPoints.splice(i, 1);
            i = -1;
          }
        }
        if (cutPoints.length == 0) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail : {message : 'Les points de découpe doivent pouvoir être reliés.' } }));
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
            },
          });
        } else {
          // On a sélectionné le second point: un autre point
          setState({
            tool: { ...app.tool, currentStep: 'cut', firstPointId: cutPoints[0][0].id, secondPointId: cutPoints[0][1].id },
          });
        }
      }
    } else if (app.tool.currentStep == 'selectThirdPoint') {
      let pt1 = this.firstPoint,
        pt2;
      let pt1Shape = pt1.shape;
      if (pt1Shape.name == 'PointOnLine')
        pt1Shape = app.mainDrawingEnvironment.findObjectById(pt1.shape.geometryObject.geometryParentObjectId1, 'segment').shape;
      object.forEach(pt => {
        let pt2Shape = pt.shape;
        if (pt2Shape.name == 'PointOnLine')
          pt2Shape = app.mainDrawingEnvironment.findObjectById(pt.shape.geometryObject.geometryParentObjectId1, 'segment').shape;
        if (pt1Shape == pt2Shape)
          pt2 = pt;
      });
      if (!pt2) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail : {message : 'Les points de découpe doivent appartenir à la même figure.' } }));
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
        let shape = pt2.shape;
        if (shape.name == 'PointOnLine')
          shape = app.mainDrawingEnvironment.findObjectById(pt2.shape.geometryObject.geometryParentObjectId1, 'segment').shape;
        if (this.isLineValid(shape, this.centerPoint, pt2)) {
          setState({
            tool: { ...app.tool, currentStep: 'cut', secondPointId: pt2.id },
          });
        } else {
          window.dispatchEvent(new CustomEvent('show-notif', { detail : {message : 'Les points de découpe doivent pouvoir être reliés.' } }));
        }
      }
    }

    if (app.tool.currentStep == 'cut') {
      this.executeAnimation();
    }
    // window.dispatchEvent(new CustomEvent('refresh'));
    // window.dispatchEvent(new CustomEvent('refreshUpper'));
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
    }, 500);
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
      drawingEnvironment: app.invisibleDrawingEnvironment,
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
      app.workspace.selectionConstraints.points.blacklist = app.workspace.shapes
        .filter(
          (s) =>
            s.isStraightLine() ||
            s.isSemiStraightLine() ||
            (s.isSegment() && app.environment.name == 'Geometrie'),
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

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
  _executeAction() {
    let pt1 = this.firstPoint,
      pt2 = this.secondPoint,
      shape = pt1.shape,//app.mainDrawingEnvironment.findObjectById(this.shapeId),
      firstPath,
      secondPath;

    if (shape.name == 'PointOnLine')
      shape = app.mainDrawingEnvironment.findObjectById(pt1.shape.geometryObject.geometryParentObjectId1, 'segment').shape;

    if (pt1.shape.isSegment()) {
      shape = pt1.shape;
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
      if (pt1.type == 'vertex' && pt1.idx === 0 && pt1.shape.name != 'PointOnLine') {
        [pt1, pt2] = [pt2, pt1];
      } else if (!(pt2.type == 'vertex' && pt2.idx === 0 && pt2.shape.name != 'PointOnLine')) {
        let pt1Idx = pt1.idx || pt1.segments[0]?.idx;
        let pt2Idx = pt2.idx || pt2.segments[0]?.idx;
        if (pt1.shape.name == 'PointOnLine') {
          pt1Idx = app.mainDrawingEnvironment.findObjectById(pt1.shape.geometryObject.geometryParentObjectId1, 'segment').idx;
        }
        if (pt2.shape.name == 'PointOnLine') {
          pt2Idx = app.mainDrawingEnvironment.findObjectById(pt2.shape.geometryObject.geometryParentObjectId1, 'segment').idx;
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
        } else if (pt1.shape.name === 'PointOnLine' && app.mainDrawingEnvironment.findObjectById(pt1.shape.geometryObject.geometryParentObjectId1, 'segment').idx == i) {
          this.addPathElem(firstPath, pt1);
          break;
        } else {
          if (shape.vertexes[i + 1])
            this.addPathElem(firstPath, shape.vertexes[i + 1]);
        }
        if (pt1.type === 'vertex' && pt1.idx === i + 1) {
          break;
        }
      }
      if (this.centerPoint) {
        this.addPathElem(firstPath, this.centerPoint, false);
      }
      this.addPathElem(firstPath, pt2, false);
      let endJunctionIndex = pt2.idx || pt2.segments[0]?.idx;
      if (pt2.shape.name == 'PointOnLine') {
        endJunctionIndex = app.mainDrawingEnvironment.findObjectById(pt2.shape.geometryObject.geometryParentObjectId1, 'segment').idx;
      }
      if (!(pt2.type == 'vertex' && pt2.idx === 0 && pt2.shapeId == this.shapeId)) {
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
      if (pt1.shape.name == 'PointOnLine') {
        endJunctionIndex = app.mainDrawingEnvironment.findObjectById(pt1.shape.geometryObject.geometryParentObjectId1, 'segment').idx;
      }
      for (let i = endJunctionIndex; i < nbOfSegments; i++) {
        if (pt2.type === 'divisionPoint' && pt2.segments[0].idx === i) {
          this.addPathElem(secondPath, pt2);
          break;
        } else if (pt2.shape.name === 'PointOnLine' && app.mainDrawingEnvironment.findObjectById(pt2.shape.geometryObject.geometryParentObjectId1, 'segment').idx == i) {
          this.addPathElem(secondPath, pt2);
          break;
        } else {
          this.addPathElem(secondPath, shape.vertexes[(i + 1) % nbOfSegments]);
        }
        if (pt2.type === 'vertex' && pt2.idx === (i + 1) % nbOfSegments) {
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
      drawingEnvironment: app.mainDrawingEnvironment,
      path: firstPath,
      fillColor: shape.fillColor,
      fillOpacity: shape.fillOpacity,
      strokeColor: shape.strokeColor,
    });
    let shape2 = new shape.constructor({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: secondPath,
      fillColor: shape.fillColor,
      fillOpacity: shape.fillOpacity,
      strokeColor: shape.strokeColor,
    });

    if (app.environment.name == 'Geometrie') {
      shape1.geometryObject = new GeometryObject({});
      shape1.familyName = 'Irregular';
      shape2.geometryObject = new GeometryObject({});
      shape2.familyName = 'Irregular';
    }

    shape1.cleanSameDirectionSegment();
    shape2.cleanSameDirectionSegment();

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
      if (this.currentPoint.shape.name == 'PointOnLine') {
        segment = app.mainDrawingEnvironment.findObjectById(this.currentPoint.shape.geometryObject.geometryParentObjectId1, 'segment');
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
