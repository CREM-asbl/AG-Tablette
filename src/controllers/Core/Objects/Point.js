import { app } from '../App';
import { addInfoToId, findObjectById, mod, uniqId } from '../Tools/general';
import { Coordinates } from './Coordinates';
import { Segment } from './Segment';

/**
 * Représente un point du plan
 */
export class Point {
  /**
   * @param {String}                      id
   * @param {Coordinates}                 coordinates
   * @param {Number}                      x
   * @param {Number}                      y
   * @param {[String]}                    segmentIds
   * @param {String}                      shapeId
   * @param {String}                      type  -> 'vertex', 'divisionPoint', 'arcCenter' or 'shapeCenter'
   * @param {String}                      name  -> 'firstPoint', 'secondPoint', 'thirdPoint', 'fourthPoint'
   * @param {Number}                      ratio -> the ratio of this between the 2 vertexes of the segment
   */
  constructor({
    id,
    layer,
    coordinates = undefined,
    // x = 0,
    // y = 0,
    shapeId = undefined,
    idx = undefined,
    segmentIds = [],
    type = undefined,
    name = undefined,
    ratio = undefined,
    visible = true,
    color = '#000',
    size = 1,
    reference = null,
    endpointIds = [],
    geometryIsVisible = true,
    geometryIsHidden = false,
  }) {
    if (id === undefined) id = uniqId(layer, 'point');
    else id = addInfoToId(id, layer, 'point');
    this.id = id;
    this.layer = layer;
    this.canvasLayer.points.push(this);

    if (coordinates !== undefined)
      this.coordinates = new Coordinates(coordinates);
    else
      this.coordinates = new Coordinates({
        x: 0, //parseFloat(x),
        y: 0, //parseFloat(y),
      });

    this.shapeId = shapeId;
    if (this.shapeId !== undefined)
      this.canvasLayer.shapes
        .find((s) => s.id === this.shapeId)
        .pointIds.push(this.id);
    this.idx = idx;
    this.segmentIds = [...segmentIds];
    this.type = type;
    this.name = name;
    if (ratio !== undefined) this.ratio = parseFloat(ratio);
    this.visible = visible;
    this.color = color;
    this.size = size;
    this.reference = reference;
    this.endpointIds = [...endpointIds];
    this.geometryIsVisible = geometryIsVisible;
    this.geometryIsHidden = geometryIsHidden;
  }

  get canvasLayer() {
    return app[this.layer + 'CanvasLayer'];
  }

  get shape() {
    const shape = this.canvasLayer.shapes.find((s) => s.id === this.shapeId);
    return shape;
  }

  get segments() {
    const segments = this.segmentIds.map((segId) =>
      this.canvasLayer.segments.find((seg) => seg.id === segId),
    );
    return segments;
  }

  get x() {
    return this.coordinates.x;
  }

  get y() {
    return this.coordinates.y;
  }

  /**
   * move this with coordinates
   * @param {Coordinates} coordinates
   * @param {Boolean} negativeTranslation true if the coordinates must be reversed
   */
  translate(coordinates, negativeTranslation = false) {
    this.coordinates = negativeTranslation
      ? this.coordinates.substract(coordinates)
      : this.coordinates.add(coordinates);
  }

  /**
   * multiplies this with scalar(s)
   * @param {Number} multiplierX
   * @param {Number} multiplierY
   */
  multiply(multiplierX, multiplierY = multiplierX) {
    this.coordinates = this.coordinates.multiply(multiplierX, multiplierY);
  }

  /**
   * rotate a point clockwise
   * @param {number} angle - rotation angle
   * @param {{x: number, y: number}} [center] - rotation center
   * @return {{x: number, y: number}} new coordinates
   */
  rotate(angle, center = { x: 0, y: 0 }) {
    const s = Math.sin(angle),
      c = Math.cos(angle),
      x = this.x - center.x,
      y = this.y - center.y,
      newX = x * c - y * s + center.x,
      newY = x * s + y * c + center.y;
    this.x = newX;
    this.y = newY;
    return this.copy();
  }

