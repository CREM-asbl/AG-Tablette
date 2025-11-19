import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => {
  const main = { segments: [], points: [], shapes: [] };
  return { 
    app: { 
      mainCanvasLayer: main, 
      settings: { areShapesPointed: false }, 
      environment: { name: 'Test' },
      workspace: { zoomLevel: 1, translateOffset: { x: 0, y: 0 } }
    } 
  };
});

vi.mock('@controllers/Core/Tools/general', () => ({
  addInfoToId: (id) => id,
  getComplementaryColor: (color) => color,
  mod: (x, n) => ((x % n) + n) % n,
  removeObjectById: vi.fn(),
  uniqId: () => 'unique_id_' + Math.random(),
  findObjectById: vi.fn(),
  isAlmostInfinite: (n) => !isFinite(n) || Math.abs(n) > 1e10,
}));

vi.mock('@controllers/GeometryTools/deleteShape', () => ({
  deleteChildren: vi.fn(),
}));

import { app } from '@controllers/Core/App';
import { Coordinates } from '@controllers/Core/Objects/Coordinates';
import { Segment } from '@controllers/Core/Objects/Segment';
import { Shape } from '@controllers/Core/Objects/Shapes/Shape';
import { Point } from '@controllers/Core/Objects/Point';
import { findObjectById } from '@controllers/Core/Tools/general';

