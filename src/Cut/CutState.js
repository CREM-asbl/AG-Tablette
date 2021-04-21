import { app, setState } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { Shape } from '../Core/Objects/Shape';

/**
 * Découper une forme
 */
export class CutState extends State {
  constructor() {
    super('cut', 'Découper', 'operation');

    // listen-canvas-click -> select-second-point -> select-third-point -> showing-points
    this.currentStep = null;

    this.timeoutRef = null;

    this.shape = null;

    this.firstPoint = null;

    this.secondPoint = null;

    this.centerPoint = null;

    this.drawColor = '#E90CC8';


  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil permet de
        découper une forme en deux nouvelles formes, tout en laissant la forme
        d'origine intacte.<br /><br />

        Pour découper une forme, touchez un premier sommet de la forme, puis
        éventuellement le centre de la forme (non obligatoire), et enfin un
        second sommet de la forme.<br /><br />

        <b>Note:</b> il n'est pas toujours possible de découper une forme en
        sélectionnant deux sommets quelconques. La ligne de découpe doit en
        effet rester à l'intérieur de la forme, sans quoi la découpe ne sera pas
        réalisée.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectSecondPoint() {
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectThirdPoint() {
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  cut() {
    this.removeListeners();
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un point a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (app.tool.currentStep == 'start') {
      //On a sélectionné le premier point
      this.shape = object.shape;
      this.firstPoint = object;
      new Point({
        coordinates: object.coordinates,
        drawingEnvironment: app.upperDrawingEnvironment,
        color: this.drawColor,
        size: 2,
      });
      if (this.shape.isSegment() && this.firstPoint.type == 'divisionPoint') {
        this.secondPoint = null;
        setState({ tool: { ...app.tool, currentStep: 'cut' } });
      } else {
        setState({ tool: { ...app.tool, currentStep: 'selectSecondPoint' } });
      }
    } else if (app.tool.currentStep == 'selectSecondPoint') {
      const pt1 = this.firstPoint,
        pt2 = object;
      if (pt1.id == pt2.id) {
        // Désélectionner le premier point
        this.shape = null;
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[0].id,
          'point',
        );
        this.firstPoint = null;
        setState({ tool: { ...app.tool, currentStep: 'start' } });
      } else if (this.isLineValid(pt2.shape, pt1, pt2)) {
        new Point({
          coordinates: object.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: this.drawColor,
          size: 2,
        });
        if (pt2.type == 'shapeCenter') {
          // On a sélectionné le second point: le centre
          this.centerPoint = pt2;
          setState({ tool: { ...app.tool, currentStep: 'selectThirdPoint' } });
        } else {
          // On a sélectionné le second point: un autre point
          this.secondPoint = pt2;
          this.centerPoint = null;
          setState({ tool: { ...app.tool, currentStep: 'cut' } });
        }
      }
    } else if (app.tool.currentStep == 'selectThirdPoint') {
      const pt1 = this.firstPoint,
        pt2 = object;
      //On a sélectionné le dernier point
      if (pt2.type == 'shapeCenter') {
        // Désélectionner le centre
        this.centerPoint = null;
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[1].id,
          'point',
        );
        setState({ tool: { ...app.tool, currentStep: 'selectSecondPoint' } });
      } else if (pt1.id == pt2.id) {
        // Désélectionner le premier point et le centre
        this.shape = null;
        this.firstPoint = null;
        this.centerPoint = null;
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[1].id,
          'point',
        );
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[0].id,
          'point',
        );
        setState({ tool: { ...app.tool, currentStep: 'start' } });
      } else if (this.isLineValid(pt2.shape, this.centerPoint, pt2)) {
        new Point({
          coordinates: object.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: this.drawColor,
          size: 2,
        });
        this.secondPoint = pt2;
        setState({ tool: { ...app.tool, currentStep: 'cut' } });
      }
    }

    if (app.tool.currentStep == 'cut') {
      this.executeAnimation();
    }
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  executeAnimation() {
    window.clearTimeout(this.timeoutRef);
    this.timeoutRef = window.setTimeout(() => {
      this.executeAction();
      setState({ tool: { ...app.tool, currentStep: 'start' } });

      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
    }, 500);
  }