  computeTransformConstraint() {
    let constraints = {
      isFree: false,
      isConstrained: false,
      isBlocked: false,
      isConstructed: false,
      lines: [],
      points: [],
    };
    const reference = findObjectById(this.reference);
    if (reference && reference instanceof Point) {
      const reference = findObjectById(this.reference);
      reference.computeTransformConstraint();
      constraints = reference.transformConstraints;
    } else if (this.type === 'divisionPoint' || this.type === 'shapeCenter') {
      constraints.isConstructed = true;
    } else if (this.shape.geometryObject.geometryTransformationName !== null) {
      constraints.isConstructed = true;
    } else if (
      this.shape.geometryObject.geometryDuplicateParentShapeId !== null
    ) {
      constraints.isConstructed = true;
    } else if (this.shape.familyName === 'copy') {
      constraints.isConstructed = true;
    } else {
      if (this.shape.familyName === 'Regular') {
        if (this.idx < 2) {
          constraints.isFree = true;
        } else {
          constraints.isConstructed = true;
        }
      } else if (this.shape.familyName === 'Irregular') {
        if (this.shape.points.some((pt) => pt.type === 'arcCenter')) {
          constraints.isBlocked = true;
        } else {
          constraints.isFree = true;
        }
      } else if (this.shape.name === 'RightAngleTriangle') {
        if (this.idx < 2) {
          constraints.isFree = true;
        } else {
          constraints.isConstrained = true;
          constraints.lines = [
            {
              segment: this.shape.segments[1],
              isInfinite: true,
            },
          ];
        }
      } else if (this.shape.name === 'IsoscelesTriangle') {
        if (this.idx < 2) {
          constraints.isFree = true;
        } else {
          constraints.isConstrained = true;

          const firstSeg = this.shape.segments[0];
          const middleOfSegment = firstSeg.middle;
          constraints.lines = [
            {
              segment: new Segment({
                layer: 'invisible',
                createFromNothing: true,
                vertexCoordinates: [this.coordinates, middleOfSegment],
              }),
              isInfinite: true,
            },
          ];
        }
      } else if (this.shape.name === 'RightAngleIsoscelesTriangle') {
        if (this.idx < 2) {
          constraints.isFree = true;
        } else {
          constraints.isConstrained = true;
          const firstSeg = this.shape.segments[0];
          const segmentLength = firstSeg.length;
          const angle = firstSeg.getAngleWithHorizontal();
          const perpendicularAngle = angle + Math.PI / 2;
          const firstPoint = new Coordinates({
            x:
              firstSeg.vertexes[1].x +
              Math.cos(perpendicularAngle) * segmentLength,
            y:
              firstSeg.vertexes[1].y +
              Math.sin(perpendicularAngle) * segmentLength,
          });
          const secondPoint = new Coordinates({
            x:
              firstSeg.vertexes[1].x -
              Math.cos(perpendicularAngle) * segmentLength,
            y:
              firstSeg.vertexes[1].y -
              Math.sin(perpendicularAngle) * segmentLength,
          });
          constraints.points.push(firstPoint);
          constraints.points.push(secondPoint);
        }
      } else if (this.shape.name === 'Rectangle') {
        if (this.idx < 2) {
          constraints.isFree = true;
        } else if (this.idx === 2) {
          constraints.isConstrained = true;

          constraints.lines = [
            {
              segment: this.shape.segments[1],
              isInfinite: true,
            },
          ];
        } else {
          constraints.isConstructed = true;
        }
      } else if (this.shape.name === 'Losange') {
        if (this.idx < 2) {
          constraints.isFree = true;
        } else if (this.idx === 2) {
          constraints.isConstrained = true;
          const constraintLine = {
            segment: new Segment({
              layer: 'invisible',
              createFromNothing: true,
              vertexCoordinates: [this.shape.vertexes[0].coordinates],
              arcCenterCoordinates: this.shape.vertexes[1].coordinates,
            }),
          };
          constraintLine.segment.vertexIds[1] =
            constraintLine.segment.vertexIds[0];
          constraints.lines = [constraintLine];
        } else {
          constraints.isConstructed = true;
        }
      } else if (this.shape.name === 'Parallelogram') {
        if (this.idx < 3) {
          constraints.isFree = true;
        } else {
          constraints.isConstructed = true;
        }
      } else if (this.shape.name === 'RightAngleTrapeze') {
        if (this.idx < 2) {
          constraints.isFree = true;
        } else {
          constraints.isConstrained = true;

          constraints.lines = [
            {
              segment: this.shape.segments[this.idx - 1],
              isInfinite: true,
            },
          ];
        }
      } else if (this.shape.name === 'IsoscelesTrapeze') {
        if (this.idx < 3) {
          constraints.isFree = true;
        } else {
          constraints.isConstrained = true;
        }
      } else if (this.shape.name === 'Trapeze') {
        if (this.idx < 3) {
          constraints.isFree = true;
        } else {
          constraints.isConstrained = true;
          constraints.lines = [
            {
              segment: new Segment({
                layer: 'invisible',
                createFromNothing: true,
                vertexCoordinates: [
                  this.shape.vertexes[2].coordinates,
                  this.shape.vertexes[3].coordinates,
                ],
              }),
              isInfinite: true,
            },
          ];
        }
      } else if (this.shape.name === 'Circle') {
        constraints.isFree = true;
      } else if (this.shape.name === 'CirclePart') {
        if (this.type === 'arcCenter') {
          constraints.isFree = true;
        } else if (this.idx <= 1) {
          constraints.isFree = true;
        } else {
          constraints.isConstrained = true;
          constraints.lines = [
            {
              segment: new Segment({
                layer: 'invisible',
                createFromNothing: true,
                vertexCoordinates: [this.coordinates, this.coordinates],
                arcCenterCoordinates: this.segments[0].arcCenter.coordinates,
              }),
            },
          ];
        }
      } else if (this.shape.name === 'CircleArc') {
        if (this.type === 'arcCenter') {
          constraints.isFree = true;
        } else if (this.idx === 0) {
          constraints.isFree = true;
        } else {
          constraints.isConstrained = true;
          constraints.lines = [
            {
              segment: new Segment({
                layer: 'invisible',
                createFromNothing: true,
                vertexCoordinates: [this.coordinates, this.coordinates],
                arcCenterCoordinates: this.segments[0].arcCenter.coordinates,
              }),
            },
          ];
        }
      } else if (
        this.shape.name === '30degreesArc' ||
        this.shape.name === '45degreesArc'
      ) {
        if (this.type === 'arcCenter') {
          constraints.isFree = true;
        } else if (this.idx === 0) {
          constraints.isFree = true;
        } else {
          constraints.isBlocked = true;
        }
      } else if (this.shape.familyName === 'Line') {
        if (
          (this.shape.name === 'ParalleleSegment' ||
            this.shape.name === 'ParalleleSemiStraightLine') &&
          this.idx === 1
        ) {
          constraints.isConstrained = true;
          const reference = findObjectById(
            this.shape.geometryObject.geometryParentObjectId1,
          );
          const referenceAngle = reference.getAngleWithHorizontal();
          const constraintLine = {
            segment: new Segment({
              layer: 'invisible',
              createFromNothing: true,
              vertexCoordinates: [
                this.shape.vertexes[0],
                this.shape.vertexes[0].coordinates.add(
                  new Coordinates({
                    x: 100 * Math.cos(referenceAngle),
                    y: 100 * Math.sin(referenceAngle),
                  }),
                ),
              ],
            }),
            isInfinite: true,
          };
          constraints.lines = [constraintLine];
        } else if (
          (this.shape.name === 'PerpendicularSegment' ||
            this.shape.name === 'PerpendicularSemiStraightLine') &&
          this.idx === 1
        ) {
          constraints.isConstrained = true;
          const reference = findObjectById(
            this.shape.geometryObject.geometryParentObjectId1,
          );
          const referenceAngle =
            reference.getAngleWithHorizontal() + Math.PI / 2;
          const constraintLine = {
            segment: new Segment({
              layer: 'invisible',
              createFromNothing: true,
              vertexCoordinates: [
                this.shape.vertexes[0],
                this.shape.vertexes[0].coordinates.add(
                  new Coordinates({
                    x: 100 * Math.cos(referenceAngle),
                    y: 100 * Math.sin(referenceAngle),
                  }),
                ),
              ],
            }),
            isInfinite: true,
          };
          constraints.lines = [constraintLine];
        } else if (this.idx === 0) {
          constraints.isFree = true;
        } else if (
          (this.shape.name === 'Segment' ||
            this.shape.name === 'SemiStraightLine' ||
            this.shape.name === 'StraightLine' ||
            this.shape.name === 'Vector') &&
          this.idx === 1
        ) {
          constraints.isFree = true;
        } else if (this.idx === 1) {
          constraints.isConstructed = true;
        }
      } else if (this.shape.familyName === 'Point') {
        if (this.shape.name === 'Point') {
          constraints.isFree = true;
        } else if (
          this.shape.name === 'PointOnLine' ||
          this.shape.name === 'PointOnShape'
        ) {
          constraints.isConstrained = true;
        } else {
          constraints.isConstructed = true;
        }
      }
    }
    if (reference && reference instanceof Segment) {
      if (constraints.isFree) {
        constraints.isFree = false;
        constraints.isConstrained = true;
        constraints.lines = [
          {
            segment: reference,
          },
        ];
      } else if (constraints.isConstrained) {
        constraints.isConstrained = false;
        constraints.isBlocked = true;
        constraints.lines.push({
          segment: reference,
        });
      }
    }
    this.transformConstraints = constraints;
  }

