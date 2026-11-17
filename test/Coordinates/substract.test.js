import { describe, expect, it } from 'vitest';
import { Coordinates } from '../../src/controllers/Core/Objects/Coordinates.js';

describe('Coordinates', () => {
  describe('substract', () => {
    it('should correctly substract two Coordinates objects', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 5, y: 1 });
      const result = coord1.substract(coord2);
      expect(result).toEqual(new Coordinates({ x: -3, y: 3 }));
    });

    it('should correctly substract with negative values', () => {
      const coord1 = new Coordinates({ x: -2, y: 4 });
      const coord2 = new Coordinates({ x: 1, y: -5 });
      const result = coord1.substract(coord2);
      expect(result).toEqual(new Coordinates({ x: -3, y: 9 }));
    });

    it('should correctly substract with zero values', () => {
      const coord1 = new Coordinates({ x: 0, y: 0 });
      const coord2 = new Coordinates({ x: 5, y: 1 });
      const result = coord1.substract(coord2);
      expect(result).toEqual(new Coordinates({ x: -5, y: -1 }));
    });

    it('should correctly substract a coordinate from itself', () => {
      const coord1 = new Coordinates({ x: 5, y: 10 });
      const result = coord1.substract(coord1);
      expect(result).toEqual(new Coordinates({ x: 0, y: 0 }));
    });

    it('should correctly substract zero from a coordinate', () => {
      const coord1 = new Coordinates({ x: 5, y: 10 });
      const zeroCoord = new Coordinates({ x: 0, y: 0 });
      const result = coord1.substract(zeroCoord);
      expect(result).toEqual(new Coordinates({ x: 5, y: 10 }));
    });
  });
});