  /**
   * Vérifie si le segment de droite reliant pt1 et pt2 :
   * - reste bien à l'intérieur de la forme ou non,
   * - ne soit pas confondu (ou en partie confondu) avec un autre segment (au moins 1/5 commun),
   * - ne contient pas un autre sommet de la forme,
   * - n'intersecte pas un autre segment de la forme
   * @param  {Shape}  shape
   * @param  {Point}  pt1  coordonnées du point 1
   * @param  {Point}  pt2  coordonnées du point 2
   * @return {Boolean}     Retourne false s'il sort de la forme.
   */
  isLineValid(shape, pt1, pt2) {
    let length = pt1.coordinates.dist(pt2.coordinates),
      part = pt2.coordinates.substract(pt1.coordinates).multiply(1 / length),
      precision = 1, // px
      amountOfParts = length / precision,
      pointsInBorder = 0;
    for (let i = 1; i < amountOfParts; i++) {
      let coord = pt1.coordinates.add(part.multiply(i));
      if (!shape.isCoordinatesInPath(coord)) return false;
      pointsInBorder += shape.isCoordinatesOnBorder(coord) ? 1 : 0;
    }
    if (pointsInBorder > amountOfParts / 5) return false;
    const junction = new Segment({
      drawingEnvironment: app.invisibleDrawingEnvironment,
      vertexCoordinates: [pt1.coordinates, pt2.coordinates],
      createFromNothing: true,
    });
    if (shape.segments.some((seg) => seg.doesIntersect(junction, false, true)))
      return false;

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
    if (app.tool.currentStep == 'start') {
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
    } else if (app.tool.currentStep == 'selectSecondPoint') {
      let shape = this.firstPoint.shape,
        concernedSegments = this.firstPoint.segments;

      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'divisionPoint',
        'shapeCenter',
      ];
      app.workspace.selectionConstraints.points.whitelist = [
        { shapeId: shape.id },
      ];

      let segmentsToAddToBlacklist = [];

      concernedSegments.forEach((seg) => {
        if (!seg.arcCenter) {
          segmentsToAddToBlacklist.push(seg);
        }
      });

      let blacklist = segmentsToAddToBlacklist
        .map((seg) =>
          seg.points.map((pt) => {
            if (pt.id != this.firstPoint.id) {
              if (pt.type == 'vertex') {
                return {
                  shapeId: shape.id,
                  type: 'vertex',
                  index: pt.idx,
                };
              } else {
                return {
                  shapeId: shape.id,
                  type: 'divisionPoint',
                  index: pt.segments[0].idx,
                  ratio: pt.ratio,
                };
              }
            }
          }),
        )
        .flat()
        .filter((pt) => pt);
      app.workspace.selectionConstraints.points.blacklist = blacklist;
    } else if (app.tool.currentStep == 'selectThirdPoint') {
      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'divisionPoint',
        'shapeCenter',
      ];

      let shape = this.firstPoint.shape;
      app.workspace.selectionConstraints.points.whitelist = [
        { shapeId: shape.id },
      ];
      app.workspace.selectionConstraints.points.blacklist = null;
    }
  }


  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
   executeAction() {
    let shape = this.shape,
      pt1 = this.firstPoint,
      pt2 = this.secondPoint,
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
      // Trier les 2 points:
      if (pt1.type == 'vertex' && pt1.idx === 0) {
        [pt1, pt2] = [pt2, pt1];
      } else if (!(pt2.type == 'vertex' && pt2.idx === 0)) {
        let pt1Idx = pt1.idx || pt1.segments[0].idx;
        let pt2Idx = pt2.idx || pt2.segments[0].idx;
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
        } else {
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
      let endJunctionIndex = pt2.idx || pt2.segments[0].idx;
      if (!(pt2.type == 'vertex' && pt2.idx === 0)) {
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
      endJunctionIndex = pt1.idx || pt1.segments[0].idx;
      for (let i = endJunctionIndex; i < nbOfSegments; i++) {
        if (pt2.type === 'divisionPoint' && pt2.segments[0].idx === i) {
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

    let shape1 = new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: firstPath,
      color: shape.color,
      borderColor: shape.borderColor,
    });
    let shape2 = new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: secondPath,
      color: shape.color,
      borderColor: shape.borderColor,
    });

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
      let segmentIdx = Number.isInteger(this.currentPoint.idx)
        ? this.currentPoint.idx
        : this.currentPoint.segments[0].idx;
      segment = this.currentPoint.shape.segments[segmentIdx];
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