describe('Shape basic', () => {
  beforeEach(() => {
    // reset arrays
    app.mainCanvasLayer.segments.length = 0;
    app.mainCanvasLayer.points.length = 0;
    app.mainCanvasLayer.shapes.length = 0;
    vi.clearAllMocks();
    
    findObjectById.mockImplementation((id) => {
      const all = [...app.mainCanvasLayer.points, ...app.mainCanvasLayer.segments, ...app.mainCanvasLayer.shapes];
      return all.find(obj => obj.id === id);
    });
  });

  it('constructor initializes correctly', () => {
    const shape = new Shape({ layer: 'main', id: 'shape1' });
    expect(shape.id).toBe('shape1');
    expect(shape.layer).toBe('main');
    expect(app.mainCanvasLayer.shapes).toContain(shape);
  });

  it('getters return correct objects', () => {
    const pt1 = new Point({ layer: 'main', x: 0, y: 0, type: 'vertex' });
    const pt2 = new Point({ layer: 'main', x: 10, y: 0, type: 'vertex' });
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt1.coordinates, pt2.coordinates] });
    // Manually link for test since we are mocking
    seg.vertexIds = [pt1.id, pt2.id];
    
    // We need to ensure points are in the layer
    app.mainCanvasLayer.points = [pt1, pt2];
    app.mainCanvasLayer.segments = [seg];

    const shape = new Shape({ layer: 'main', segmentIds: [seg.id], pointIds: [pt1.id, pt2.id] });

    expect(shape.segments).toHaveLength(1);
    expect(shape.segments[0].id).toBe(seg.id);
    expect(shape.points).toHaveLength(2);
    expect(shape.vertexes).toHaveLength(2);
    expect(shape.center).toBeUndefined(); // No center defined yet
  });

  it('centerCoordinates calculates correctly for polygon', () => {
    const pt1 = new Point({ layer: 'main', coordinates: { x: 0, y: 0 }, type: 'vertex' });
    const pt2 = new Point({ layer: 'main', coordinates: { x: 10, y: 0 }, type: 'vertex' });
    const pt3 = new Point({ layer: 'main', coordinates: { x: 0, y: 10 }, type: 'vertex' });
    app.mainCanvasLayer.points = [pt1, pt2, pt3];
    
    const shape = new Shape({ layer: 'main', pointIds: [pt1.id, pt2.id, pt3.id] });
    
    const center = shape.centerCoordinates;
    expect(center.x).toBeCloseTo(10/3);
    expect(center.y).toBeCloseTo(10/3);
  });

  it('contains works for Point', () => {
    const pt1 = new Point({ layer: 'main', coordinates: { x: 0, y: 0 }, type: 'vertex' });
    const pt2 = new Point({ layer: 'main', coordinates: { x: 10, y: 0 }, type: 'vertex' });
    const pt3 = new Point({ layer: 'main', coordinates: { x: 0, y: 10 }, type: 'vertex' });
    app.mainCanvasLayer.points = [pt1, pt2, pt3];
    
    const shape = new Shape({ layer: 'main', pointIds: [pt1.id, pt2.id, pt3.id] });
    
    expect(shape.contains(pt1)).toBe(true);
    
    const otherPt = new Point({ layer: 'main', coordinates: { x: 100, y: 100 }, type: 'vertex' });
    expect(shape.contains(otherPt)).toBe(false);
  });

  it('contains works for Segment', () => {
    const pt1 = new Point({ layer: 'main', coordinates: { x: 0, y: 0 }, type: 'vertex' });
    const pt2 = new Point({ layer: 'main', coordinates: { x: 10, y: 0 }, type: 'vertex' });
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt1.coordinates, pt2.coordinates] });
    seg.vertexIds = [pt1.id, pt2.id];
    
    app.mainCanvasLayer.points = [pt1, pt2];
    app.mainCanvasLayer.segments = [seg];
    
    const shape = new Shape({ layer: 'main', segmentIds: [seg.id], pointIds: [pt1.id, pt2.id] });
    
    expect(shape.contains(seg)).toBe(true);
    
    const otherSeg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [{x:0, y:0}, {x:0, y:10}] });
    expect(shape.contains(otherSeg)).toBe(false);
  });

  it('contains works for Coordinates', () => {
    const pt1 = new Point({ layer: 'main', coordinates: { x: 0, y: 0 }, type: 'vertex' });
    app.mainCanvasLayer.points = [pt1];
    const shape = new Shape({ layer: 'main', pointIds: [pt1.id] });
    
    expect(shape.contains(new Coordinates({ x: 0, y: 0 }))).toBe(true);
    expect(shape.contains(new Coordinates({ x: 10, y: 10 }))).toBe(false);
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

  it('overlapsWith detects overlapping shapes', () => {
    // Shape 1: Square at 0,0 size 10
    const pt1 = new Point({ layer: 'main', coordinates: { x: 0, y: 0 }, type: 'vertex' });
    const pt2 = new Point({ layer: 'main', coordinates: { x: 10, y: 0 }, type: 'vertex' });
    const pt3 = new Point({ layer: 'main', coordinates: { x: 10, y: 10 }, type: 'vertex' });
    const pt4 = new Point({ layer: 'main', coordinates: { x: 0, y: 10 }, type: 'vertex' });
    
    const seg1 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt1.coordinates, pt2.coordinates] });
    const seg2 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt2.coordinates, pt3.coordinates] });
    const seg3 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt3.coordinates, pt4.coordinates] });
    const seg4 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt4.coordinates, pt1.coordinates] });
    
    seg1.vertexIds = [pt1.id, pt2.id];
    seg2.vertexIds = [pt2.id, pt3.id];
    seg3.vertexIds = [pt3.id, pt4.id];
    seg4.vertexIds = [pt4.id, pt1.id];

    app.mainCanvasLayer.points = [pt1, pt2, pt3, pt4];
    app.mainCanvasLayer.segments = [seg1, seg2, seg3, seg4];
    
    const shape1 = new Shape({ layer: 'main', segmentIds: [seg1.id, seg2.id, seg3.id, seg4.id], pointIds: [pt1.id, pt2.id, pt3.id, pt4.id] });

    // Shape 2: Square at 5,5 size 10 (overlaps)
    const pt5 = new Point({ layer: 'main', coordinates: { x: 5, y: 5 }, type: 'vertex' });
    const pt6 = new Point({ layer: 'main', coordinates: { x: 15, y: 5 }, type: 'vertex' });
    const pt7 = new Point({ layer: 'main', coordinates: { x: 15, y: 15 }, type: 'vertex' });
    const pt8 = new Point({ layer: 'main', coordinates: { x: 5, y: 15 }, type: 'vertex' });

    const seg5 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt5.coordinates, pt6.coordinates] });
    const seg6 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt6.coordinates, pt7.coordinates] });
    const seg7 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt7.coordinates, pt8.coordinates] });
    const seg8 = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt8.coordinates, pt5.coordinates] });

    seg5.vertexIds = [pt5.id, pt6.id];
    seg6.vertexIds = [pt6.id, pt7.id];
    seg7.vertexIds = [pt7.id, pt8.id];
    seg8.vertexIds = [pt8.id, pt5.id];

    app.mainCanvasLayer.points.push(pt5, pt6, pt7, pt8);
    app.mainCanvasLayer.segments.push(seg5, seg6, seg7, seg8);

    const shape2 = new Shape({ layer: 'main', segmentIds: [seg5.id, seg6.id, seg7.id, seg8.id], pointIds: [pt5.id, pt6.id, pt7.id, pt8.id] });

    expect(shape1.overlapsWith(shape2)).toBe(true);
  });

  it('toSVG generates path', () => {
    const pt1 = new Point({ layer: 'main', coordinates: { x: 0, y: 0 }, type: 'vertex' });
    const pt2 = new Point({ layer: 'main', coordinates: { x: 10, y: 0 }, type: 'vertex' });
    const seg = new Segment({ layer: 'main', createFromNothing: true, vertexCoordinates: [pt1.coordinates, pt2.coordinates] });
    seg.vertexIds = [pt1.id, pt2.id];
    app.mainCanvasLayer.points = [pt1, pt2];
    app.mainCanvasLayer.segments = [seg];
    
    const shape = new Shape({ layer: 'main', segmentIds: [seg.id], pointIds: [pt1.id, pt2.id] });
    
    const svg = shape.toSVG();
    expect(svg).toContain('<path');
    expect(svg).toContain('d="');
  });
});
