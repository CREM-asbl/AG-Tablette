import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { Coordinates } from '../Core/Objects/Coordinates';

export class DivideAction extends Action {
  constructor() {
    super('DivideAction');

    // Nombre de parties de découpe (numberOfParts - 1 points)
    this.numberOfParts = null;

    // Mode de découpe: 'segment' ou 'twoPoints'
    this.mode = null;

    // Segment, si mode segment
    this.segment = null;

    // Premier point, si mode twoPoints
    this.firstPoint = null;

    // Second point, si mode twoPoints
    this.secondPoint = null;

    // Points existants sur le segment avant division
    this.existingPoints = null;
  }

  initFromObject(save) {
    this.numberOfParts = save.numberOfParts;
    this.mode = save.mode;
    if (this.mode == 'twoPoints') {
      this.firstPoint = app.mainDrawingEnvironment.findObjectById(
        save.firstPointId,
        'point'
      );
      this.secondPoint = app.mainDrawingEnvironment.findObjectById(
        save.secondPointId,
        'point'
      );
    }
    this.segment = app.mainDrawingEnvironment.findObjectById(
      save.segmentId,
      'segment'
    );
    // if (this.mode == 'twoPoints') {
    //   this.firstPoint = new Point();
    //   this.firstPoint.initFromObject(save.firstPoint);
    //   this.secondPoint = new Point();
    //   this.secondPoint.initFromObject(save.secondPoint);
    // }
    // if (save.segment) {
    //   this.segment = Segment.retrieveFrom(save.segment);
    // } else {
    //   // for update history from 1.0.0
    //   this.segment = ShapeManager.getShapeById(save.shapeId).segments[
    //     save.segmentIndex
    //   ];
    //   if (this.mode == 'twoPoints') {
    //     this.firstPoint.segment = this.segment;
    //     this.secondPoint.segment = this.segment;
    //   }
    // }

    // if (save.existingPoints) {
    //   this.existingPoints = save.existingPoints.map(pt => {
    //     return new Point(pt);
    //   });
    // } else {
    //   // for update history from 1.0.0
    //   this.existingPoints = this.segment.points.map(pt => {
    //     return new Point(pt);
    //   });
    //   if (this.mode == 'twoPoints') {
    //     window.dispatchEvent(
    //       new CustomEvent('update-history', {
    //         detail: {
    //           name: 'DivideAction',
    //           mode: 'twoPoints',
    //           firstPoint: this.firstPoint,
    //           secondPoint: this.secondPoint,
    //           numberOfParts: this.numberOfParts,
    //           segment: this.segment,
    //           existingPoints: this.existingPoints,
    //         },
    //       })
    //     );
    //   } else {
    //     window.dispatchEvent(
    //       new CustomEvent('update-history', {
    //         detail: {
    //           name: 'DivideAction',
    //           mode: 'segment',
    //           numberOfParts: this.numberOfParts,
    //           segment: this.segment,
    //           existingPoints: this.existingPoints,
    //         },
    //       })
    //     );
    //   }
    // }
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!Number.isFinite(this.numberOfParts)) {
      this.printIncompleteData();
      return false;
    }
    if (this.mode != 'segment' && this.mode != 'twoPoints') {
      this.printIncompleteData();
      return false;
    }
    if (this.mode == 'segment' && !this.segment) {
      this.printIncompleteData();
      return false;
    }
    if (this.mode == 'twoPoints' && (!this.firstPoint || !this.secondPoint)) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    if (this.existingPoints === undefined) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
  do() {
    if (!this.checkDoParameters()) return;

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
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    this.segment.points
      .filter(pt => !this.existingPoints.find(extPt => extPt.equal(pt)))
      .forEach(pt => this.segment.deletePoint(pt));
  }

  segmentModeAddArcPoints() {
    let shape = this.segment.shape,
      center = this.segment.arcCenter,
      firstAngle = center.getAngle(this.segment.vertexes[0]),
      secondAngle = center.getAngle(this.segment.vertexes[1]);
    if (this.segment.counterclockwise)
      [firstAngle, secondAngle] = [secondAngle, firstAngle];
    if (this.segment.vertexes[0].equal(this.segment.vertexes[1]))
      secondAngle += 2 * Math.PI;
    else if (firstAngle > secondAngle) secondAngle += 2 * Math.PI;

    // Pour un cercle entier, on ajoute un point de division supplémentaire
    if (shape.isCircle())
      this.segment.addPoint(new Point(this.segment.vertexes[1]));

    let partAngle = (secondAngle - firstAngle) / this.numberOfParts,
      radius = this.segment.radius;

    for (
      let i = 1, nextPt = this.segment.vertexes[0];
      i < this.numberOfParts;
      i++
    ) {
      const newX = radius * Math.cos(firstAngle + partAngle * i) + center.x,
        newY = radius * Math.sin(firstAngle + partAngle * i) + center.y;
      nextPt = nextPt.copy();
      nextPt.setCoordinates({ x: newX, y: newY });
      this.segment.addPoint(nextPt);
    }
  }

  segmentModeAddSegPoints() {
    this.firstPoint = this.segment.vertexes[0];
    this.secondPoint = this.segment.vertexes[1];
    this.pointsModeAddSegPoints();
  }

  pointsModeAddArcPoints() {
    let shape = this.segment.shape,
      center = this.segment.arcCenter,
      firstAngle = center.getAngle(this.firstPoint),
      secondAngle = center.getAngle(this.secondPoint);
    if (!shape.isCircle()) {
      let firstVertexAngle = this.segment.arcCenter.getAngle(
          this.segment.vertexes[0]
        ),
        secondVertexAngle = this.segment.arcCenter.getAngle(
          this.segment.vertexes[1]
        );
      if (this.segment.counterclockwise)
        [firstVertexAngle, secondVertexAngle] = [
          secondVertexAngle,
          firstVertexAngle,
        ];
      if (firstAngle < firstVertexAngle) firstAngle += Math.PI * 2;
      if (secondAngle < firstVertexAngle) secondAngle += Math.PI * 2;
      if (secondVertexAngle < firstVertexAngle)
        secondVertexAngle += Math.PI * 2;
      if ((secondAngle < firstAngle) ^ this.segment.counterclockwise) {
        [firstAngle, secondAngle] = [secondAngle, firstAngle];
      }
    }
    if (secondAngle < firstAngle) secondAngle += Math.PI * 2;

    let partAngle = (secondAngle - firstAngle) / this.numberOfParts,
      radius = this.segment.radius;

    for (let i = 1, nextPt = this.firstPoint; i < this.numberOfParts; i++) {
      const newX = radius * Math.cos(firstAngle + partAngle * i) + center.x,
        newY = radius * Math.sin(firstAngle + partAngle * i) + center.y;
      nextPt = nextPt.copy();
      nextPt.setCoordinates({ x: newX, y: newY });
      this.segment.addPoint(nextPt);
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
      this.firstPoint.coordinates
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