  /**
   * convertit en balise circle de svg
   */
  toSVG() {
    const canvasCoordinates = this.coordinates.toCanvasCoordinates();
    return (
      '<circle cx="' +
      canvasCoordinates.x +
      '" cy="' +
      canvasCoordinates.y +
      '" r="' +
      this.size * 2 * app.workspace.zoomLevel +
      '" fill="' +
      this.color +
      '" />\n'
    );
  }

  /**
   * get the positive angle figured by the 2 segments of the vertex in 0 =< value < 2 * Math.PI
   * @param {Boolean} reduced   return value reduced to 0 =< value < Math.PI
   */
  getVertexAngle(reduced = false) {
    const shape = this.shape,
      segment = this.segments[0],
      nextSegment = this.segments[1];

    const angle1 = segment.getAngleWithHorizontal();
    const angle2 = nextSegment.getAngleWithHorizontal();

    let resultAngle = mod(angle1 - angle2, 2 * Math.PI);
    if (reduced && resultAngle > Math.PI)
      resultAngle = 2 * Math.PI - resultAngle;

    return resultAngle;
  }

  saveToObject() {
    return this.saveData();
  }

  saveData() {
    const data = {
      id: this.id,
      coordinates: this.coordinates,
      shapeId: this.shapeId,
      position: this.layer,
      idx: this.idx,
      segmentIds: [...this.segmentIds],
    };

    if (this.type !== undefined) data.type = this.type;
    if (this.name !== undefined) data.name = this.name;
    if (this.ratio !== undefined) data.ratio = this.ratio;
    if (this.visible !== true) data.visible = this.visible;
    if (this.color !== '#000') data.color = this.color;
    if (this.size !== 1) data.size = this.size;
    if (this.reference !== null) data.reference = this.reference;
    if (this.endpointIds.length !== 0) data.endpointIds = [...this.endpointIds];
    if (this.geometryIsVisible !== true)
      data.geometryIsVisible = this.geometryIsVisible;
    if (this.geometryIsHidden !== false)
      data.geometryIsHidden = this.geometryIsHidden;
    return data;
  }

  static loadFromData(data) {
    if (!data.position) data.position = 'main';
    const point = new Point({ layer: data.position });
    Object.assign(point, data);
    point.coordinates = new Coordinates(point.coordinates);
    point.segmentIds = [...data.segmentIds];
    if (data.endpointIds) point.endpointIds = [...data.endpointIds];
    if (app.environment.name === 'Tangram') {
      point.startTangramCoordinates = new Coordinates(point.coordinates);
    }
  }
}
