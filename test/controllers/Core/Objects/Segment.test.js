import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => {
  const main = { segments: [], points: [], shapes: [] };
  return { app: { mainCanvasLayer: main } };
});

import { app } from '@controllers/Core/App';
import { Coordinates } from '@controllers/Core/Objects/Coordinates';
import { Segment } from '@controllers/Core/Objects/Segment';

const mockMainCanvasLayer = app.mainCanvasLayer;

describe('Segment basic', () => {
  let seg;

  beforeEach(() => {
    // Reset arrays pour éviter pollution entre tests
    mockMainCanvasLayer.segments.length = 0;
    mockMainCanvasLayer.points.length = 0;
    mockMainCanvasLayer.shapes.length = 0;

    // create a straight segment from (0,0) to (10,0)
    seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
  });

  it('length is correct', () => {
    expect(seg.length).toBeCloseTo(10);
  });

  it('projectionOnSegment for point above returns foot', () => {
    const proj = seg.projectionOnSegment(new Coordinates({ x: 5, y: 5 }));
    // projection should lie on the segment
    expect(seg.isCoordinatesOnSegment(proj)).toBe(true);
  });

  it('isCoordinatesOnSegment true for point on segment', () => {
    // use the exact projection to ensure it's considered on the segment
    const proj = seg.projectionOnSegment(new Coordinates({ x: 5, y: 0 }));
    const on = seg.isCoordinatesOnSegment(proj);
    expect(on).toBe(true);
  });

  it('isCoordinatesOnSegment false for point off segment', () => {
    const on = seg.isCoordinatesOnSegment(new Coordinates({ x: 5, y: 2 }));
    expect(on).toBe(false);
  });

  it('direction returns normalized vector', () => {
    const dir = seg.direction;
    expect(dir.x).toBeCloseTo(1);
    expect(dir.y).toBeCloseTo(0);
  });

  it('middle returns midpoint', () => {
    // Créer un segment frais pour éviter toute pollution
    const freshSeg = new Segment({
      layer: 'main',
      createFromNothing: true,
      vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }]
    });
    const mid = freshSeg.middle;
    expect(mid).toBeInstanceOf(Coordinates);
    expect(mid.x).toBeCloseTo(5);
    expect(mid.y).toBeCloseTo(0);
  });

  it('getAngleWithHorizontal returns 0 for horizontal segment', () => {
    const angle = seg.getAngleWithHorizontal();
    expect(angle).toBeCloseTo(0);
  });

  it('divideWith creates subsegments', () => {
    const points = [
      { coordinates: new Coordinates({ x: 3, y: 0 }) },
      { coordinates: new Coordinates({ x: 7, y: 0 }) }
    ];
    const subsegments = seg.divideWith(points);
    expect(subsegments.length).toBe(3);
    expect(subsegments[0].length).toBeCloseTo(3);
    expect(subsegments[1].length).toBeCloseTo(4);
    expect(subsegments[2].length).toBeCloseTo(3);
  });
});

describe('Segment arc methods', () => {
  let arc;

  beforeEach(() => {
    // Reset arrays pour éviter pollution entre tests
    mockMainCanvasLayer.segments.length = 0;
    mockMainCanvasLayer.points.length = 0;
    mockMainCanvasLayer.shapes.length = 0;

    // create an arc with center at (0,0), starting at (10,0), ending at (0,10)
    arc = new Segment({
      layer: 'main',
      createFromNothing: true,
      vertexCoordinates: [{ x: 10, y: 0 }, { x: 0, y: 10 }],
      arcCenterCoordinates: { x: 0, y: 0 }
    });
  });

  it('radius returns correct value', () => {
    expect(arc.radius).toBeCloseTo(10);
  });

  it('centerProjectionOnSegment projects angle onto arc', () => {
    const proj = arc.centerProjectionOnSegment(Math.PI / 4);
    expect(proj.x).toBeCloseTo(10 * Math.cos(Math.PI / 4));
    expect(proj.y).toBeCloseTo(10 * Math.sin(Math.PI / 4));
  });

  it('middle returns arc midpoint', () => {
    const mid = arc.middle;
    // midpoint should be at 45 degrees
    expect(mid.x).toBeCloseTo(10 * Math.cos(Math.PI / 4));
    expect(mid.y).toBeCloseTo(10 * Math.sin(Math.PI / 4));
  });
});
