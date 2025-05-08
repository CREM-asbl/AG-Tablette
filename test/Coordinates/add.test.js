import { describe, expect, it } from 'vitest';
import { Coordinates } from '../../src/controllers/Core/Objects/Coordinates.js';

describe('Coordinates', () => {
  describe('add', () => {
    it('should correctly add two Coordinates objects', () => {
      const coord1 = new Coordinates({ x: 2, y: 4 });
      const coord2 = new Coordinates({ x: 5, y: 1 });
      const result = coord1.add(coord2);
      expect(result).toEqual(new Coordinates({ x: 7, y: 5 }));
    });

    it('should correctly add with negative values', () => {
      const coord1 = new Coordinates({ x: -2, y: 4 });
      const coord2 = new Coordinates({ x: 1, y: -5 });
      const result = coord1.add(coord2);
      expect(result).toEqual(new Coordinates({ x: -1, y: -1 }));
    });

    it('should correctly add with zero values', () => {
      const coord1 = new Coordinates({ x: 0, y: 0 });
      const coord2 = new Coordinates({ x: 5, y: 1 });
      const result = coord1.add(coord2);
      expect(result).toEqual(new Coordinates({ x: 5, y: 1 }));
    });
  });
});
