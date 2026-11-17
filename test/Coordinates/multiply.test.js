import { describe, expect, it } from 'vitest';
import { Coordinates } from '../../src/controllers/Core/Objects/Coordinates.js';

describe('Coordinates', () => {
  describe('multiply', () => {
    it('should return the same coordinates when multiplied by 1', () => {
      const coord = new Coordinates({ x: 2, y: 4 });
      const result = coord.multiply(1);
      expect(result).toEqual(new Coordinates({ x: 2, y: 4 }));
    });

    it('should correctly multiply coordinates by a positive number', () => {
      const coord = new Coordinates({ x: 2, y: 4 });
      const result = coord.multiply(3);
      expect(result).toEqual(new Coordinates({ x: 6, y: 12 }));
    });

    it('should correctly multiply coordinates by a negative number', () => {
      const coord = new Coordinates({ x: 2, y: 4 });
      const result = coord.multiply(-2);
      expect(result).toEqual(new Coordinates({ x: -4, y: -8 }));
    });

    it('should correctly multiply coordinates by zero', () => {
      const coord = new Coordinates({ x: 2, y: 4 });
      const result = coord.multiply(0);
      expect(result).toEqual(new Coordinates({ x: 0, y: 0 }));
    });

    it('should correctly multiply zero coordinates by a number', () => {
      const coord = new Coordinates({ x: 0, y: 0 });
      const result = coord.multiply(5);
      expect(result).toEqual(new Coordinates({ x: 0, y: 0 }));
    });

    it('should correctly multiply coordinates by a decimal number', () => {
      const coord = new Coordinates({ x: 2, y: 4 });
      const result = coord.multiply(0.5);
      expect(result).toEqual(new Coordinates({ x: 1, y: 2 }));
    });
  });
});
