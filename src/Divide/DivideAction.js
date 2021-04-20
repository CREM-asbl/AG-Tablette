import { Action } from '../Core/States/Action';
import { app } from '../Core/App';
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
        'point',
      );
      this.secondPoint = app.mainDrawingEnvironment.findObjectById(
        save.secondPointId,
        'point',
      );
    }
    this.segment = app.mainDrawingEnvironment.findObjectById(
      save.segmentId,
      'segment',
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
      .filter((pt) => !this.existingPoints.find((extPt) => extPt.equal(pt)))
      .forEach((pt) => this.segment.deletePoint(pt));
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
    if (shape.isCircle()) this.segment.vertexes[0].visible = true;

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
