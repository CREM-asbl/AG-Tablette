import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem } from '../Core/Tools/general';
import { Segment } from '../Core/Objects/Segment';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';
import { Coordinates } from '../Core/Objects/Coordinates';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';

/**
 * Découper un segment (ou partie de segment) en X parties (ajoute X-1 points)
 */
export class DivideTool extends Tool {
  constructor() {
    super('divide', 'Diviser', 'operation');

    // choose-nb-parts -> listen-canvas-click -> select-second-point -> showing-points
    //                                        -> showing-segment
    this.currentStep = null;

    this.timeoutRef = null;

    this.drawColor = '#E90CC8';

    this.numberOfParts = 2;
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
        diviser un segment d'une figure en plusieurs parties (délimitées par des
        points).<br />
        Après avoir choisit en combien de partie vous souhaitez diviser le
        segment, touchez le segment que vous souhaitez diviser.<br />
        Il est également possible de sélectionner deux points situés sur le même
        segment, afin de diviser le segment formé par ces deux points.<br /><br />

        <b>Note:</b> il est également possible de diviser un arc de cercle, soit
        en touchant l'arc lui-même, soit en sélectionnant deux points situés sur
        cet arc. Dans ce dernier cas, la division est effectuée dans le sens
        horlogique.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    createElem('divide-popup');
  }

  selectObject() {
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectSecondPoint() {
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    let firstPoint = app.mainDrawingEnvironment.findObjectById(
      app.tool.firstPointIds[0],
      'point',
    );
    new Point({
      coordinates: firstPoint.coordinates,
      drawingEnvironment: app.upperDrawingEnvironment,
      color: this.drawColor,
      size: 2,
    });
    // window.dispatchEvent(new CustomEvent('refreshUpper'));
    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  divide() {
    this.removeListeners();
  }

  /**
   * stopper l'état
   */
  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();
  }

  setSelectionConstraints() {
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.types = [
      'vertex',
      'divisionPoint',
    ];
    if (app.tool.currentStep == 'selectObject') {
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.blacklist = app.mainDrawingEnvironment.shapes
        .filter((s) => s.isStraightLine() || s.isSemiStraightLine())
        .map((s) => {
          return { shapeId: s.id };
        });
      app.workspace.selectionConstraints.points.canSelect = true;
      app.workspace.selectionConstraints.points.blacklist = app.mainDrawingEnvironment.shapes
        .filter((s) => s.isStraightLine() || s.isSemiStraightLine())
        .map((s) => {
          return { shapeId: s.id };
        });
      app.workspace.selectionConstraints.points.numberOfObjects = 'allSuperimposed';
    } else if (app.tool.currentStep == 'selectSecondPoint') {
      app.workspace.selectionConstraints.points.canSelect = true;
      app.workspace.selectionConstraints.points.numberOfObjects = 'allSuperimposed';
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un point/segment a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (app.tool.currentStep == 'selectObject') {
      if (object instanceof Segment) {
        if (object.shape instanceof ArrowLineShape) {
          this.vectorId = object.shape.id;
          this.mode = 'vector';
          setState({ tool: { ...app.tool, currentStep: 'divide' } });
        } else {
          this.segmentId = object.id;

          new LineShape({
            drawingEnvironment: app.upperDrawingEnvironment,
            strokeColor: this.drawColor,
            strokeWidth: 3,
            path: object.getSVGPath('no scale', true),
            id: undefined,
          });

          this.mode = 'segment';
          setState({ tool: { ...app.tool, currentStep: 'divide' } });
        }
      } else {
        this.firstPointIds = object.map(pt => pt.id);

        this.setSelectionConstraints();
        setState({
          tool: {
            ...app.tool,
            currentStep: 'selectSecondPoint',
            firstPointIds: this.firstPointIds,
          },
        });
      }
    } else if (app.tool.currentStep == 'selectSecondPoint') {
      let pt1 = app.mainDrawingEnvironment.findObjectById(
        this.firstPointIds[0],
        'point',
      );
      let object1 = object[0];

      if (pt1.coordinates.dist(object1.coordinates) < 0.01) {
        // pt1 == object => désélectionner le point.
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[0].id,
          'point',
        );

        this.setSelectionConstraints();
        setState({ tool: { ...app.tool, currentStep: 'selectObject' } });
      // } else if (pt1.shape.id != object.shape.id) {
      //   window.dispatchEvent(new CustomEvent('show-notif', { detail : { message : 'Les points de la division doivent appartenir à la même figure.' } }));
      } else {
        let pointsToDivide = [];
        let firstPoints = this.firstPointIds.map(ptId => app.mainDrawingEnvironment.findObjectById(
          ptId,
          'point',
        ));
        let newObjects = [...object];
        for (let i = 0; i < firstPoints.length; i++) {
          for (let j = 0; j < newObjects.length; j++) {
            for (let k = 0; k < firstPoints[i].segmentIds.length; k++) {
              for (let l = 0; l < newObjects[j].segmentIds.length; l++) {
                if (firstPoints[i].segmentIds[k] == newObjects[j].segmentIds[l]) {
                  pointsToDivide.push([firstPoints[i], newObjects[j]]);
                  firstPoints.splice(i, 1);
                  newObjects.splice(j, 1);
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
        if (pointsToDivide.length == 0) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail : { message : 'Les points de la division doivent appartenir au même segment' } }));
          return;
        }

        let pt1 = pointsToDivide[0][0];
        let pt2 = pointsToDivide[0][1];
        if (pt1.type == 'vertex' && pt2.type == 'vertex') {
          /*
              Vérifie s'il y a une ambiguité sur l'action à réaliser: si les 2
              poins sont reliés par un arc de cercle, et aussi par un segment (la
              figure est donc constituée uniquement de 2 sommets, un segment et un
              arc de cercle), on annule l'action.
                */
          if (
            pt1.segmentIds.length == 2 &&
            pt2.segmentIds.length == 2 &&
            ((pt1.segmentIds[0] == pt2.segmentIds[0] &&
              pt1.segmentIds[1] == pt2.segmentIds[1]) ||
              (pt1.segmentIds[0] == pt2.segmentIds[1] &&
                pt1.segmentIds[1] == pt2.segmentIds[0]))
          ) {
            console.info('ambiguité, ne rien faire');
          }
        }

        new Point({
          coordinates: pt2.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: this.drawColor,
          size: 2,
        });

        let firstCoordinates = pt1.coordinates,
          secondCoordinates = pt2.coordinates;
        let commonSegment = app.mainDrawingEnvironment.getCommonSegmentOfTwoPoints(
          pt1.id,
          pt2.id,
        );
        let shape = pt1.shape;
        let path = [
          'M',
          firstCoordinates.x,
          firstCoordinates.y,
          'L',
          secondCoordinates.x,
          secondCoordinates.y,
        ].join(' ');
        if (commonSegment.isArc()) {
          if (!shape.isCircle()) {
            commonSegment.vertexes[0].ratio = 0;
            commonSegment.vertexes[1].ratio = 1;
            if ((pt1.ratio > pt2.ratio) ^ commonSegment.counterclockwise) {
              [pointsToDivide[0][0], pointsToDivide[0][1]] = [
                pointsToDivide[0][1],
                pointsToDivide[0][0],
              ];
            }
          }
          firstCoordinates = pointsToDivide[0][0].coordinates;
          secondCoordinates = pointsToDivide[0][1].coordinates;
          let centerCoordinates = commonSegment.arcCenter.coordinates,
            firstAngle = centerCoordinates.angleWith(firstCoordinates),
            secondAngle = centerCoordinates.angleWith(secondCoordinates);
          if (secondAngle < firstAngle) secondAngle += 2 * Math.PI;
          let largeArcFlag = secondAngle - firstAngle > Math.PI ? 1 : 0,
            sweepFlag = 1;
          // if (shape.isCircle()) {
          //   if (this.counterclockwise) {
          //     sweepFlag = Math.abs(sweepFlag - 1);
          //     largeArcFlag = Math.abs(largeArcFlag - 1);
          //   }
          // }
          path = [
            'M',
            firstCoordinates.x,
            firstCoordinates.y,
            'A',
            commonSegment.radius,
            commonSegment.radius,
            0,
            largeArcFlag,
            sweepFlag,
            secondCoordinates.x,
            secondCoordinates.y,
          ].join(' ');
        }

        this.mode = 'twoPoints';
        this.pointsToDivide = pointsToDivide;

        new LineShape({
          drawingEnvironment: app.upperDrawingEnvironment,
          strokeColor: this.drawColor,
          strokeWidth: 3,
          path: path,
          id: undefined,
        });
        setState({ tool: { ...app.tool, currentStep: 'divide' } });
      }
    }

    if (app.tool.currentStep == 'divide') {
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
        tool: { ...app.tool, name: this.name, currentStep: 'selectObject' },
      });
    }, 500);
  }

  _executeAction() {
    this.numberOfParts = app.settings.numberOfDivisionParts;
    if (this.mode == 'twoPoints') {
      this.pointsToDivide.forEach(pts => {
        this.firstPoint = pts[0];
        this.secondPoint = pts[1];
        this.segment = app.mainDrawingEnvironment.getCommonSegmentOfTwoPoints(
          this.firstPoint.id,
          this.secondPoint.id,
        );
        if (this.mode == 'segment') {
          if (this.segment.arcCenter) this.segmentModeAddArcPoints();
          else this.segmentModeAddSegPoints();
        } else {
          if (this.segment.arcCenter) {
            this.pointsModeAddArcPoints();
          } else {
            this.pointsModeAddSegPoints();
          }
        }
      });
    } else if (this.mode == 'segment') {
      this.segment = app.mainDrawingEnvironment.findObjectById(
        this.segmentId,
        'segment',
      );
      if (this.mode == 'segment') {
        if (this.segment.arcCenter) this.segmentModeAddArcPoints();
        else this.segmentModeAddSegPoints();
      } else {
        if (this.segment.arcCenter) {
          this.pointsModeAddArcPoints();
        } else {
          this.pointsModeAddSegPoints();
        }
      }
    } else {
      let vector = app.mainDrawingEnvironment.findObjectById(
        this.vectorId,
        'shape',
      );
      let secondPointCoordinates = vector.vertexes[0].coordinates.add(
        vector.vertexes[1].coordinates
          .substract(vector.vertexes[0].coordinates)
          .multiply(1 / this.numberOfParts)
      );
      let path = [
        'M',
        vector.segments[0].vertexes[0].x,
        vector.segments[0].vertexes[0].y,
        'L',
        secondPointCoordinates.x,
        secondPointCoordinates.y,
      ];
      path = path.join(' ');

      let newVector = new ArrowLineShape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: path,
        fillColor: vector.fillColor,
        fillOpacity: vector.fillOpacity,
        strokeColor: vector.strokeColor,
        geometryObject: new GeometryObject({}),
      });
    }
  }

  segmentModeAddArcPoints() {
    this.firstPoint = this.segment.vertexes[0];
    this.secondPoint = this.segment.vertexes[1];
    this.segment.vertexes[1].ratio = 1;
    this.segment.vertexes[0].ratio = 0;

    let shape = this.segment.shape,
      center = this.segment.arcCenter,
      firstAngle = center.coordinates.angleWith(this.firstPoint.coordinates),
      secondAngle = center.coordinates.angleWith(this.secondPoint.coordinates);
    if (this.firstPoint.coordinates.equal(this.secondPoint.coordinates))
      secondAngle += 2 * Math.PI;
    else if (firstAngle > secondAngle) secondAngle += 2 * Math.PI;

    // Pour un cercle entier, on ajoute un point de division supplémentaire
    if (shape.isCircle()) {
      this.segment.addPoint(this.firstPoint.coordinates, this.firstPoint.ratio);
    }

    let ratioCap =
      (this.secondPoint.ratio - this.firstPoint.ratio) / this.numberOfParts;
    if (this.firstPoint.ratio == this.secondPoint.ratio)
      ratioCap = 1 / this.numberOfParts;

    let partAngle = (secondAngle - firstAngle) / this.numberOfParts,
      radius = this.segment.radius;

    if (
      this.segment.counterclockwise &&
      !this.firstPoint.coordinates.equal(this.secondPoint.coordinates)
    ) {
      partAngle = (secondAngle - firstAngle - 2 * Math.PI) / this.numberOfParts;
    }

    for (
      let i = 1, coord = this.firstPoint.coordinates;
      i < this.numberOfParts;
      i++
    ) {
      const newX = radius * Math.cos(firstAngle + partAngle * i) + center.x,
        newY = radius * Math.sin(firstAngle + partAngle * i) + center.y;
      coord = new Coordinates({ x: newX, y: newY });
      let ratio = this.firstPoint.ratio + i * ratioCap;
      this.segment.addPoint(coord, ratio);
    }
  }

  segmentModeAddSegPoints() {
    this.firstPoint = this.segment.vertexes[0];
    this.secondPoint = this.segment.vertexes[1];
    this.pointsModeAddSegPoints();
  }

  pointsModeAddArcPoints() {
    if (this.firstPoint.coordinates.equal(this.segment.vertexes[0].coordinates))
      this.firstPoint.ratio = 0;
    else if (
      this.secondPoint.coordinates.equal(this.segment.vertexes[1].coordinates)
    )
      this.secondPoint.ratio = 1;
    let shape = this.segment.shape,
      centerCoordinates = this.segment.arcCenter.coordinates,
      firstAngle = centerCoordinates.angleWith(this.firstPoint.coordinates),
      secondAngle = centerCoordinates.angleWith(this.secondPoint.coordinates);
    if (secondAngle < firstAngle) {
      secondAngle += Math.PI * 2;
    }
    let ratioCap =
      (this.secondPoint.ratio - this.firstPoint.ratio) / this.numberOfParts;
    if (shape.isCircle()) {
      if (ratioCap < 0) ratioCap += 1 / this.numberOfParts;
    }

    let partAngle = (secondAngle - firstAngle) / this.numberOfParts,
      radius = this.segment.radius;

    for (
      let i = 1, coord = this.firstPoint.coordinates;
      i < this.numberOfParts;
      i++
    ) {
      const newX =
          radius * Math.cos(firstAngle + partAngle * i) + centerCoordinates.x,
        newY =
          radius * Math.sin(firstAngle + partAngle * i) + centerCoordinates.y;
      coord = new Coordinates({ x: newX, y: newY });
      let ratio = this.firstPoint.ratio + i * ratioCap;
      if (ratio > 1) ratio--;
      this.segment.addPoint(coord, ratio);
    }
  }

  pointsModeAddSegPoints() {
    this.segment.vertexes[0].ratio = 0;
    this.segment.vertexes[1].ratio = 1;

    if (this.firstPoint.ratio > this.secondPoint.ratio)
      [this.firstPoint, this.secondPoint] = [this.secondPoint, this.firstPoint];

    const ratioCap =
      (this.secondPoint.ratio - this.firstPoint.ratio) / this.numberOfParts;

    const segLength = this.secondPoint.coordinates.substract(
      this.firstPoint.coordinates,
    );
    const part = segLength.multiply(1 / this.numberOfParts);

    for (
      let i = 1, coord = this.firstPoint.coordinates;
      i < this.numberOfParts;
      i++
    ) {
      coord = coord.add(part);
      let ratio = this.firstPoint.ratio + i * ratioCap;
      this.segment.addPoint(coord, ratio);
    }
  }
}
