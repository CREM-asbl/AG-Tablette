import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => ({
  app: {
    workspace: {
      zoomLevel: 1,
      translateOffset: { x: 0, y: 0 },
    },
  },
}));

import { app } from '@controllers/Core/App';
import { Coordinates } from '@controllers/Core/Objects/Coordinates';

describe('Coordinates', () => {
  beforeEach(() => {
    app.workspace.zoomLevel = 1;
    app.workspace.translateOffset = { x: 0, y: 0 };
  });

  it('constructor initializes correctly', () => {
    const c = new Coordinates({ x: 1, y: 2 });
    expect(c.x).toBe(1);
    expect(c.y).toBe(2);
  });

  it('add works', () => {
    const c1 = new Coordinates({ x: 1, y: 2 });
    const c2 = new Coordinates({ x: 3, y: 4 });
    const res = c1.add(c2);
    expect(res.x).toBe(4);
    expect(res.y).toBe(6);
  });

  it('substract works', () => {
    const c1 = new Coordinates({ x: 3, y: 4 });
    const c2 = new Coordinates({ x: 1, y: 2 });
    const res = c1.substract(c2);
    expect(res.x).toBe(2);
    expect(res.y).toBe(2);
  });

  it('multiply works', () => {
    const c = new Coordinates({ x: 1, y: 2 });
    const res = c.multiply(2);
    expect(res.x).toBe(2);
    expect(res.y).toBe(4);
    
    const res2 = c.multiply(2, 3);
    expect(res2.x).toBe(2);
    expect(res2.y).toBe(6);
  });

  it('equal works', () => {
    const c1 = new Coordinates({ x: 1, y: 2 });
    const c2 = new Coordinates({ x: 1, y: 2 });
    const c3 = new Coordinates({ x: 1.000001, y: 2 });
    const c4 = new Coordinates({ x: 2, y: 2 });

    expect(c1.equal(c2)).toBe(true);
    expect(c1.equal(c3)).toBe(true); // Default precision
    expect(c1.equal(c4)).toBe(false);
  });

  it('angleWith works', () => {
    const c1 = new Coordinates({ x: 0, y: 0 });
    const c2 = new Coordinates({ x: 1, y: 0 });
    const c3 = new Coordinates({ x: 0, y: 1 });
    
    expect(c1.angleWith(c2)).toBeCloseTo(0);
    expect(c1.angleWith(c3)).toBeCloseTo(Math.PI / 2);
  });

  it('middleWith works', () => {
    const c1 = new Coordinates({ x: 0, y: 0 });
    const c2 = new Coordinates({ x: 10, y: 10 });
    const mid = c1.middleWith(c2);
    expect(mid.x).toBe(5);
    expect(mid.y).toBe(5);
  });

  it('rotate works', () => {
    const c = new Coordinates({ x: 10, y: 0 });
    const center = new Coordinates({ x: 0, y: 0 });
    const res = c.rotate(Math.PI / 2, center);
    expect(res.x).toBeCloseTo(0);
    expect(res.y).toBeCloseTo(10);
  });

  it('dist works', () => {
    const c1 = new Coordinates({ x: 0, y: 0 });
    const c2 = new Coordinates({ x: 3, y: 4 });
    expect(c1.dist(c2)).toBe(5);
  });

  it('toCanvasCoordinates works', () => {
    app.workspace.zoomLevel = 2;
    app.workspace.translateOffset = { x: 10, y: 20 };
    const c = new Coordinates({ x: 5, y: 5 });
    const res = c.toCanvasCoordinates();
    // (5*2)+10 = 20, (5*2)+20 = 30
    expect(res.x).toBe(20);
    expect(res.y).toBe(30);
  });

  it('fromCanvasCoordinates works', () => {
    app.workspace.zoomLevel = 2;
    app.workspace.translateOffset = { x: 10, y: 20 };
    const c = new Coordinates({ x: 20, y: 30 });
    const res = c.fromCanvasCoordinates();
    // (20-10)/2 = 5, (30-20)/2 = 5
    expect(res.x).toBe(5);
    expect(res.y).toBe(5);
  });
});
