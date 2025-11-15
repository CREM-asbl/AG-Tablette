import { app } from '../../App';
import { removeObjectById } from '../../Tools/general';
import { Coordinates } from '../Coordinates';
import { Point } from '../Point';
import { Segment } from '../Segment';
import { GeometryObject } from './GeometryObject';
import { RegularShape } from './RegularShape';

/**
 * Représente un cube
 */
export class CubeShape extends RegularShape {
  constructor({
    id,
    layer,

    path = undefined,
    segmentIds = [],
    pointIds = [],
    divisionPointInfos = [],

    name = 'Custom',
    familyName = 'Custom',

    strokeColor = '#000',
    strokeWidth = 1,
    fillColor = '#f46c2e',
    fillOpacity = 1,

    isPointed = true,
    size = 2,
    _isCenterShown = undefined,
    isReversed = false,
    isBiface = false,
  }) {
    super(arguments[0]);

    // this.fillColor = fillColor;
    // this.fillOpacity = fillOpacity;
  }

  setSegmentsFromPath(path) {
    const allPathElements = path
      .split(/[ \n]/)
      .filter((element) => element !== '');
    let firstVertex, lastVertex, startVertex;

    let segmentIdx = 0;
    let vertexIdx = 0;

    this.pointIds = [];
    this.segmentIds = [];

    let nextVertexCoordinates = null;

    const createLineTo = (x, y) => {
      const coordinates = new Coordinates({ x, y });
      firstVertex = lastVertex;
      lastVertex = this.points.find((pt) => pt.coordinates.equal(coordinates));
      const lastPointDrawn = this.points[this.points.length - 1];
      if (
        lastVertex === undefined ||
        lastVertex.type !== 'vertex' ||
        (lastPointDrawn.coordinates.equal(coordinates) &&
          lastPointDrawn.type === 'vertex')
      ) {
        lastVertex = new Point({
          coordinates: coordinates,
          shapeId: this.id,
          layer: this.layer,
          type: 'vertex',
          idx: vertexIdx++,
          visible: this.isPointed,
        });
      }
      new Segment({
        shapeId: this.id,
        layer: this.layer,
        idx: segmentIdx++,
        vertexIds: [firstVertex.id, lastVertex.id],
      });
    };

    if (allPathElements[0] !== 'M')
      startVertex = lastVertex = new Point({
        shapeId: this.id,
        layer: this.layer,
        type: 'vertex',
        idx: vertexIdx++,
        visible: this.isPointed,
      });

    while (allPathElements.length) {
      const element = allPathElements.shift();

      switch (element) {
        case 'M':
        case 'm':
          nextVertexCoordinates = new Coordinates({
            x: allPathElements.shift(),
            y: allPathElements.shift(),
          });
          if (this.contains(nextVertexCoordinates)) {
            startVertex = lastVertex = this.points.find((pt) =>
              pt.coordinates.equal(nextVertexCoordinates),
            );
          } else {
            startVertex = lastVertex = new Point({
              coordinates: nextVertexCoordinates,
              shapeId: this.id,
              layer: this.layer,
              type: 'vertex',
              idx: vertexIdx++,
              visible: this.isPointed,
            });
          }
          break;

        case 'L':
        case 'l':
          createLineTo(allPathElements.shift(), allPathElements.shift());
          break;

        case 'H':
        case 'h':
          createLineTo(allPathElements.shift(), lastVertex.y);
          break;

        case 'V':
        case 'v':
          createLineTo(lastVertex.x, allPathElements.shift());
          break;

        case 'A':
        case 'a':
          const rx = allPathElements.shift(),
            ry = allPathElements.shift(),
            xAxisRotation = allPathElements.shift(),
            largeArcFlag = allPathElements.shift(),
            sweepFlag = allPathElements.shift();

          firstVertex = lastVertex;
          nextVertexCoordinates = new Coordinates({
            x: allPathElements.shift(),
            y: allPathElements.shift(),
          });
          lastVertex = this.points.find((pt) =>
            pt.coordinates.equal(nextVertexCoordinates),
          );
          if (lastVertex === undefined || lastVertex.type !== 'vertex') {
            lastVertex = new Point({
              coordinates: nextVertexCoordinates,
              shapeId: this.id,
              layer: this.layer,
              type: 'vertex',
              idx: vertexIdx++,
              visible: this.isPointed,
            });
          }

          const arcCenter = this.getArcCenterFromSVG(
            firstVertex,
            lastVertex,
            rx,
            largeArcFlag,
            sweepFlag,
          );

          const segment = new Segment({
            shapeId: this.id,
            layer: this.layer,
            idx: segmentIdx++,
            vertexIds: [firstVertex.id, lastVertex.id],
            arcCenterId: arcCenter.id,
            counterclockwise: Number(sweepFlag) === 0,
          });
          arcCenter.segmentIds.push(segment.id);

          this.cleanSameDirectionSegment();

          break;

        case 'Z':
        case 'z':
          createLineTo(startVertex.x, startVertex.y);
          break;

        default:
          break;
      }
    }
    // if segment length == 0
    if (
      app.environment.name === 'Geometrie' &&
      !this.isCircle() &&
      this.points.filter((pt) => pt.type !== 'arcCenter').length !==
      this.segmentIds.length
    ) {
      const coord = this.points[0].coordinates;
      const numberOfSegment = this.segmentIds.length;
      this.pointIds.forEach((ptId) => removeObjectById(ptId));
      this.segmentIds.forEach((segId) => removeObjectById(segId));
      this.pointIds = [];
      this.segmentIds = [];
      for (let idx = 0; idx < numberOfSegment; idx++) {
        new Point({
          coordinates: coord,
          shapeId: this.id,
          layer: this.layer,
          type: 'vertex',
          idx,
          visible: this.isPointed,
        });
      }
      for (let idx = 0; idx < numberOfSegment; idx++) {
        new Segment({
          shapeId: this.id,
          layer: this.layer,
          idx,
          vertexIds: [
            this.pointIds[idx],
            this.pointIds[(idx + 1) % numberOfSegment],
          ],
        });
      }
    }
  }

  saveData() {
    const data = super.saveData();
    data.type = 'CubeShape';
    // data.fillColor = this.fillColor;
    // data.fillOpacity = this.fillOpacity;
    if (this.fillColor !== '#f46c2e') data.fillColor = this.fillColor;
    if (this.fillOpacity !== 1) data.fillOpacity = this.fillOpacity;
    return data;
  }

  static loadFromData(data) {
    if (!data.position) {
      data.position = 'main';
    }
    const shape = new CubeShape({
      layer: data.position,
    });
    Object.assign(shape, data);
    shape.segmentIds = [...data.segmentIds];
    shape.pointIds = [...data.pointIds];
    if (data.geometryObject)
      shape.geometryObject = GeometryObject.loadFromData(data.geometryObject);
  }
}
