import { describe, expect, it } from 'vitest';
import { Coordinates } from '../../src/controllers/Core/Objects/Coordinates.js';

describe('Coordinates', () => {
  describe('equal', () => {
    it('should return true for equal coordinates', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 2, y: 4 });
      expect(coord1.equal(coord2)).toBe(true);
    });

    it('should return false for different x coordinates', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 3, y: 4 });
      expect(coord1.equal(coord2)).toBe(false);
    });

    it('should return false for different y coordinates', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 2, y: 5 });
      expect(coord1.equal(coord2)).toBe(false);
    });

    it('should return true when difference is within tolerance', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 2.2, y: 4.2 });
      expect(coord1.equal(coord2, 0.3)).toBe(true); // dist is ~0.2828, 0.2828 <= 0.3 is true
    });

    it('should return true when x difference is within tolerance and y is exact', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 2.5, y: 4 });
      expect(coord1.equal(coord2, 0.6)).toBe(true);
    });

    it('should return true when y difference is within tolerance and x is exact', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 2, y: 4.5 });
      expect(coord1.equal(coord2, 0.6)).toBe(true);
    });

    it('should return false when difference is outside tolerance', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 3, y: 4 });
      expect(coord1.equal(coord2, 0.5)).toBe(false);
    });

    it('should return false when x difference is outside tolerance', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 3, y: 4 });
      expect(coord1.equal(coord2, 0.9)).toBe(false);
    });

    it('should return false when y difference is outside tolerance', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 2, y: 5 });
      expect(coord1.equal(coord2, 0.9)).toBe(false);
    });

    it('should handle zero tolerance correctly', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 2.00001, y: 4.00001 });
      expect(coord1.equal(coord2, 0)).toBe(false);
      expect(coord1.equal(new Coordinates({ x: 2, y: 4 }), 0)).toBe(true);
    });
  });
});
