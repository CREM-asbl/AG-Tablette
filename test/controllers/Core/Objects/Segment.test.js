import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => {
  const main = { segments: [], points: [], shapes: [] };
  return { app: { mainCanvasLayer: main } };
});

vi.mock('@controllers/Core/Tools/general', () => ({
  addInfoToId: (id) => id,
  uniqId: () => 'unique_id_' + Math.random(),
  mod: (n, m) => ((n % m) + m) % m,
  findObjectById: vi.fn(),
  removeObjectById: vi.fn(),
  isAlmostInfinite: (n) => !isFinite(n) || Math.abs(n) > 1000000000
}));

// Initialiser window.app après mock pour Segment/Point qui y accèdent directement
import { app } from '@controllers/Core/App';
import { Coordinates } from '@controllers/Core/Objects/Coordinates';
import { Point } from '@controllers/Core/Objects/Point';
import { Segment } from '@controllers/Core/Objects/Segment';
import { findObjectById } from '@controllers/Core/Tools/general';
window.app = app;

const mockMainCanvasLayer = app.mainCanvasLayer;

describe('Segment basic', () => {
  let seg;

  beforeEach(() => {
    findObjectById.mockImplementation((id) => {
      const allObjects = [
        ...mockMainCanvasLayer.points,
        ...mockMainCanvasLayer.segments,
        ...mockMainCanvasLayer.shapes
      ];
      return allObjects.find(obj => obj.id === id);
    });

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
    findObjectById.mockImplementation((id) => {
      const allObjects = [
        ...mockMainCanvasLayer.points,
        ...mockMainCanvasLayer.segments,
        ...mockMainCanvasLayer.shapes
      ];
      return allObjects.find(obj => obj.id === id);
    });

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

describe('Segment advanced', () => {
  beforeEach(() => {
    mockMainCanvasLayer.segments.length = 0;
    mockMainCanvasLayer.points.length = 0;
    mockMainCanvasLayer.shapes.length = 0;
    vi.clearAllMocks();

    findObjectById.mockImplementation((id) => {
      const allObjects = [
        ...mockMainCanvasLayer.points,
        ...mockMainCanvasLayer.segments,
        ...mockMainCanvasLayer.shapes
      ];
      return allObjects.find(obj => obj.id === id);
    });
  });

  it('intersectionWith returns intersection point', () => {
    const seg1 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 10 }] });
    const seg2 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 10 }, { x: 10, y: 0 }] });

    const intersection = seg1.intersectionWith(seg2);
    expect(intersection).toHaveLength(1);
    expect(intersection[0].x).toBeCloseTo(5);
    expect(intersection[0].y).toBeCloseTo(5);
  });

  it('intersectionWith returns null for parallel segments', () => {
    const seg1 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const seg2 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 1 }, { x: 10, y: 1 }] });

    const intersection = seg1.intersectionWith(seg2);
    expect(intersection).toBeNull();
  });

  it('doesIntersect returns true if intersecting', () => {
    const seg1 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 10 }] });
    const seg2 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 10 }, { x: 10, y: 0 }] });

    expect(seg1.doesIntersect(seg2)).toBe(true);
  });

  it('contains returns true for point on segment', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const vertex = seg.vertexes[0];

    expect(seg.contains(vertex)).toBe(true);
  });

  it('contains returns false for point off segment', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const pt = new Point({ layer: 'main', coordinates: { x: 5, y: 5 } });

    expect(seg.contains(pt)).toBe(false);
  });

  it('equal returns true for same segment', () => {
    const seg1 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const seg2 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });

    expect(seg1.equal(seg2)).toBe(true);
  });

  it('equal returns true for reversed segment', () => {
    const seg1 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const seg2 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 10, y: 0 }, { x: 0, y: 0 }] });

    expect(seg1.equal(seg2)).toBe(true);
  });

  it('scale scales segment', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    seg.scale(2);
    expect(seg.length).toBeCloseTo(20);
    expect(seg.vertexes[1].x).toBeCloseTo(20);
  });

  it('translate translates segment', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    seg.translate(new Coordinates({ x: 5, y: 5 }));
    expect(seg.vertexes[0].x).toBeCloseTo(5);
    expect(seg.vertexes[0].y).toBeCloseTo(5);
    expect(seg.vertexes[1].x).toBeCloseTo(15);
    expect(seg.vertexes[1].y).toBeCloseTo(5);
  });

  it('reverse reverses segment', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const v0Id = seg.vertexIds[0];
    const v1Id = seg.vertexIds[1];

    seg.reverse();

    expect(seg.vertexIds[0]).toBe(v1Id);
    expect(seg.vertexIds[1]).toBe(v0Id);
  });

  it('getSVGPath returns correct path for line', () => {
    vi.spyOn(Coordinates.prototype, 'toCanvasCoordinates').mockImplementation(function () { return this; });
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });

    const path = seg.getSVGPath();
    expect(path).toContain('M 0 0');
    expect(path).toContain('L 10 0');
  });

  it('addPoint adds a division point', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const pt = seg.addPoint(new Coordinates({ x: 5, y: 0 }), 0.5, seg.vertexIds[0], seg.vertexIds[1]);

    expect(seg.divisionPointIds).toHaveLength(1);
    expect(pt.coordinates.x).toBeCloseTo(5);
    expect(pt.ratio).toBeCloseTo(0.5);
  });

  it('sortDivisionPoints sorts points by ratio', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const pt1 = seg.addPoint(new Coordinates({ x: 7, y: 0 }), 0.7, seg.vertexIds[0], seg.vertexIds[1]);
    const pt2 = seg.addPoint(new Coordinates({ x: 3, y: 0 }), 0.3, seg.vertexIds[0], seg.vertexIds[1]);

    seg.sortDivisionPoints();

    expect(seg.divisionPointIds[0]).toBe(pt2.id);
    expect(seg.divisionPointIds[1]).toBe(pt1.id);
  });

  it('deletePoint removes point', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const pt = seg.addPoint(new Coordinates({ x: 5, y: 0 }), 0.5, seg.vertexIds[0], seg.vertexIds[1]);

    // Mock shape.pointIds because deletePoint tries to remove from shape
    const shape = { pointIds: [pt.id] };
    vi.spyOn(seg, 'shape', 'get').mockReturnValue(shape);

    seg.deletePoint(pt);

    expect(seg.divisionPointIds).toHaveLength(0);
    expect(shape.pointIds).toHaveLength(0);
  });

  it('isSubsegment returns true for subsegment', () => {
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const subseg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 2, y: 0 }, { x: 8, y: 0 }] });

    expect(seg.isSubsegment(subseg)).toBe(true);
  });

  it('isParalleleWith returns true for parallel segments', () => {
    const seg1 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const seg2 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 1 }, { x: 10, y: 1 }] });

    expect(seg1.isParalleleWith(seg2)).toBe(true);
  });

  it('hasSameDirection returns true for same direction', () => {
    const seg1 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const seg2 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 1 }, { x: 10, y: 1 }] });

    expect(seg1.hasSameDirection(seg2)).toBe(true);
  });

  it('hasSameDirection returns false for opposite direction', () => {
    const seg1 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const seg2 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{ x: 10, y: 1 }, { x: 0, y: 1 }] });

    expect(seg1.hasSameDirection(seg2)).toBe(false);
  });

  it('getSVGPath returns correct path for arc', () => {
    vi.spyOn(Coordinates.prototype, 'toCanvasCoordinates').mockImplementation(function () { return this; });
    const arc = new Segment({
      layer: 'main',
      createFromNothing: true,
      vertexCoordinates: [{ x: 10, y: 0 }, { x: 0, y: 10 }],
      arcCenterCoordinates: { x: 0, y: 0 }
    });

    const path = arc.getSVGPath();
    expect(path).toContain('A 10 10');
  });
});
