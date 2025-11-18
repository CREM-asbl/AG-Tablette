import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => {
  const main = { points: [], segments: [], shapes: [] };
  return {
    app: {
      mainCanvasLayer: main,
      workspace: { zoomLevel: 1 }
    }
  };
});

import { app } from '@controllers/Core/App';
import { Coordinates } from '@controllers/Core/Objects/Coordinates';
import { Point } from '@controllers/Core/Objects/Point';

const mockMainCanvasLayer = app.mainCanvasLayer;

describe('Coordinates basic', () => {
  it('equal compares with tolerance', () => {
    const c1 = new Coordinates({ x: 10, y: 10 });
    const c2 = new Coordinates({ x: 10.0001, y: 10 });
    expect(c1.equal(c2, 0.001)).toBe(true);
    expect(c1.equal(c2, 0.00001)).toBe(false);
  });

  it('dist returns Euclidean distance', () => {
    const c1 = new Coordinates({ x: 0, y: 0 });
    const c2 = new Coordinates({ x: 3, y: 4 });
    expect(c1.dist(c2)).toBeCloseTo(5);
  });
});

describe('Point class', () => {
  beforeEach(() => {
    mockMainCanvasLayer.points = [];
    mockMainCanvasLayer.segments = [];
    mockMainCanvasLayer.shapes = [];
  });

  it('creates point with coordinates', () => {
    const pt = new Point({
      layer: 'main',
      coordinates: { x: 10, y: 20 }
    });
    expect(pt.x).toBe(10);
    expect(pt.y).toBe(20);
    expect(pt.coordinates).toBeInstanceOf(Coordinates);
  });

  it('translate moves point', () => {
    const pt = new Point({
      layer: 'main',
      coordinates: { x: 10, y: 10 }
    });
    pt.translate(new Coordinates({ x: 5, y: 3 }));
    expect(pt.x).toBe(15);
    expect(pt.y).toBe(13);
  });

  it('translate with negativeTranslation subtracts', () => {
    const pt = new Point({
      layer: 'main',
      coordinates: { x: 10, y: 10 }
    });
    pt.translate(new Coordinates({ x: 5, y: 3 }), true);
    expect(pt.x).toBe(5);
    expect(pt.y).toBe(7);
  });

  it('multiply scales coordinates', () => {
    const pt = new Point({
      layer: 'main',
      coordinates: { x: 10, y: 20 }
    });
    pt.multiply(2);
    expect(pt.x).toBe(20);
    expect(pt.y).toBe(40);
  });

  it('multiply with different scalars', () => {
    const pt = new Point({
      layer: 'main',
      coordinates: { x: 10, y: 20 }
    });
    pt.multiply(2, 0.5);
    expect(pt.x).toBe(20);
    expect(pt.y).toBe(10);
  });

  it('rotate rotates point around center', () => {
    const pt = new Point({
      layer: 'main',
      coordinates: { x: 1, y: 0 }
    });
    const result = pt.rotate(Math.PI / 2, { x: 0, y: 0 });
    // rotate modifie le point en place et retourne this
    expect(pt.coordinates.x).toBeCloseTo(0);
    expect(pt.coordinates.y).toBeCloseTo(1);
    expect(result).toBe(pt); // retourne this pour chaining
  });

  it('saveData includes coordinates and ids', () => {
    const pt = new Point({
      layer: 'main',
      coordinates: { x: 10, y: 20 },
      segmentIds: ['seg1', 'seg2']
    });
    const data = pt.saveData();
    expect(data.coordinates).toBeInstanceOf(Coordinates);
    expect(data.segmentIds).toEqual(['seg1', 'seg2']);
    expect(data.id).toBeDefined();
  });

  it('toSVG returns circle element', () => {
    vi.spyOn(Coordinates.prototype, 'toCanvasCoordinates').mockReturnValue({ x: 100, y: 200 });
    const pt = new Point({
      layer: 'main',
      coordinates: { x: 10, y: 20 },
      color: '#ff0000',
      size: 2
    });
    const svg = pt.toSVG();
    expect(svg).toContain('circle');
    expect(svg).toContain('cx="100"');
    expect(svg).toContain('cy="200"');
    expect(svg).toContain('fill="#ff0000"');
  });
});
