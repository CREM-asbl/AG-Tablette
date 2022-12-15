import { html } from 'lit';
import { app, setState } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Tool } from '../Core/States/Tool';
import { createElem, findObjectById, removeObjectById } from '../Core/Tools/general';

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

    this.drawColors = ['#E90CC8', app.settings.referenceDrawColor, app.settings.referenceDrawColor2, '#3e6aed', '#21eb53'];

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

  start() {
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    createElem('divide-popup');
  }

  selectObject() {
    app.upperCanvasLayer.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectSecondPoint() {
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    let firstPoint = findObjectById(
      app.tool.firstPointIds[0]
    );
    new Point({
      coordinates: firstPoint.coordinates,
      layer: 'upper',
      color: this.drawColors[0],
      size: 2,
    });
    // window.dispatchEvent(new CustomEvent('refreshUpper'));
    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  chooseArcDirection() {
    this.removeListeners();
    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  divide() {
    this.removeListeners();
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
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
      app.workspace.selectionConstraints.segments.blacklist = app.mainCanvasLayer.shapes
        .filter((s) => s.isStraightLine() || s.isSemiStraightLine())
        .map((s) => {
          return { shapeId: s.id };
        });
      app.workspace.selectionConstraints.points.canSelect = true;
      app.workspace.selectionConstraints.points.numberOfObjects = 'allSuperimposed';
    } else if (app.tool.currentStep == 'selectSecondPoint') {
      app.workspace.selectionConstraints.points.canSelect = true;
      app.workspace.selectionConstraints.points.numberOfObjects = 'allSuperimposed';
    } else if (app.tool.currentStep == 'chooseArcDirection') {
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.whitelist = this.lines.map(ln => { return { shapeId: ln.id }});
      app.workspace.selectionConstraints.segments.canSelectFromUpper = true;
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
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les vecteurs ne peuvent pas être divisés, mais peuvent être multipliés.' } }));
          return;
        } else {
          this.segmentId = object.id;

          new LineShape({
            layer: 'upper',
            strokeColor: this.drawColors[0],
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
      let pt1 = findObjectById(
        this.firstPointIds[0]
      );
      let object1 = object[0];

      if (pt1.coordinates.dist(object1.coordinates) < 0.01) {
        // pt1 == object => désélectionner le point.
        removeObjectById(
          app.upperCanvasLayer.points[0].id
        );

        setState({ tool: { ...app.tool, currentStep: 'selectObject' } });
      } else {
        let pointsToDivide = [];
        let firstPoints = this.firstPointIds.map(ptId => findObjectById(
          ptId
        ));
        let newObjects = [...object];
        for (let i = 0; i < firstPoints.length; i++) {
          for (let j = 0; j < newObjects.length; j++) {
            let firstSegmentIds;
            if (firstPoints[i].shape.name == 'PointOnLine')
              firstSegmentIds = [firstPoints[i].shape.geometryObject.geometryParentObjectId1];
            else if (firstPoints[i].shape.name.startsWith('PointOnIntersection'))
              firstSegmentIds = [firstPoints[i].shape.geometryObject.geometryParentObjectId1, firstPoints[i].shape.geometryObject.geometryParentObjectId2];
            else
              firstSegmentIds = firstPoints[i].segmentIds;
            let secondSegmentIds;
            if (newObjects[j].shape.name == 'PointOnLine')
              secondSegmentIds = [newObjects[j].shape.geometryObject.geometryParentObjectId1];
            else if (newObjects[j].shape.name.startsWith('PointOnIntersection'))
              secondSegmentIds = [newObjects[j].shape.geometryObject.geometryParentObjectId1, newObjects[j].shape.geometryObject.geometryParentObjectId2];
            else
              secondSegmentIds = newObjects[j].segmentIds;
            for (let m = 0; m < firstSegmentIds.length; m++) {
              for (let n = 0; n < secondSegmentIds.length; n++) {
                if (firstSegmentIds[m] == secondSegmentIds[n]) {
                  pointsToDivide.push([firstPoints[i], newObjects[j], firstSegmentIds[m]]);
                }
              }
            }
          }
        }
        if (pointsToDivide.length == 0) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail : { message : 'Les points de la division doivent appartenir au même segment' } }));
          return;
        }

        new Point({
          coordinates: pointsToDivide[0][1].coordinates,
          layer: 'upper',
          color: this.drawColors[0],
          size: 2,
        });

        let mustChooseArc = false;

        pointsToDivide.forEach((pts, idx) => {
          let firstCoordinates = pointsToDivide[0][0].coordinates;
          let secondCoordinates = pointsToDivide[0][1].coordinates;
          let commonSegment = findObjectById(pts[2]);
          let shape = commonSegment.shape;
          let path1 = [
            'M',
            firstCoordinates.x,
            firstCoordinates.y,
            'L',
            secondCoordinates.x,
            secondCoordinates.y,
          ].join(' '),
            path2;
          if (commonSegment.isArc()) {
            if (!shape.isCircle()) {
              commonSegment.vertexes[0].ratio = 0;
              commonSegment.vertexes[1].ratio = 1;
              if ((pts[0].ratio > pts[1].ratio) ^ commonSegment.counterclockwise) {
                [pointsToDivide[idx][0], pointsToDivide[idx][1]] = [
                  pointsToDivide[idx][1],
                  pointsToDivide[idx][0],
                ];
                [firstCoordinates, secondCoordinates] = [secondCoordinates, firstCoordinates];
              }
            } else {
              if (pointsToDivide.length == 1) {
                mustChooseArc = true;
              }
            }
            let centerCoordinates = commonSegment.arcCenter.coordinates,
              firstAngle = centerCoordinates.angleWith(firstCoordinates),
              secondAngle = centerCoordinates.angleWith(secondCoordinates);
            if (secondAngle < firstAngle) secondAngle += 2 * Math.PI;
            let largeArcFlag = secondAngle - firstAngle > Math.PI ? 1 : 0,
              sweepFlag = 1;
            path1 = [
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
            path2 = [
              'M',
              firstCoordinates.x,
              firstCoordinates.y,
              'A',
              commonSegment.radius,
              commonSegment.radius,
              0,
              1 - largeArcFlag,
              1 - sweepFlag,
              secondCoordinates.x,
              secondCoordinates.y,
            ].join(' ');
          }
          if (mustChooseArc) {
            this.lines = [new LineShape({
              layer: 'upper',
              strokeColor: this.drawColors[idx + 1],
              strokeWidth: 3,
              path: path1,
              id: undefined,
            }), new LineShape({
              layer: 'upper',
              strokeColor: this.drawColors[idx + 2],
              strokeWidth: 3,
              path: path2,
              id: undefined,
            })];
          } else {
            new LineShape({
              layer: 'upper',
              strokeColor: this.drawColors[idx],
              strokeWidth: 3,
              path: path1,
              id: undefined,
            })
          }
        });

        this.mode = 'twoPoints';
        this.pointsToDivide = pointsToDivide;
        if (mustChooseArc) {
          setState({ tool: { ...app.tool, currentStep: 'chooseArcDirection' } });
        } else {
          setState({ tool: { ...app.tool, currentStep: 'divide' } });
        }
      }
    } else if (app.tool.currentStep == 'chooseArcDirection') {
      this.arcDirectionCounterclockwise = object.counterclockwise;
      setState({ tool: { ...app.tool, currentStep: 'divide' } });
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'selectObject' },
      });
      return;
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
        this.segment = findObjectById(pts[2]);
        if (this.segment.arcCenter)
          this.pointsModeAddArcPoints();
        else
          this.pointsModeAddSegPoints();
      });
    } else if (this.mode == 'segment') {
      this.segment = findObjectById(
        this.segmentId
      );
      if (this.segment.arcCenter) this.segmentModeAddArcPoints();
      else this.segmentModeAddSegPoints();
    } else {
      let vector = findObjectById(
        this.vectorId
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

      let newShape = new ArrowLineShape({
        layer: 'main',
        path: path,
        name: vector.name,
        familyName: 'duplicate',
        fillColor: vector.fillColor,
        fillOpacity: vector.fillOpacity,
        strokeColor: vector.strokeColor,
        geometryObject: new GeometryObject({
          geometryDuplicateParentShapeId: vector.id,
          geometryConstructionSpec: {
            numberOfParts: this.numberOfParts,
          }
        }),
      });
      vector.geometryObject.geometryDuplicateChildShapeIds.push(newShape.id);
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
      this.segment.addPoint(this.firstPoint.coordinates, this.firstPoint.ratio, this.firstPoint.id, this.secondPoint.id);
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
      this.segment.addPoint(coord, ratio, this.firstPoint.id, this.secondPoint.id);
    }
  }

  segmentModeAddSegPoints() {
    this.firstPoint = this.segment.vertexes[0];
    this.secondPoint = this.segment.vertexes[1];
    this.pointsModeAddSegPoints();
  }

  pointsModeAddArcPoints() {
    // if (this.firstPoint.coordinates.equal(this.segment.vertexes[0].coordinates))
    //   this.firstPoint.ratio = 0;
    // else if (
    //   this.secondPoint.coordinates.equal(this.segment.vertexes[1].coordinates)
    // )
    //   this.secondPoint.ratio = 1;
    let shape = this.segment.shape,
      centerCoordinates = this.segment.arcCenter.coordinates,
      firstAngle = centerCoordinates.angleWith(this.firstPoint.coordinates),
      secondAngle = centerCoordinates.angleWith(this.secondPoint.coordinates);
    if (this.arcDirectionCounterclockwise) {
      [firstAngle, secondAngle] = [secondAngle, firstAngle];
    }
    if (secondAngle < firstAngle) {
      secondAngle += Math.PI * 2;
    }
    let ratioCap =
      // (this.secondPoint.ratio - this.firstPoint.ratio)
      1 / this.numberOfParts;
    // if (shape.isCircle()) {
    //   if (ratioCap < 0) ratioCap += 1 / this.numberOfParts;
    // }

    let partAngle = (secondAngle - firstAngle) / this.numberOfParts,
      radius = this.segment.radius;

    for (
      let i = 1;//, coord = this.firstPoint.coordinates;
      i < this.numberOfParts;
      i++
    ) {
      const newX =
          radius * Math.cos(firstAngle + partAngle * i) + centerCoordinates.x,
        newY =
          radius * Math.sin(firstAngle + partAngle * i) + centerCoordinates.y;
      let coord = new Coordinates({ x: newX, y: newY });
      let ratio = //this.firstPoint.ratio +
        i * ratioCap;
      if (ratio > 1) ratio--;
      this.segment.addPoint(coord, ratio, this.firstPoint.id, this.secondPoint.id);
    }
  }

  pointsModeAddSegPoints() {
    if (this.firstPoint.ratio > this.secondPoint.ratio)
      [this.firstPoint, this.secondPoint] = [this.secondPoint, this.firstPoint];

    const ratioCap =
      //(this.secondPoint.ratio - this.firstPoint.ratio)
      1 / this.numberOfParts;

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
      let ratio = //this.firstPoint.ratio +
        i * ratioCap;
      this.segment.addPoint(coord, ratio, this.firstPoint.id, this.secondPoint.id);
    }
  }
}
