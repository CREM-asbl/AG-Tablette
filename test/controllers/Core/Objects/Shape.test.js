import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => {
  const main = { segments: [], points: [], shapes: [] };
  return { app: { mainCanvasLayer: main, settings: { areShapesPointed: false }, environment: { name: 'Test' } } };
});

import { app } from '@controllers/Core/App';
import { Coordinates } from '@controllers/Core/Objects/Coordinates';
import { Segment } from '@controllers/Core/Objects/Segment';
import { Shape } from '@controllers/Core/Objects/Shapes/Shape';

describe('Shape basic', () => {
  beforeEach(() => {
    // reset arrays
    app.mainCanvasLayer.segments.length = 0;
    app.mainCanvasLayer.points.length = 0;
    app.mainCanvasLayer.shapes.length = 0;
  });

  it('saveData includes ids and path', () => {
    // create dummy segment and point
    const seg = { id: 'seg1', getSVGPath: () => 'M 0 0 L 1 1', getSVGPath: () => 'M 0 0 L 1 1' };
    const pt = { id: 'pt1' };
    app.mainCanvasLayer.segments.push(seg);
    app.mainCanvasLayer.points.push(pt);

    const shape = new Shape({ layer: 'main', segmentIds: ['seg1'], pointIds: ['pt1'] });
    const data = shape.saveData();
    expect(data.segmentIds).toEqual(['seg1']);
    expect(data.pointIds).toEqual(['pt1']);
    expect(data.path).toBeDefined();
  });

  it('translate moves all points', () => {
    // create a simple shape with two points
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const shape = new Shape({ layer: 'main', segmentIds: [seg.id], pointIds: seg.vertexIds });

    const initialX = shape.points[0].x;
    shape.translate(new Coordinates({ x: 5, y: 3 }));
    expect(shape.points[0].x).toBeCloseTo(initialX + 5);
  });

  it('rotate rotates all points', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 10, y: 0 }, { x: 20, y: 0 }] });
    const shape = new Shape({ layer: 'main', segmentIds: [seg.id], pointIds: seg.vertexIds });

    shape.rotate(Math.PI / 2, new Coordinates({ x: 0, y: 0 }));
    // first point at (10,0) should rotate to approximately (0,10)
    expect(shape.points[0].coordinates.x).toBeCloseTo(0);
    expect(shape.points[0].coordinates.y).toBeCloseTo(10);
  });

  it('homothety scales around center', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 10, y: 10 }, { x: 20, y: 10 }] });
    const shape = new Shape({ layer: 'main', segmentIds: [seg.id], pointIds: seg.vertexIds });

    const initialX = shape.points[0].x;
    const initialY = shape.points[0].y;
    shape.homothety(2, new Coordinates({ x: 0, y: 0 }));
    expect(shape.points[0].x).toBeCloseTo(initialX * 2);
    expect(shape.points[0].y).toBeCloseTo(initialY * 2);
  });

  it('scale multiplies coordinates', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 10, y: 10 }, { x: 20, y: 10 }] });
    const shape = new Shape({ layer: 'main', segmentIds: [seg.id], pointIds: seg.vertexIds });

    const initialX = shape.points[0].x;
    shape.scale(3);
    expect(shape.points[0].x).toBeCloseTo(initialX * 3);
  });
});
